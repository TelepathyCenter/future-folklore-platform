-- =============================================================================
-- Future Folklore Platform — Migration 0003
-- Layer 2.1: Knowledge Graph (concepts, graph_edges)
-- =============================================================================

-- Enable trigram extension for fuzzy search on concept names
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ---------------------------------------------------------------------------
-- ENUM TYPES
-- ---------------------------------------------------------------------------

CREATE TYPE node_type AS ENUM (
  'profile',
  'project',
  'organization',
  'concept',
  'call'
);

CREATE TYPE edge_type AS ENUM (
  -- Profile relationships
  'works_on',            -- profile -> project
  'member_of',           -- profile -> organization
  'interested_in',       -- profile -> concept
  'expert_in',           -- profile -> concept
  'mentors',             -- profile -> profile
  'collaborates_with',   -- profile -> profile
  -- Project relationships
  'explores',            -- project -> concept
  'funded_by',           -- project -> organization
  'builds_on',           -- project -> project
  'related_to',          -- any -> any (generic)
  -- Concept relationships
  'subtopic_of',         -- concept -> concept (hierarchy)
  'related_concept',     -- concept -> concept (lateral)
  -- Call relationships
  'discussed_in',        -- concept -> call
  'presented_at'         -- profile -> call
);

-- ---------------------------------------------------------------------------
-- TABLE: concepts (first-class knowledge nodes)
-- ---------------------------------------------------------------------------

CREATE TABLE public.concepts (
  id           uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text           NOT NULL,
  slug         text           NOT NULL UNIQUE,
  description  text,
  parent_id    uuid           REFERENCES public.concepts(id) ON DELETE SET NULL,
  is_canonical boolean        NOT NULL DEFAULT false,
  created_by   uuid           NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at   timestamptz    NOT NULL DEFAULT now(),
  updated_at   timestamptz    NOT NULL DEFAULT now()
);

CREATE INDEX concepts_slug_idx       ON public.concepts (slug);
CREATE INDEX concepts_parent_id_idx  ON public.concepts (parent_id) WHERE parent_id IS NOT NULL;
CREATE INDEX concepts_name_trgm_idx  ON public.concepts USING GIN (name gin_trgm_ops);
CREATE INDEX concepts_created_by_idx ON public.concepts (created_by);

CREATE TRIGGER concepts_updated_at
  BEFORE UPDATE ON public.concepts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ---------------------------------------------------------------------------
-- TABLE: graph_edges (polymorphic source/target)
-- ---------------------------------------------------------------------------

CREATE TABLE public.graph_edges (
  id           uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type  node_type      NOT NULL,
  source_id    uuid           NOT NULL,
  target_type  node_type      NOT NULL,
  target_id    uuid           NOT NULL,
  edge_type    edge_type      NOT NULL,
  weight       smallint       NOT NULL DEFAULT 1 CHECK (weight BETWEEN 1 AND 10),
  notes        text,
  created_by   uuid           NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at   timestamptz    NOT NULL DEFAULT now(),
  updated_at   timestamptz    NOT NULL DEFAULT now(),

  -- Prevent duplicate edges (same source, target, and type)
  CONSTRAINT graph_edges_unique UNIQUE (source_type, source_id, target_type, target_id, edge_type),
  -- Prevent self-loops
  CONSTRAINT graph_edges_no_self_loop CHECK (
    NOT (source_type = target_type AND source_id = target_id)
  )
);

CREATE INDEX graph_edges_source_idx     ON public.graph_edges (source_type, source_id);
CREATE INDEX graph_edges_target_idx     ON public.graph_edges (target_type, target_id);
CREATE INDEX graph_edges_type_idx       ON public.graph_edges (edge_type);
CREATE INDEX graph_edges_created_by_idx ON public.graph_edges (created_by);

CREATE TRIGGER graph_edges_updated_at
  BEFORE UPDATE ON public.graph_edges
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ---------------------------------------------------------------------------
-- ROW LEVEL SECURITY: concepts
-- ---------------------------------------------------------------------------

ALTER TABLE public.concepts ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read concepts (taxonomy is public knowledge)
CREATE POLICY "concepts: auth can read"
  ON public.concepts FOR SELECT TO authenticated
  USING (true);

-- Authenticated users can create concepts
CREATE POLICY "concepts: auth can create"
  ON public.concepts FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Creator can update their own non-canonical concepts
CREATE POLICY "concepts: creator can update non-canonical"
  ON public.concepts FOR UPDATE TO authenticated
  USING (auth.uid() = created_by AND NOT is_canonical)
  WITH CHECK (auth.uid() = created_by AND NOT is_canonical);

-- Creator can delete their own non-canonical concepts
CREATE POLICY "concepts: creator can delete non-canonical"
  ON public.concepts FOR DELETE TO authenticated
  USING (auth.uid() = created_by AND NOT is_canonical);

-- ---------------------------------------------------------------------------
-- ROW LEVEL SECURITY: graph_edges
-- ---------------------------------------------------------------------------

ALTER TABLE public.graph_edges ENABLE ROW LEVEL SECURITY;

-- Edge visibility: auth can read edges touching concepts, own profile,
-- public/community projects, organizations, or edges they created
CREATE POLICY "graph_edges: auth can read visible edges"
  ON public.graph_edges FOR SELECT TO authenticated
  USING (
    -- Edges involving concepts are always visible
    source_type = 'concept' OR target_type = 'concept'
    -- Edges involving the user's own profile
    OR (source_type = 'profile' AND source_id = auth.uid())
    OR (target_type = 'profile' AND target_id = auth.uid())
    -- Edges involving public/community projects
    OR (source_type = 'project' AND EXISTS (
      SELECT 1 FROM public.projects p WHERE p.id = source_id
        AND p.visibility IN ('public', 'community')
    ))
    OR (target_type = 'project' AND EXISTS (
      SELECT 1 FROM public.projects p WHERE p.id = target_id
        AND p.visibility IN ('public', 'community')
    ))
    -- Edges involving organizations (always visible to auth)
    OR source_type = 'organization'
    OR target_type = 'organization'
    -- Edges created by the user
    OR created_by = auth.uid()
  );

-- Authenticated users can create edges
CREATE POLICY "graph_edges: auth can create"
  ON public.graph_edges FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Creator can update their own edges
CREATE POLICY "graph_edges: creator can update"
  ON public.graph_edges FOR UPDATE TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

-- Creator can delete their own edges
CREATE POLICY "graph_edges: creator can delete"
  ON public.graph_edges FOR DELETE TO authenticated
  USING (auth.uid() = created_by);

-- ---------------------------------------------------------------------------
-- SEED: Canonical concepts from existing DOMAIN_TAGS
-- ---------------------------------------------------------------------------

DO $$
DECLARE
  system_user_id uuid;
BEGIN
  SELECT id INTO system_user_id FROM public.profiles ORDER BY created_at ASC LIMIT 1;
  IF system_user_id IS NULL THEN
    RAISE NOTICE 'No profiles found — skipping concept seeding';
    RETURN;
  END IF;

  INSERT INTO public.concepts (name, slug, description, is_canonical, created_by) VALUES
    ('Consciousness',      'consciousness',      'The study of consciousness, awareness, and subjective experience',                             true, system_user_id),
    ('Remote Viewing',     'remote-viewing',      'The practice of seeking impressions about a distant or unseen subject',                        true, system_user_id),
    ('Psi',                'psi',                 'Parapsychological phenomena including telepathy, precognition, and psychokinesis',              true, system_user_id),
    ('Quantum Biology',    'quantum-biology',     'Quantum mechanical processes in biological systems',                                           true, system_user_id),
    ('AI Agents',          'ai-agents',           'Autonomous AI systems and multi-agent orchestration',                                          true, system_user_id),
    ('Blockchain',         'blockchain',          'Distributed ledger technology and decentralized applications',                                 true, system_user_id),
    ('DeSci',              'desci',               'Decentralized science and open research infrastructure',                                      true, system_user_id),
    ('Phenomenology',      'phenomenology',       'The philosophical study of the structures of experience and consciousness',                    true, system_user_id),
    ('Neuroscience',       'neuroscience',        'The scientific study of the nervous system',                                                   true, system_user_id),
    ('Philosophy of Mind', 'philosophy-of-mind',  'Philosophical examination of the nature of mind, mental events, and consciousness',            true, system_user_id)
  ON CONFLICT (slug) DO NOTHING;

  -- Create hierarchy: subtopics of consciousness
  INSERT INTO public.graph_edges (source_type, source_id, target_type, target_id, edge_type, created_by)
  SELECT 'concept'::node_type, s.id, 'concept'::node_type, t.id, 'subtopic_of'::edge_type, system_user_id
  FROM public.concepts s, public.concepts t
  WHERE (s.slug = 'remote-viewing'  AND t.slug = 'consciousness')
     OR (s.slug = 'psi'             AND t.slug = 'consciousness')
     OR (s.slug = 'phenomenology'   AND t.slug = 'consciousness')
  ON CONFLICT ON CONSTRAINT graph_edges_unique DO NOTHING;

  -- Related concepts
  INSERT INTO public.graph_edges (source_type, source_id, target_type, target_id, edge_type, created_by)
  SELECT 'concept'::node_type, s.id, 'concept'::node_type, t.id, 'related_concept'::edge_type, system_user_id
  FROM public.concepts s, public.concepts t
  WHERE (s.slug = 'blockchain'  AND t.slug = 'desci')
     OR (s.slug = 'neuroscience' AND t.slug = 'consciousness')
  ON CONFLICT ON CONSTRAINT graph_edges_unique DO NOTHING;
END $$;
