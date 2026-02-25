import { createClient } from '@/lib/supabase/server';
import type { Tables } from '@future-folklore-platform/db';

export type Update = Tables<'updates'>;

export interface UpdateWithMeta extends Update {
  profiles: Pick<
    Tables<'profiles'>,
    'id' | 'username' | 'display_name' | 'avatar_url'
  >;
  projects: Pick<Tables<'projects'>, 'id' | 'name' | 'visibility'> | null;
}

export interface UpdateListParams {
  projectId?: string;
  status?: string;
  tag?: string;
  page?: number;
  limit?: number;
}

export async function listUpdates(
  params: UpdateListParams = {},
): Promise<{ updates: UpdateWithMeta[]; total: number }> {
  const { projectId, status, tag, page = 1, limit = 10 } = params;
  const supabase = await createClient();
  const offset = (page - 1) * limit;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase.from('updates') as any)
    .select(
      `
      *,
      profiles:created_by ( id, username, display_name, avatar_url ),
      projects:project_id ( id, name, visibility )
      `,
      { count: 'exact' },
    )
    .order('published_at', { ascending: false, nullsFirst: false })
    .range(offset, offset + limit - 1);

  if (projectId) {
    query = query.eq('project_id', projectId);
  }

  if (status) {
    query = query.eq('status', status);
  }

  if (tag) {
    query = query.contains('tags', [tag]);
  }

  const { data, count, error } = (await query) as {
    data: UpdateWithMeta[] | null;
    count: number | null;
    error: { message: string } | null;
  };

  if (error) return { updates: [], total: 0 };
  return { updates: data ?? [], total: count ?? 0 };
}

export async function getUpdate(id: string): Promise<UpdateWithMeta | null> {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = (await (supabase.from('updates') as any)
    .select(
      `
      *,
      profiles:created_by ( id, username, display_name, avatar_url ),
      projects:project_id ( id, name, visibility )
      `,
    )
    .eq('id', id)
    .single()) as {
    data: UpdateWithMeta | null;
    error: { message: string } | null;
  };

  if (error) return null;
  return data;
}

export async function listPublicUpdates(
  projectId?: string,
  limit = 50,
): Promise<UpdateWithMeta[]> {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase.from('updates') as any)
    .select(
      `
      *,
      profiles:created_by ( id, username, display_name, avatar_url ),
      projects:project_id ( id, name, visibility )
      `,
    )
    .eq('status', 'published')
    .order('published_at', { ascending: false, nullsFirst: false })
    .limit(limit);

  if (projectId) {
    query = query.eq('project_id', projectId);
  }

  const { data, error } = (await query) as {
    data: UpdateWithMeta[] | null;
    error: { message: string } | null;
  };

  if (error) return [];
  return data ?? [];
}
