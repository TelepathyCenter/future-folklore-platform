import { createClient } from '@/lib/supabase/server';
import type { Tables } from '@future-folklore-platform/db';

export type Resource = Tables<'resources'>;

export interface ResourceWithMeta extends Resource {
  profiles: Pick<
    Tables<'profiles'>,
    'id' | 'username' | 'display_name' | 'avatar_url'
  >;
  projects: Pick<Tables<'projects'>, 'id' | 'name' | 'visibility'>;
  current_version: Pick<
    Tables<'resource_versions'>,
    'id' | 'file_name' | 'file_size_bytes' | 'mime_type' | 'storage_path'
  > | null;
}

export interface ResourceDetail extends ResourceWithMeta {
  resource_versions: Array<
    Tables<'resource_versions'> & {
      profiles: Pick<
        Tables<'profiles'>,
        'id' | 'username' | 'display_name' | 'avatar_url'
      >;
    }
  >;
}

export interface ResourceListParams {
  projectId?: string;
  search?: string;
  type?: string;
  tag?: string;
  page?: number;
  limit?: number;
}

export async function listResources(
  params: ResourceListParams = {},
): Promise<{ resources: ResourceWithMeta[]; total: number }> {
  const { projectId, search, type, tag, page = 1, limit = 12 } = params;
  const supabase = await createClient();
  const offset = (page - 1) * limit;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase.from('resources') as any)
    .select(
      `
      *,
      profiles:created_by ( id, username, display_name, avatar_url ),
      projects:project_id ( id, name, visibility ),
      current_version:current_version_id ( id, file_name, file_size_bytes, mime_type, storage_path )
      `,
      { count: 'exact' },
    )
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (projectId) {
    query = query.eq('project_id', projectId);
  }

  if (search) {
    query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
  }

  if (type) {
    query = query.eq('resource_type', type);
  }

  if (tag) {
    query = query.contains('tags', [tag]);
  }

  const { data, count, error } = (await query) as {
    data: ResourceWithMeta[] | null;
    count: number | null;
    error: { message: string } | null;
  };

  if (error) return { resources: [], total: 0 };
  return { resources: data ?? [], total: count ?? 0 };
}

export async function getResource(id: string): Promise<ResourceDetail | null> {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = (await (supabase.from('resources') as any)
    .select(
      `
      *,
      profiles:created_by ( id, username, display_name, avatar_url ),
      projects:project_id ( id, name, visibility ),
      current_version:current_version_id ( id, file_name, file_size_bytes, mime_type, storage_path ),
      resource_versions ( *, profiles:uploaded_by ( id, username, display_name, avatar_url ) )
      `,
    )
    .eq('id', id)
    .order('version_number', {
      referencedTable: 'resource_versions',
      ascending: false,
    })
    .single()) as {
    data: ResourceDetail | null;
    error: { message: string } | null;
  };

  if (error) return null;
  return data;
}

export async function listProjectResources(
  projectId: string,
): Promise<ResourceWithMeta[]> {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = (await (supabase.from('resources') as any)
    .select(
      `
      *,
      profiles:created_by ( id, username, display_name, avatar_url ),
      projects:project_id ( id, name, visibility ),
      current_version:current_version_id ( id, file_name, file_size_bytes, mime_type, storage_path )
      `,
    )
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
    .limit(50)) as {
    data: ResourceWithMeta[] | null;
    error: { message: string } | null;
  };

  if (error) return [];
  return data ?? [];
}
