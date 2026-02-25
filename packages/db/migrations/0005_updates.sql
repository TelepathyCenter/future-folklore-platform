-- =============================================================================
-- Future Folklore Platform — Migration 0005
-- Layer 1.3: Updates & Activity Feed
-- =============================================================================

-- ---------------------------------------------------------------------------
-- ENUM: update_status
-- ---------------------------------------------------------------------------

CREATE TYPE update_status AS ENUM (
  'draft',        -- Visible only to author
  'published'     -- Visible per project visibility rules (or to all auth if community)
);

-- ---------------------------------------------------------------------------
-- TABLE: updates
-- ---------------------------------------------------------------------------

CREATE TABLE public.updates (
  id              uuid             PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      uuid             REFERENCES public.projects(id) ON DELETE CASCADE,
  title           text             NOT NULL,
  body            text,
  tags            text[]           NOT NULL DEFAULT '{}',
  status          update_status    NOT NULL DEFAULT 'draft',
  published_at    timestamptz,
  created_by      uuid             NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at      timestamptz      NOT NULL DEFAULT now(),
  updated_at      timestamptz      NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- INDEXES
-- ---------------------------------------------------------------------------

CREATE INDEX updates_project_id_idx    ON public.updates (project_id);
CREATE INDEX updates_created_by_idx    ON public.updates (created_by);
CREATE INDEX updates_status_idx        ON public.updates (status);
CREATE INDEX updates_published_at_idx  ON public.updates (published_at DESC);
CREATE INDEX updates_tags_idx          ON public.updates USING GIN (tags);

-- ---------------------------------------------------------------------------
-- TRIGGER: updated_at
-- ---------------------------------------------------------------------------

CREATE TRIGGER updates_updated_at
  BEFORE UPDATE ON public.updates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ---------------------------------------------------------------------------
-- TRIGGER: set published_at on status change to 'published'
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.set_update_published_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'published' AND (OLD.status IS DISTINCT FROM 'published') THEN
    NEW.published_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER updates_set_published_at
  BEFORE INSERT OR UPDATE ON public.updates
  FOR EACH ROW EXECUTE FUNCTION public.set_update_published_at();

-- ---------------------------------------------------------------------------
-- ROW LEVEL SECURITY
-- ---------------------------------------------------------------------------

ALTER TABLE public.updates ENABLE ROW LEVEL SECURITY;

-- 1. Anon can read published updates on public projects (needed for RSS)
CREATE POLICY "updates: anon reads published on public projects"
  ON public.updates FOR SELECT TO anon
  USING (
    status = 'published'
    AND (
      project_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.projects p
        WHERE p.id = project_id AND p.visibility = 'public'
      )
    )
  );

-- 2. Auth users can read published updates matching project visibility
CREATE POLICY "updates: auth reads published visible"
  ON public.updates FOR SELECT TO authenticated
  USING (
    status = 'published'
    AND (
      -- Community-wide updates (no project) visible to all auth
      project_id IS NULL
      OR EXISTS (
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
    )
  );

-- 3. Authors can always see their own drafts
CREATE POLICY "updates: author reads own drafts"
  ON public.updates FOR SELECT TO authenticated
  USING (
    status = 'draft' AND created_by = auth.uid()
  );

-- 4. Auth users can create updates (community-wide or for projects they belong to)
CREATE POLICY "updates: auth can create"
  ON public.updates FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = created_by
    AND (
      project_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.memberships m
        WHERE m.project_id = project_id AND m.profile_id = auth.uid()
      )
    )
  );

-- 5. Authors can update their own updates
CREATE POLICY "updates: author can update"
  ON public.updates FOR UPDATE TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

-- 6. Authors can delete their own updates
CREATE POLICY "updates: author can delete"
  ON public.updates FOR DELETE TO authenticated
  USING (auth.uid() = created_by);
