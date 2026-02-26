import { createClient } from '@/lib/supabase/server';
import type { Tables } from '@future-folklore-platform/db';

export type Project = Tables<'projects'>;
export type Organization = Tables<'organizations'>;

export interface ProjectWithOrg extends Project {
  organizations: Pick<Organization, 'id' | 'name' | 'slug'>;
  member_count: number;
}

export interface ProjectDetail extends Project {
  organizations: Pick<
    Organization,
    'id' | 'name' | 'slug' | 'description' | 'website_url' | 'logo_url'
  >;
  memberships: Array<{
    id: string;
    role: string;
    profile_id: string;
    profiles: Pick<
      Tables<'profiles'>,
      'id' | 'username' | 'display_name' | 'avatar_url' | 'role'
    >;
  }>;
}

export interface ProjectListParams {
  search?: string;
  status?: string;
  tag?: string;
  page?: number;
  limit?: number;
}

export async function listProjects(
  params: ProjectListParams = {},
): Promise<{ projects: ProjectWithOrg[]; total: number }> {
  const { search, status, tag, page = 1, limit = 12 } = params;
  const supabase = await createClient();
  const offset = (page - 1) * limit;

  let query = supabase
    .from('projects')
    .select(
      `
      *,
      organizations ( id, name, slug ),
      memberships ( id )
      `,
      { count: 'exact' },
    )
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (search) {
    query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
  }

  if (status) {
    query = query.eq('status', status);
  }

  if (tag) {
    query = query.contains('domain_tags', [tag]);
  }

  const { data, count, error } = await query;

  if (error) {
    return { projects: [], total: 0 };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const projects: ProjectWithOrg[] = (data ?? []).map((row: any) => ({
    ...row,
    member_count: Array.isArray(row.memberships) ? row.memberships.length : 0,
  }));

  return { projects, total: count ?? 0 };
}

export async function getProject(id: string): Promise<ProjectDetail | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('projects')
    .select(
      `
      *,
      organizations ( id, name, slug, description, website_url, logo_url ),
      memberships (
        id,
        role,
        profile_id,
        profiles ( id, username, display_name, avatar_url, role )
      )
      `,
    )
    .eq('id', id)
    .single();

  if (error) return null;
  return data as unknown as ProjectDetail;
}

export interface ProjectForInvestor extends Project {
  organizations: Pick<Organization, 'id' | 'name' | 'slug'>;
  member_count: number;
  milestone_count: number;
}

export interface InvestorListParams {
  search?: string;
  stage?: string;
  tag?: string;
  page?: number;
  limit?: number;
}

export async function listProjectsForInvestors(
  params: InvestorListParams = {},
): Promise<{ projects: ProjectForInvestor[]; total: number }> {
  const { search, stage, tag, page = 1, limit = 12 } = params;
  const supabase = await createClient();
  const offset = (page - 1) * limit;

  let query = supabase
    .from('projects')
    .select(
      `
      *,
      organizations ( id, name, slug ),
      memberships ( id ),
      project_milestones ( id )
      `,
      { count: 'exact' },
    )
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (search) {
    query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
  }
  if (stage) {
    query = query.eq('funding_stage', stage);
  }
  if (tag) {
    query = query.contains('domain_tags', [tag]);
  }

  const { data, count, error } = await query;
  if (error) return { projects: [], total: 0 };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const projects: ProjectForInvestor[] = (data ?? []).map((row: any) => ({
    ...row,
    member_count: Array.isArray(row.memberships) ? row.memberships.length : 0,
    milestone_count: Array.isArray(row.project_milestones)
      ? row.project_milestones.length
      : 0,
  }));

  return { projects, total: count ?? 0 };
}

export async function listUserOrganizations(): Promise<Organization[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from('organizations')
    .select('*')
    .order('name');

  if (error) return [];
  return (data as Organization[]) ?? [];
}
