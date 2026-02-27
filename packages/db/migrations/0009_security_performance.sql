-- =============================================================================
-- Future Folklore Platform — Migration 0009
-- Security & Performance Hardening
--
-- Changes:
-- 1. Fix set_update_published_at function: add SET search_path to prevent
--    mutable search_path vulnerability (security advisory)
-- 2. Tighten blockchain_timestamps UPDATE policy (always-true → creator only)
-- 3. Add 6 missing FK indexes (performance advisory)
-- 4. Wrap all bare auth.uid() calls in (select auth.uid()) across all RLS
--    policies — prevents per-row re-evaluation (auth_rls_initplan advisory,
--    59 occurrences)
-- =============================================================================

-- ===========================================================================
-- 1. Fix function search_path (security)
-- ===========================================================================

CREATE OR REPLACE FUNCTION public.set_update_published_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'published' AND (OLD.status IS DISTINCT FROM 'published') THEN
    NEW.published_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;

-- ===========================================================================
-- 2. Tighten blockchain_timestamps UPDATE policy (security)
--    Was: USING (true) WITH CHECK (true)
--    Now: restricted to the row creator
-- ===========================================================================

ALTER POLICY "timestamps: auth can update status" ON public.blockchain_timestamps
  USING  (created_by = (select auth.uid()))
  WITH CHECK (created_by = (select auth.uid()));

-- ===========================================================================
-- 3. Add missing FK indexes (performance)
-- ===========================================================================

CREATE INDEX IF NOT EXISTS memberships_invited_by_idx
  ON public.memberships (invited_by)
  WHERE invited_by IS NOT NULL;

CREATE INDEX IF NOT EXISTS organizations_created_by_idx
  ON public.organizations (created_by);

CREATE INDEX IF NOT EXISTS projects_created_by_idx
  ON public.projects (created_by);

CREATE INDEX IF NOT EXISTS resource_versions_uploaded_by_idx
  ON public.resource_versions (uploaded_by);

CREATE INDEX IF NOT EXISTS resources_current_version_id_idx
  ON public.resources (current_version_id)
  WHERE current_version_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS pds_reports_blockchain_ts_id_idx
  ON public.phenomenological_reports (blockchain_timestamp_id)
  WHERE blockchain_timestamp_id IS NOT NULL;

-- ===========================================================================
-- 4. Fix auth_rls_initplan: (select auth.uid()) in all RLS policies
--    Prevents Postgres from re-evaluating auth.uid() per row.
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------

ALTER POLICY "profiles: auth sees community and public"
  ON public.profiles
  USING ((select auth.uid()) = id OR visibility IN ('public', 'community'));

ALTER POLICY "profiles: owner can insert"
  ON public.profiles
  WITH CHECK ((select auth.uid()) = id);

ALTER POLICY "profiles: owner can update"
  ON public.profiles
  USING  ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);

ALTER POLICY "profiles: owner can delete"
  ON public.profiles
  USING ((select auth.uid()) = id);

-- ---------------------------------------------------------------------------
-- organizations
-- ---------------------------------------------------------------------------

ALTER POLICY "organizations: auth can create"
  ON public.organizations
  WITH CHECK ((select auth.uid()) = created_by);

ALTER POLICY "organizations: leads can update"
  ON public.organizations
  USING (
    EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.organization_id = id
        AND m.profile_id = (select auth.uid())
        AND m.role = 'lead'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.organization_id = id
        AND m.profile_id = (select auth.uid())
        AND m.role = 'lead'
    )
  );

ALTER POLICY "organizations: leads can delete"
  ON public.organizations
  USING (
    EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.organization_id = id
        AND m.profile_id = (select auth.uid())
        AND m.role = 'lead'
    )
  );

-- ---------------------------------------------------------------------------
-- projects
-- ---------------------------------------------------------------------------

ALTER POLICY "projects: auth visibility"
  ON public.projects
  USING (
    visibility IN ('public', 'community')
    OR (
      visibility = 'incubator'
      AND EXISTS (
        SELECT 1 FROM public.memberships m
        WHERE m.project_id = id AND m.profile_id = (select auth.uid())
      )
    )
  );

ALTER POLICY "projects: org members can create"
  ON public.projects
  WITH CHECK (
    (select auth.uid()) = created_by
    AND EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.organization_id = organization_id
        AND m.profile_id = (select auth.uid())
    )
  );

ALTER POLICY "projects: leads can update"
  ON public.projects
  USING (
    EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.project_id = id
        AND m.profile_id = (select auth.uid())
        AND m.role = 'lead'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.project_id = id
        AND m.profile_id = (select auth.uid())
        AND m.role = 'lead'
    )
  );

ALTER POLICY "projects: leads can delete"
  ON public.projects
  USING (
    EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.project_id = id
        AND m.profile_id = (select auth.uid())
        AND m.role = 'lead'
    )
  );

-- ---------------------------------------------------------------------------
-- memberships
-- ---------------------------------------------------------------------------

ALTER POLICY "memberships: own memberships"
  ON public.memberships
  USING (profile_id = (select auth.uid()));

ALTER POLICY "memberships: see co-members"
  ON public.memberships
  USING (
    (project_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.memberships m2
      WHERE m2.project_id = project_id AND m2.profile_id = (select auth.uid())
    ))
    OR
    (organization_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.memberships m2
      WHERE m2.organization_id = organization_id AND m2.profile_id = (select auth.uid())
    ))
  );

ALTER POLICY "memberships: leads can insert"
  ON public.memberships
  WITH CHECK (
    invited_by = (select auth.uid())
    AND (
      (project_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.memberships m
        WHERE m.project_id = project_id
          AND m.profile_id = (select auth.uid())
          AND m.role = 'lead'
      ))
      OR
      (organization_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.memberships m
        WHERE m.organization_id = organization_id
          AND m.profile_id = (select auth.uid())
          AND m.role = 'lead'
      ))
    )
  );

ALTER POLICY "memberships: leads can update"
  ON public.memberships
  USING (
    (project_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.project_id = project_id
        AND m.profile_id = (select auth.uid())
        AND m.role = 'lead'
    ))
    OR
    (organization_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.organization_id = organization_id
        AND m.profile_id = (select auth.uid())
        AND m.role = 'lead'
    ))
  );

ALTER POLICY "memberships: self can delete"
  ON public.memberships
  USING (profile_id = (select auth.uid()));

ALTER POLICY "memberships: leads can delete others"
  ON public.memberships
  USING (
    profile_id != (select auth.uid())
    AND (
      (project_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.memberships m
        WHERE m.project_id = project_id
          AND m.profile_id = (select auth.uid())
          AND m.role = 'lead'
      ))
      OR
      (organization_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.memberships m
        WHERE m.organization_id = organization_id
          AND m.profile_id = (select auth.uid())
          AND m.role = 'lead'
      ))
    )
  );

-- ---------------------------------------------------------------------------
-- calls
-- ---------------------------------------------------------------------------

ALTER POLICY "calls: auth sees project calls via project visibility"
  ON public.calls
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
              WHERE m.project_id = p.id AND m.profile_id = (select auth.uid())
            )
          )
        )
    )
  );

ALTER POLICY "calls: auth can create community call"
  ON public.calls
  WITH CHECK (
    (select auth.uid()) = created_by
    AND project_id IS NULL
  );

ALTER POLICY "calls: project member can create project call"
  ON public.calls
  WITH CHECK (
    (select auth.uid()) = created_by
    AND project_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.project_id = calls.project_id AND m.profile_id = (select auth.uid())
    )
  );

ALTER POLICY "calls: creator can update"
  ON public.calls
  USING  ((select auth.uid()) = created_by)
  WITH CHECK ((select auth.uid()) = created_by);

ALTER POLICY "calls: project lead can update"
  ON public.calls
  USING (
    project_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.project_id = calls.project_id
        AND m.profile_id = (select auth.uid())
        AND m.role = 'lead'
    )
  )
  WITH CHECK (
    project_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.project_id = calls.project_id
        AND m.profile_id = (select auth.uid())
        AND m.role = 'lead'
    )
  );

ALTER POLICY "calls: creator can delete"
  ON public.calls
  USING ((select auth.uid()) = created_by);

ALTER POLICY "calls: project lead can delete"
  ON public.calls
  USING (
    project_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.project_id = calls.project_id
        AND m.profile_id = (select auth.uid())
        AND m.role = 'lead'
    )
  );

-- ---------------------------------------------------------------------------
-- call_rsvps
-- ---------------------------------------------------------------------------

ALTER POLICY "call_rsvps: visible with call"
  ON public.call_rsvps
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
                    WHERE m.project_id = p.id AND m.profile_id = (select auth.uid())
                  )
                )
              )
          )
        )
    )
  );

ALTER POLICY "call_rsvps: auth can rsvp"
  ON public.call_rsvps
  WITH CHECK ((select auth.uid()) = profile_id);

ALTER POLICY "call_rsvps: own rsvp update"
  ON public.call_rsvps
  USING  ((select auth.uid()) = profile_id)
  WITH CHECK ((select auth.uid()) = profile_id);

ALTER POLICY "call_rsvps: own rsvp delete"
  ON public.call_rsvps
  USING ((select auth.uid()) = profile_id);

-- ---------------------------------------------------------------------------
-- concepts
-- ---------------------------------------------------------------------------

ALTER POLICY "concepts: auth can create"
  ON public.concepts
  WITH CHECK ((select auth.uid()) = created_by);

ALTER POLICY "concepts: creator can update non-canonical"
  ON public.concepts
  USING  ((select auth.uid()) = created_by AND NOT is_canonical)
  WITH CHECK ((select auth.uid()) = created_by AND NOT is_canonical);

ALTER POLICY "concepts: creator can delete non-canonical"
  ON public.concepts
  USING ((select auth.uid()) = created_by AND NOT is_canonical);

-- ---------------------------------------------------------------------------
-- graph_edges
-- ---------------------------------------------------------------------------

ALTER POLICY "graph_edges: auth can read visible edges"
  ON public.graph_edges
  USING (
    source_type = 'concept' OR target_type = 'concept'
    OR (source_type = 'profile' AND source_id = (select auth.uid()))
    OR (target_type = 'profile' AND target_id = (select auth.uid()))
    OR (source_type = 'project' AND EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = source_id AND p.visibility IN ('public', 'community')
    ))
    OR (target_type = 'project' AND EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = target_id AND p.visibility IN ('public', 'community')
    ))
    OR source_type = 'organization'
    OR target_type = 'organization'
    OR created_by = (select auth.uid())
  );

ALTER POLICY "graph_edges: auth can create"
  ON public.graph_edges
  WITH CHECK ((select auth.uid()) = created_by);

ALTER POLICY "graph_edges: creator can update"
  ON public.graph_edges
  USING  ((select auth.uid()) = created_by)
  WITH CHECK ((select auth.uid()) = created_by);

ALTER POLICY "graph_edges: creator can delete"
  ON public.graph_edges
  USING ((select auth.uid()) = created_by);

-- ---------------------------------------------------------------------------
-- project_milestones
-- ---------------------------------------------------------------------------

ALTER POLICY "milestones: auth visibility"
  ON public.project_milestones
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
              WHERE m.project_id = p.id AND m.profile_id = (select auth.uid())
            )
          )
        )
    )
  );

ALTER POLICY "milestones: project members can create"
  ON public.project_milestones
  WITH CHECK (
    (select auth.uid()) = created_by
    AND EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.project_id = project_id
        AND m.profile_id = (select auth.uid())
    )
  );

ALTER POLICY "milestones: creator can update"
  ON public.project_milestones
  USING  ((select auth.uid()) = created_by)
  WITH CHECK ((select auth.uid()) = created_by);

ALTER POLICY "milestones: creator can delete"
  ON public.project_milestones
  USING ((select auth.uid()) = created_by);

-- ---------------------------------------------------------------------------
-- updates
-- ---------------------------------------------------------------------------

ALTER POLICY "updates: auth reads published visible"
  ON public.updates
  USING (
    status = 'published'
    AND (
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
                WHERE m.project_id = p.id AND m.profile_id = (select auth.uid())
              )
            )
          )
      )
    )
  );

ALTER POLICY "updates: author reads own drafts"
  ON public.updates
  USING (status = 'draft' AND created_by = (select auth.uid()));

ALTER POLICY "updates: auth can create"
  ON public.updates
  WITH CHECK (
    (select auth.uid()) = created_by
    AND (
      project_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.memberships m
        WHERE m.project_id = project_id AND m.profile_id = (select auth.uid())
      )
    )
  );

ALTER POLICY "updates: author can update"
  ON public.updates
  USING  ((select auth.uid()) = created_by)
  WITH CHECK ((select auth.uid()) = created_by);

ALTER POLICY "updates: author can delete"
  ON public.updates
  USING ((select auth.uid()) = created_by);

-- ---------------------------------------------------------------------------
-- resources
-- ---------------------------------------------------------------------------

ALTER POLICY "resources: auth reads visible projects"
  ON public.resources
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
              WHERE m.project_id = p.id AND m.profile_id = (select auth.uid())
            )
          )
        )
    )
  );

ALTER POLICY "resources: members can create"
  ON public.resources
  WITH CHECK (
    (select auth.uid()) = created_by
    AND EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.project_id = project_id AND m.profile_id = (select auth.uid())
    )
  );

ALTER POLICY "resources: creator or lead can update"
  ON public.resources
  USING (
    (select auth.uid()) = created_by
    OR EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.project_id = project_id
        AND m.profile_id = (select auth.uid())
        AND m.role = 'lead'
    )
  )
  WITH CHECK (
    (select auth.uid()) = created_by
    OR EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.project_id = project_id
        AND m.profile_id = (select auth.uid())
        AND m.role = 'lead'
    )
  );

ALTER POLICY "resources: creator or lead can delete"
  ON public.resources
  USING (
    (select auth.uid()) = created_by
    OR EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.project_id = project_id
        AND m.profile_id = (select auth.uid())
        AND m.role = 'lead'
    )
  );

-- ---------------------------------------------------------------------------
-- resource_versions
-- ---------------------------------------------------------------------------

ALTER POLICY "resource_versions: auth reads visible"
  ON public.resource_versions
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
              WHERE m.project_id = p.id AND m.profile_id = (select auth.uid())
            )
          )
        )
    )
  );

ALTER POLICY "resource_versions: members can create"
  ON public.resource_versions
  WITH CHECK (
    (select auth.uid()) = uploaded_by
    AND EXISTS (
      SELECT 1 FROM public.resources r
      JOIN public.memberships m ON m.project_id = r.project_id
      WHERE r.id = resource_id AND m.profile_id = (select auth.uid())
    )
  );

ALTER POLICY "resource_versions: leads can delete"
  ON public.resource_versions
  USING (
    EXISTS (
      SELECT 1 FROM public.resources r
      JOIN public.memberships m ON m.project_id = r.project_id
      WHERE r.id = resource_id
        AND m.profile_id = (select auth.uid())
        AND m.role = 'lead'
    )
  );

-- ---------------------------------------------------------------------------
-- expressions_of_interest
-- ---------------------------------------------------------------------------

ALTER POLICY "eoi: investors see own, leads see inbound"
  ON public.expressions_of_interest
  USING (
    investor_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.project_id = expressions_of_interest.project_id
        AND m.profile_id = (select auth.uid())
        AND m.role = 'lead'
    )
  );

ALTER POLICY "eoi: auth can submit"
  ON public.expressions_of_interest
  WITH CHECK (investor_id = (select auth.uid()));

ALTER POLICY "eoi: leads can update status"
  ON public.expressions_of_interest
  USING (
    EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.project_id = expressions_of_interest.project_id
        AND m.profile_id = (select auth.uid())
        AND m.role = 'lead'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.project_id = expressions_of_interest.project_id
        AND m.profile_id = (select auth.uid())
        AND m.role = 'lead'
    )
  );

-- ---------------------------------------------------------------------------
-- blockchain_timestamps (INSERT policy)
-- ---------------------------------------------------------------------------

ALTER POLICY "timestamps: auth can insert"
  ON public.blockchain_timestamps
  WITH CHECK ((select auth.uid()) = created_by);

-- ---------------------------------------------------------------------------
-- phenomenological_reports
-- ---------------------------------------------------------------------------

ALTER POLICY "pds: auth sees own and public"
  ON public.phenomenological_reports
  USING (
    phenomenological_reports.author_id = (select auth.uid())
    OR phenomenological_reports.is_public = true
  );

ALTER POLICY "pds: auth can insert own"
  ON public.phenomenological_reports
  WITH CHECK (phenomenological_reports.author_id = (select auth.uid()));

ALTER POLICY "pds: auth can update own"
  ON public.phenomenological_reports
  USING  (phenomenological_reports.author_id = (select auth.uid()))
  WITH CHECK (phenomenological_reports.author_id = (select auth.uid()));

ALTER POLICY "pds: auth can delete own"
  ON public.phenomenological_reports
  USING (phenomenological_reports.author_id = (select auth.uid()));
