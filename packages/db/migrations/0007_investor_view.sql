-- =============================================================================
-- Future Folklore Platform — Migration 0007
-- Layer 1.6: Investor View
-- Adds funding fields to projects + expressions_of_interest table
-- =============================================================================

-- ---------------------------------------------------------------------------
-- ENUM: funding_stage
-- ---------------------------------------------------------------------------

CREATE TYPE funding_stage AS ENUM (
  'ideation',
  'pre-seed',
  'seed',
  'series-a',
  'grant-seeking',
  'bootstrapped'
);

-- ---------------------------------------------------------------------------
-- ENUM: eoi_status
-- ---------------------------------------------------------------------------

CREATE TYPE eoi_status AS ENUM (
  'pending',
  'acknowledged',
  'declined'
);

-- ---------------------------------------------------------------------------
-- ALTER TABLE: projects — add funding fields (all nullable)
-- ---------------------------------------------------------------------------

ALTER TABLE public.projects
  ADD COLUMN funding_stage    funding_stage,
  ADD COLUMN funding_sought   numeric,
  ADD COLUMN funding_received numeric,
  ADD COLUMN use_of_funds     text;

-- ---------------------------------------------------------------------------
-- TABLE: expressions_of_interest
-- ---------------------------------------------------------------------------

CREATE TABLE public.expressions_of_interest (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id       uuid        NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  investor_id      uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message          text        NOT NULL,
  status           eoi_status  NOT NULL DEFAULT 'pending',
  notify_on_update boolean     NOT NULL DEFAULT false,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT eoi_project_investor_unique UNIQUE (project_id, investor_id)
);

-- ---------------------------------------------------------------------------
-- INDEXES
-- ---------------------------------------------------------------------------

CREATE INDEX eoi_project_id_idx  ON public.expressions_of_interest (project_id);
CREATE INDEX eoi_investor_id_idx ON public.expressions_of_interest (investor_id);
CREATE INDEX eoi_status_idx      ON public.expressions_of_interest (status);
CREATE INDEX eoi_created_at_idx  ON public.expressions_of_interest (created_at DESC);

CREATE INDEX projects_funding_stage_idx
  ON public.projects (funding_stage)
  WHERE funding_stage IS NOT NULL;

-- ---------------------------------------------------------------------------
-- TRIGGER: updated_at
-- ---------------------------------------------------------------------------

CREATE TRIGGER eoi_updated_at
  BEFORE UPDATE ON public.expressions_of_interest
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ---------------------------------------------------------------------------
-- ROW LEVEL SECURITY: expressions_of_interest
-- ---------------------------------------------------------------------------

ALTER TABLE public.expressions_of_interest ENABLE ROW LEVEL SECURITY;

-- Investors see their own submissions; project leads see all inbound EOIs.
-- Explicitly qualify project_id with table name to avoid ambiguous column
-- resolution in the EXISTS subquery.
CREATE POLICY "eoi: investors see own, leads see inbound"
  ON public.expressions_of_interest FOR SELECT TO authenticated
  USING (
    investor_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.project_id = expressions_of_interest.project_id
        AND m.profile_id = auth.uid()
        AND m.role = 'lead'
    )
  );

-- Any authenticated user can submit an EOI for their own account
CREATE POLICY "eoi: auth can submit"
  ON public.expressions_of_interest FOR INSERT TO authenticated
  WITH CHECK (investor_id = auth.uid());

-- Project leads can update status on inbound EOIs for their projects
CREATE POLICY "eoi: leads can update status"
  ON public.expressions_of_interest FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.project_id = expressions_of_interest.project_id
        AND m.profile_id = auth.uid()
        AND m.role = 'lead'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.project_id = expressions_of_interest.project_id
        AND m.profile_id = auth.uid()
        AND m.role = 'lead'
    )
  );
