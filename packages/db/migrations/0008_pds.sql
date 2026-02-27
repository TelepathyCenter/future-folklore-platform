-- =============================================================================
-- Future Folklore Platform — Migration 0008
-- Layer 2.2: Phenomenological Data Standard (FF-PDS) v1.0
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Extend blockchain_timestamps.content_type to include 'report'
-- ---------------------------------------------------------------------------

ALTER TABLE public.blockchain_timestamps
  DROP CONSTRAINT IF EXISTS blockchain_timestamps_content_type_check;

ALTER TABLE public.blockchain_timestamps
  ADD CONSTRAINT blockchain_timestamps_content_type_check
    CHECK (content_type = ANY (ARRAY['milestone'::text, 'update'::text, 'resource'::text, 'report'::text]));

-- ---------------------------------------------------------------------------
-- TABLE: phenomenological_reports
-- ---------------------------------------------------------------------------

CREATE TABLE public.phenomenological_reports (
  id                      uuid        PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Authorship
  author_id               uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  project_id              uuid        REFERENCES public.projects(id) ON DELETE SET NULL,

  -- Capture mode
  capture_mode            text        NOT NULL DEFAULT 'rapid'
    CHECK (capture_mode IN ('rapid', 'detailed')),

  -- Context
  session_date            date        NOT NULL,
  session_time            time,
  location                text,
  protocol                text,
  pre_session_state       text,

  -- Sensory channels (JSONB for flexible schema evolution)
  -- Shape: { visual, auditory, tactile, olfactory, emotional, proprioceptive }
  --        each key: { intensity: 0-10, notes: string }
  sensory_data            jsonb       NOT NULL DEFAULT '{}',

  -- Narrative (required)
  narrative               text        NOT NULL CHECK (length(narrative) >= 10),

  -- Metadata
  duration_minutes        integer     CHECK (duration_minutes > 0),
  confidence              integer     NOT NULL CHECK (confidence BETWEEN 1 AND 10),
  tags                    text[]      NOT NULL DEFAULT '{}',

  -- Provenance / tamper evidence
  content_hash            text        NOT NULL,
  hash_algorithm          text        NOT NULL DEFAULT 'SHA-256',
  blockchain_timestamp_id uuid        REFERENCES public.blockchain_timestamps(id) ON DELETE SET NULL,

  -- Visibility
  is_public               boolean     NOT NULL DEFAULT false,

  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- INDEXES
-- ---------------------------------------------------------------------------

CREATE INDEX pds_reports_author_id_idx     ON public.phenomenological_reports (author_id);
CREATE INDEX pds_reports_project_id_idx    ON public.phenomenological_reports (project_id)
  WHERE project_id IS NOT NULL;
CREATE INDEX pds_reports_session_date_idx  ON public.phenomenological_reports (session_date DESC);
CREATE INDEX pds_reports_created_at_idx    ON public.phenomenological_reports (created_at DESC);
CREATE INDEX pds_reports_is_public_idx     ON public.phenomenological_reports (is_public)
  WHERE is_public = true;
-- Full-text search on narrative
CREATE INDEX pds_reports_narrative_fts_idx ON public.phenomenological_reports
  USING gin(to_tsvector('english', narrative));

-- ---------------------------------------------------------------------------
-- TRIGGER: updated_at
-- ---------------------------------------------------------------------------

CREATE TRIGGER pds_reports_updated_at
  BEFORE UPDATE ON public.phenomenological_reports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ---------------------------------------------------------------------------
-- ROW LEVEL SECURITY
-- ---------------------------------------------------------------------------

ALTER TABLE public.phenomenological_reports ENABLE ROW LEVEL SECURITY;

-- Anon: can only see public reports
CREATE POLICY "pds: anon sees public reports"
  ON public.phenomenological_reports FOR SELECT TO anon
  USING (phenomenological_reports.is_public = true);

-- Auth: see own reports + public reports
CREATE POLICY "pds: auth sees own and public"
  ON public.phenomenological_reports FOR SELECT TO authenticated
  USING (
    phenomenological_reports.author_id = auth.uid()
    OR phenomenological_reports.is_public = true
  );

-- Auth: insert own reports
CREATE POLICY "pds: auth can insert own"
  ON public.phenomenological_reports FOR INSERT TO authenticated
  WITH CHECK (phenomenological_reports.author_id = auth.uid());

-- Auth: update own reports
CREATE POLICY "pds: auth can update own"
  ON public.phenomenological_reports FOR UPDATE TO authenticated
  USING  (phenomenological_reports.author_id = auth.uid())
  WITH CHECK (phenomenological_reports.author_id = auth.uid());

-- Auth: delete own reports
CREATE POLICY "pds: auth can delete own"
  ON public.phenomenological_reports FOR DELETE TO authenticated
  USING (phenomenological_reports.author_id = auth.uid());
