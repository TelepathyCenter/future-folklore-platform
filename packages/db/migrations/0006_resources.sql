-- =============================================================================
-- Future Folklore Platform — Migration 0006
-- Layer 1.5: Basic Document & Resource Library
-- =============================================================================

-- ---------------------------------------------------------------------------
-- ENUM: resource_type
-- ---------------------------------------------------------------------------

CREATE TYPE resource_type AS ENUM (
  'document',
  'image',
  'dataset',
  'video',
  'link',
  'other'
);

-- ---------------------------------------------------------------------------
-- TABLE: resources
-- ---------------------------------------------------------------------------

CREATE TABLE public.resources (
  id                  uuid            PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id          uuid            NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title               text            NOT NULL,
  description         text,
  resource_type       resource_type   NOT NULL DEFAULT 'document',
  tags                text[]          NOT NULL DEFAULT '{}',
  external_url        text,
  current_version_id  uuid,           -- deferred FK added below
  created_by          uuid            NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at          timestamptz     NOT NULL DEFAULT now(),
  updated_at          timestamptz     NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- TABLE: resource_versions
-- ---------------------------------------------------------------------------

CREATE TABLE public.resource_versions (
  id              uuid            PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id     uuid            NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
  version_number  integer         NOT NULL DEFAULT 1,
  storage_path    text            NOT NULL,
  file_name       text            NOT NULL,
  file_size_bytes bigint          NOT NULL DEFAULT 0,
  mime_type       text,
  upload_notes    text,
  uploaded_by     uuid            NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at      timestamptz     NOT NULL DEFAULT now()
);

-- Unique constraint: one version number per resource
ALTER TABLE public.resource_versions
  ADD CONSTRAINT resource_versions_resource_version_unique
  UNIQUE (resource_id, version_number);

-- ---------------------------------------------------------------------------
-- DEFERRED FK: resources.current_version_id → resource_versions.id
-- ---------------------------------------------------------------------------

ALTER TABLE public.resources
  ADD CONSTRAINT resources_current_version_fk
  FOREIGN KEY (current_version_id) REFERENCES public.resource_versions(id)
  ON DELETE SET NULL;

-- ---------------------------------------------------------------------------
-- INDEXES
-- ---------------------------------------------------------------------------

CREATE INDEX resources_project_id_idx    ON public.resources (project_id);
CREATE INDEX resources_resource_type_idx ON public.resources (resource_type);
CREATE INDEX resources_created_at_idx    ON public.resources (created_at DESC);
CREATE INDEX resources_created_by_idx    ON public.resources (created_by);
CREATE INDEX resources_tags_idx          ON public.resources USING GIN (tags);
CREATE INDEX resources_fulltext_idx      ON public.resources USING GIN (
  to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, ''))
);

CREATE INDEX resource_versions_lookup_idx ON public.resource_versions (resource_id, version_number DESC);

-- ---------------------------------------------------------------------------
-- TRIGGER: updated_at
-- ---------------------------------------------------------------------------

CREATE TRIGGER resources_updated_at
  BEFORE UPDATE ON public.resources
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ---------------------------------------------------------------------------
-- ROW LEVEL SECURITY: resources
-- ---------------------------------------------------------------------------

ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

-- 1. Anon reads resources on public projects
CREATE POLICY "resources: anon reads public projects"
  ON public.resources FOR SELECT TO anon
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id AND p.visibility = 'public'
    )
  );

-- 2. Auth reads resources on public + community projects, or incubator if member
CREATE POLICY "resources: auth reads visible projects"
  ON public.resources FOR SELECT TO authenticated
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

-- 3. Project members can create resources
CREATE POLICY "resources: members can create"
  ON public.resources FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = created_by
    AND EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.project_id = project_id AND m.profile_id = auth.uid()
    )
  );

-- 4. Creator or project leads can update resources
CREATE POLICY "resources: creator or lead can update"
  ON public.resources FOR UPDATE TO authenticated
  USING (
    auth.uid() = created_by
    OR EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.project_id = project_id
        AND m.profile_id = auth.uid()
        AND m.role = 'lead'
    )
  )
  WITH CHECK (
    auth.uid() = created_by
    OR EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.project_id = project_id
        AND m.profile_id = auth.uid()
        AND m.role = 'lead'
    )
  );

-- 5. Creator or project leads can delete resources
CREATE POLICY "resources: creator or lead can delete"
  ON public.resources FOR DELETE TO authenticated
  USING (
    auth.uid() = created_by
    OR EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.project_id = project_id
        AND m.profile_id = auth.uid()
        AND m.role = 'lead'
    )
  );

-- ---------------------------------------------------------------------------
-- ROW LEVEL SECURITY: resource_versions
-- ---------------------------------------------------------------------------

ALTER TABLE public.resource_versions ENABLE ROW LEVEL SECURITY;

-- 1. Anon reads versions for resources on public projects
CREATE POLICY "resource_versions: anon reads public"
  ON public.resource_versions FOR SELECT TO anon
  USING (
    EXISTS (
      SELECT 1 FROM public.resources r
      JOIN public.projects p ON p.id = r.project_id
      WHERE r.id = resource_id AND p.visibility = 'public'
    )
  );

-- 2. Auth reads versions for visible resources
CREATE POLICY "resource_versions: auth reads visible"
  ON public.resource_versions FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.resources r
      JOIN public.projects p ON p.id = r.project_id
      WHERE r.id = resource_id
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

-- 3. Project members can create versions
CREATE POLICY "resource_versions: members can create"
  ON public.resource_versions FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = uploaded_by
    AND EXISTS (
      SELECT 1 FROM public.resources r
      JOIN public.memberships m ON m.project_id = r.project_id
      WHERE r.id = resource_id AND m.profile_id = auth.uid()
    )
  );

-- 4. Project leads can delete versions
CREATE POLICY "resource_versions: leads can delete"
  ON public.resource_versions FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.resources r
      JOIN public.memberships m ON m.project_id = r.project_id
      WHERE r.id = resource_id
        AND m.profile_id = auth.uid()
        AND m.role = 'lead'
    )
  );
