-- =============================================================================
-- Future Folklore Platform — Migration 0002
-- Layer 1.4: Calls schema (calls, call_rsvps)
-- =============================================================================

-- ---------------------------------------------------------------------------
-- ENUM TYPES
-- ---------------------------------------------------------------------------

CREATE TYPE call_status AS ENUM (
  'scheduled',
  'live',
  'completed',
  'cancelled'
);

CREATE TYPE rsvp_status AS ENUM (
  'going',
  'not_going',
  'maybe'
);

-- ---------------------------------------------------------------------------
-- TABLE: calls
-- ---------------------------------------------------------------------------

CREATE TABLE public.calls (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  title            text        NOT NULL,
  description      text,
  scheduled_at     timestamptz NOT NULL,
  duration_minutes integer     NOT NULL DEFAULT 60 CHECK (duration_minutes > 0),
  video_link       text,
  project_id       uuid        REFERENCES public.projects(id) ON DELETE SET NULL,
  created_by       uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  notes            text,
  status           call_status NOT NULL DEFAULT 'scheduled',
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX calls_scheduled_at_idx ON public.calls (scheduled_at);
CREATE INDEX calls_project_id_idx   ON public.calls (project_id) WHERE project_id IS NOT NULL;
CREATE INDEX calls_created_by_idx   ON public.calls (created_by);
CREATE INDEX calls_status_idx       ON public.calls (status);

CREATE TRIGGER calls_updated_at
  BEFORE UPDATE ON public.calls
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ---------------------------------------------------------------------------
-- TABLE: call_rsvps
-- ---------------------------------------------------------------------------

CREATE TABLE public.call_rsvps (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id    uuid        NOT NULL REFERENCES public.calls(id) ON DELETE CASCADE,
  profile_id uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status     rsvp_status NOT NULL DEFAULT 'going',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT call_rsvps_call_profile_unique UNIQUE (call_id, profile_id)
);

CREATE INDEX call_rsvps_call_id_idx    ON public.call_rsvps (call_id);
CREATE INDEX call_rsvps_profile_id_idx ON public.call_rsvps (profile_id);

CREATE TRIGGER call_rsvps_updated_at
  BEFORE UPDATE ON public.call_rsvps
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ===========================================================================
-- ROW LEVEL SECURITY
-- ===========================================================================

ALTER TABLE public.calls      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_rsvps ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- CALLS RLS
-- ---------------------------------------------------------------------------

-- Community calls (project_id IS NULL) visible to all authenticated
CREATE POLICY "calls: auth sees community calls"
  ON public.calls FOR SELECT TO authenticated
  USING (project_id IS NULL);

-- Project calls visible if the project is public/community,
-- or user is a member of an incubator project
CREATE POLICY "calls: auth sees project calls via project visibility"
  ON public.calls FOR SELECT TO authenticated
  USING (
    project_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = calls.project_id
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

-- Any authenticated user can create a community call
CREATE POLICY "calls: auth can create community call"
  ON public.calls FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = created_by
    AND project_id IS NULL
  );

-- Project members can create calls for their project
CREATE POLICY "calls: project member can create project call"
  ON public.calls FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = created_by
    AND project_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.project_id = calls.project_id AND m.profile_id = auth.uid()
    )
  );

-- Creator can update their own call
CREATE POLICY "calls: creator can update"
  ON public.calls FOR UPDATE TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

-- Project lead can update project calls
CREATE POLICY "calls: project lead can update"
  ON public.calls FOR UPDATE TO authenticated
  USING (
    project_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.project_id = calls.project_id
        AND m.profile_id = auth.uid()
        AND m.role = 'lead'
    )
  )
  WITH CHECK (
    project_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.project_id = calls.project_id
        AND m.profile_id = auth.uid()
        AND m.role = 'lead'
    )
  );

-- Creator can delete
CREATE POLICY "calls: creator can delete"
  ON public.calls FOR DELETE TO authenticated
  USING (auth.uid() = created_by);

-- Project lead can delete project calls
CREATE POLICY "calls: project lead can delete"
  ON public.calls FOR DELETE TO authenticated
  USING (
    project_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.project_id = calls.project_id
        AND m.profile_id = auth.uid()
        AND m.role = 'lead'
    )
  );

-- ---------------------------------------------------------------------------
-- CALL_RSVPS RLS
-- ---------------------------------------------------------------------------

-- RSVPs visible if the parent call is visible
CREATE POLICY "call_rsvps: visible with call"
  ON public.call_rsvps FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.calls c
      WHERE c.id = call_rsvps.call_id
        AND (
          c.project_id IS NULL
          OR EXISTS (
            SELECT 1 FROM public.projects p
            WHERE p.id = c.project_id
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
    )
  );

-- Users can RSVP to calls they can see
CREATE POLICY "call_rsvps: auth can rsvp"
  ON public.call_rsvps FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = profile_id);

-- Users can update their own RSVP
CREATE POLICY "call_rsvps: own rsvp update"
  ON public.call_rsvps FOR UPDATE TO authenticated
  USING (auth.uid() = profile_id)
  WITH CHECK (auth.uid() = profile_id);

-- Users can remove their own RSVP
CREATE POLICY "call_rsvps: own rsvp delete"
  ON public.call_rsvps FOR DELETE TO authenticated
  USING (auth.uid() = profile_id);
