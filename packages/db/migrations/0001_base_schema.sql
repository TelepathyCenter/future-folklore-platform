-- =============================================================================
-- Future Folklore Platform — Migration 0001
-- Layer 0.2: Base schema (profiles, organizations, projects, memberships)
-- =============================================================================

-- Enable pgvector for future embedding work
CREATE EXTENSION IF NOT EXISTS vector;

-- ---------------------------------------------------------------------------
-- ENUM TYPES
-- ---------------------------------------------------------------------------

CREATE TYPE profile_role AS ENUM (
  'researcher',
  'investor',
  'practitioner',
  'mentor',
  'observer'
);

CREATE TYPE profile_visibility AS ENUM (
  'public',
  'community',
  'private'
);

CREATE TYPE project_status AS ENUM (
  'active',
  'incubating',
  'paused',
  'completed'
);

CREATE TYPE project_visibility AS ENUM (
  'public',
  'community',
  'incubator'
);

CREATE TYPE membership_role AS ENUM (
  'lead',
  'member',
  'advisor',
  'observer'
);

-- ---------------------------------------------------------------------------
-- SHARED TRIGGER FUNCTION: updated_at
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- TABLE: profiles (1:1 extension of auth.users)
-- ---------------------------------------------------------------------------

CREATE TABLE public.profiles (
  id              uuid               PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username        text               NOT NULL UNIQUE,
  display_name    text,
  bio             text,
  avatar_url      text,
  role            profile_role       NOT NULL DEFAULT 'observer',
  visibility      profile_visibility NOT NULL DEFAULT 'community',
  expertise_tags  text[]             NOT NULL DEFAULT '{}',
  links           jsonb              NOT NULL DEFAULT '{}',
  did             text               UNIQUE,
  created_at      timestamptz        NOT NULL DEFAULT now(),
  updated_at      timestamptz        NOT NULL DEFAULT now()
);

CREATE INDEX profiles_role_idx           ON public.profiles (role);
CREATE INDEX profiles_visibility_idx     ON public.profiles (visibility);
CREATE INDEX profiles_expertise_tags_idx ON public.profiles USING GIN (expertise_tags);
CREATE INDEX profiles_did_idx            ON public.profiles (did) WHERE did IS NOT NULL;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ---------------------------------------------------------------------------
-- TRIGGER: Auto-create profile on auth.users INSERT
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  generated_username text;
BEGIN
  generated_username := lower(
    regexp_replace(
      split_part(NEW.email, '@', 1),
      '[^a-z0-9_]', '_', 'g'
    )
  );
  -- Append short UUID suffix for uniqueness
  generated_username := generated_username || '_' || substring(NEW.id::text, 1, 6);

  INSERT INTO public.profiles (id, username, display_name, avatar_url)
  VALUES (
    NEW.id,
    generated_username,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      NEW.raw_user_meta_data->>'user_name',
      split_part(NEW.email, '@', 1)
    ),
    COALESCE(
      NEW.raw_user_meta_data->>'avatar_url',
      NEW.raw_user_meta_data->>'picture'
    )
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ---------------------------------------------------------------------------
-- TABLE: organizations
-- ---------------------------------------------------------------------------

CREATE TABLE public.organizations (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text        NOT NULL,
  slug        text        NOT NULL UNIQUE,
  description text,
  logo_url    text,
  website_url text,
  created_by  uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX organizations_slug_idx ON public.organizations (slug);

CREATE TRIGGER organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ---------------------------------------------------------------------------
-- TABLE: projects
-- ---------------------------------------------------------------------------

CREATE TABLE public.projects (
  id              uuid               PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid               NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name            text               NOT NULL,
  slug            text               NOT NULL,
  description     text,
  status          project_status     NOT NULL DEFAULT 'incubating',
  visibility      project_visibility NOT NULL DEFAULT 'community',
  domain_tags     text[]             NOT NULL DEFAULT '{}',
  links           jsonb              NOT NULL DEFAULT '{}',
  created_by      uuid               NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at      timestamptz        NOT NULL DEFAULT now(),
  updated_at      timestamptz        NOT NULL DEFAULT now(),

  CONSTRAINT projects_org_slug_unique UNIQUE (organization_id, slug)
);

CREATE INDEX projects_organization_id_idx ON public.projects (organization_id);
CREATE INDEX projects_status_idx          ON public.projects (status);
CREATE INDEX projects_visibility_idx      ON public.projects (visibility);
CREATE INDEX projects_domain_tags_idx     ON public.projects USING GIN (domain_tags);

CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ---------------------------------------------------------------------------
-- TABLE: memberships (profiles <-> projects XOR organizations)
-- ---------------------------------------------------------------------------

CREATE TABLE public.memberships (
  id              uuid            PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id      uuid            NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  project_id      uuid            REFERENCES public.projects(id) ON DELETE CASCADE,
  organization_id uuid            REFERENCES public.organizations(id) ON DELETE CASCADE,
  role            membership_role NOT NULL DEFAULT 'member',
  invited_by      uuid            REFERENCES public.profiles(id) ON DELETE SET NULL,
  joined_at       timestamptz     NOT NULL DEFAULT now(),
  created_at      timestamptz     NOT NULL DEFAULT now(),
  updated_at      timestamptz     NOT NULL DEFAULT now(),

  CONSTRAINT memberships_xor_target CHECK (
    (project_id IS NOT NULL AND organization_id IS NULL)
    OR (project_id IS NULL AND organization_id IS NOT NULL)
  ),
  CONSTRAINT memberships_profile_project_unique UNIQUE (profile_id, project_id),
  CONSTRAINT memberships_profile_org_unique UNIQUE (profile_id, organization_id)
);

CREATE INDEX memberships_profile_id_idx      ON public.memberships (profile_id);
CREATE INDEX memberships_project_id_idx      ON public.memberships (project_id) WHERE project_id IS NOT NULL;
CREATE INDEX memberships_organization_id_idx ON public.memberships (organization_id) WHERE organization_id IS NOT NULL;

CREATE TRIGGER memberships_updated_at
  BEFORE UPDATE ON public.memberships
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ===========================================================================
-- ROW LEVEL SECURITY
-- ===========================================================================

ALTER TABLE public.profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships   ENABLE ROW LEVEL SECURITY;

-- ----- PROFILES RLS -----

CREATE POLICY "profiles: anon sees public"
  ON public.profiles FOR SELECT TO anon
  USING (visibility = 'public');

CREATE POLICY "profiles: auth sees community and public"
  ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = id OR visibility IN ('public', 'community'));

CREATE POLICY "profiles: owner can insert"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles: owner can update"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles: owner can delete"
  ON public.profiles FOR DELETE TO authenticated
  USING (auth.uid() = id);

-- ----- ORGANIZATIONS RLS -----

CREATE POLICY "organizations: auth sees all"
  ON public.organizations FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "organizations: auth can create"
  ON public.organizations FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "organizations: leads can update"
  ON public.organizations FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.organization_id = id
        AND m.profile_id = auth.uid()
        AND m.role = 'lead'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.organization_id = id
        AND m.profile_id = auth.uid()
        AND m.role = 'lead'
    )
  );

CREATE POLICY "organizations: leads can delete"
  ON public.organizations FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.organization_id = id
        AND m.profile_id = auth.uid()
        AND m.role = 'lead'
    )
  );

-- ----- PROJECTS RLS -----

CREATE POLICY "projects: anon sees public"
  ON public.projects FOR SELECT TO anon
  USING (visibility = 'public');

CREATE POLICY "projects: auth visibility"
  ON public.projects FOR SELECT TO authenticated
  USING (
    visibility IN ('public', 'community')
    OR (
      visibility = 'incubator'
      AND EXISTS (
        SELECT 1 FROM public.memberships m
        WHERE m.project_id = id AND m.profile_id = auth.uid()
      )
    )
  );

CREATE POLICY "projects: org members can create"
  ON public.projects FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = created_by
    AND EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.organization_id = organization_id
        AND m.profile_id = auth.uid()
    )
  );

CREATE POLICY "projects: leads can update"
  ON public.projects FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.project_id = id
        AND m.profile_id = auth.uid()
        AND m.role = 'lead'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.project_id = id
        AND m.profile_id = auth.uid()
        AND m.role = 'lead'
    )
  );

CREATE POLICY "projects: leads can delete"
  ON public.projects FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.project_id = id
        AND m.profile_id = auth.uid()
        AND m.role = 'lead'
    )
  );

-- ----- MEMBERSHIPS RLS -----

CREATE POLICY "memberships: own memberships"
  ON public.memberships FOR SELECT TO authenticated
  USING (profile_id = auth.uid());

CREATE POLICY "memberships: see co-members"
  ON public.memberships FOR SELECT TO authenticated
  USING (
    (project_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.memberships m2
      WHERE m2.project_id = project_id AND m2.profile_id = auth.uid()
    ))
    OR
    (organization_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.memberships m2
      WHERE m2.organization_id = organization_id AND m2.profile_id = auth.uid()
    ))
  );

CREATE POLICY "memberships: leads can insert"
  ON public.memberships FOR INSERT TO authenticated
  WITH CHECK (
    invited_by = auth.uid()
    AND (
      (project_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.memberships m
        WHERE m.project_id = project_id
          AND m.profile_id = auth.uid()
          AND m.role = 'lead'
      ))
      OR
      (organization_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.memberships m
        WHERE m.organization_id = organization_id
          AND m.profile_id = auth.uid()
          AND m.role = 'lead'
      ))
    )
  );

CREATE POLICY "memberships: leads can update"
  ON public.memberships FOR UPDATE TO authenticated
  USING (
    (project_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.project_id = project_id
        AND m.profile_id = auth.uid()
        AND m.role = 'lead'
    ))
    OR
    (organization_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.organization_id = organization_id
        AND m.profile_id = auth.uid()
        AND m.role = 'lead'
    ))
  );

CREATE POLICY "memberships: self can delete"
  ON public.memberships FOR DELETE TO authenticated
  USING (profile_id = auth.uid());

CREATE POLICY "memberships: leads can delete others"
  ON public.memberships FOR DELETE TO authenticated
  USING (
    profile_id != auth.uid()
    AND (
      (project_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.memberships m
        WHERE m.project_id = project_id
          AND m.profile_id = auth.uid()
          AND m.role = 'lead'
      ))
      OR
      (organization_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.memberships m
        WHERE m.organization_id = organization_id
          AND m.profile_id = auth.uid()
          AND m.role = 'lead'
      ))
    )
  );
