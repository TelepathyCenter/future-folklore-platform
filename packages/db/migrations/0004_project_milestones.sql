-- =============================================================================
-- Future Folklore Platform — Migration 0004
-- Layer 2.2: Project Milestones (hash-verified timestamping MVP)
-- =============================================================================

-- ---------------------------------------------------------------------------
-- ENUM: milestone_status
-- ---------------------------------------------------------------------------

CREATE TYPE milestone_status AS ENUM (
  'recorded',     -- Hash created, stored in Supabase only
  'anchored',     -- Future: hash anchored on a blockchain
  'verified'      -- Future: independently verified on-chain
);

-- ---------------------------------------------------------------------------
-- TABLE: project_milestones
-- ---------------------------------------------------------------------------

CREATE TABLE public.project_milestones (
  id              uuid               PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      uuid               NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title           text               NOT NULL,
  description     text,
  evidence_url    text,

  -- Hash fields (MVP: SHA-256 computed server-side)
  content_hash    text               NOT NULL,
  hash_algorithm  text               NOT NULL DEFAULT 'SHA-256',
  status          milestone_status   NOT NULL DEFAULT 'recorded',

  -- Future blockchain anchoring fields (nullable until anchoring is implemented)
  proof_tx        text,
  anchor_chain    text,
  anchored_at     timestamptz,

  created_by      uuid               NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at      timestamptz        NOT NULL DEFAULT now(),
  updated_at      timestamptz        NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- INDEXES
-- ---------------------------------------------------------------------------

CREATE INDEX project_milestones_project_id_idx ON public.project_milestones (project_id);
CREATE INDEX project_milestones_status_idx     ON public.project_milestones (status);
CREATE INDEX project_milestones_created_by_idx ON public.project_milestones (created_by);
CREATE INDEX project_milestones_created_at_idx ON public.project_milestones (created_at DESC);

-- ---------------------------------------------------------------------------
-- TRIGGER: updated_at
-- ---------------------------------------------------------------------------

CREATE TRIGGER project_milestones_updated_at
  BEFORE UPDATE ON public.project_milestones
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ---------------------------------------------------------------------------
-- ROW LEVEL SECURITY
-- ---------------------------------------------------------------------------

ALTER TABLE public.project_milestones ENABLE ROW LEVEL SECURITY;

-- Anon can see milestones of public projects
CREATE POLICY "milestones: anon sees public project milestones"
  ON public.project_milestones FOR SELECT TO anon
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id AND p.visibility = 'public'
    )
  );

-- Authenticated users see milestones matching project visibility rules
CREATE POLICY "milestones: auth visibility"
  ON public.project_milestones FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id
        AND (
          p.visibility IN ('public', 'community')
          OR (
            p.visibility = 'incubator'
            AND EXISTS (
              SELECT 1 FROM public.memberships m
              WHERE m.project_id = p.id AND m.profile_id = auth.uid()
            )
          )
        )
    )
  );

-- Project members can create milestones
CREATE POLICY "milestones: project members can create"
  ON public.project_milestones FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = created_by
    AND EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.project_id = project_id
        AND m.profile_id = auth.uid()
    )
  );

-- Creator can update their own milestones
CREATE POLICY "milestones: creator can update"
  ON public.project_milestones FOR UPDATE TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

-- Creator can delete their own milestones
CREATE POLICY "milestones: creator can delete"
  ON public.project_milestones FOR DELETE TO authenticated
  USING (auth.uid() = created_by);
