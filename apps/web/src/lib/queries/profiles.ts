import { createClient } from '@/lib/supabase/server';
import type { Tables } from '@future-folklore-platform/db';

export type Profile = Tables<'profiles'>;

export interface ProfileListParams {
  search?: string;
  role?: string;
  page?: number;
  limit?: number;
}

export async function getProfile(id: string): Promise<Profile | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return null;
  return data;
}

export async function getProfileByUsername(
  username: string,
): Promise<Profile | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single();

  if (error) return null;
  return data;
}

export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;
  return getProfile(user.id);
}

export async function listProfiles(
  params: ProfileListParams = {},
): Promise<{ profiles: Profile[]; total: number }> {
  const { search, role, page = 1, limit = 12 } = params;
  const supabase = await createClient();
  const offset = (page - 1) * limit;

  let query = supabase
    .from('profiles')
    .select('*', { count: 'exact' })
    .in('visibility', ['public', 'community'] as const)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (search) {
    query = query.or(
      `username.ilike.%${search}%,display_name.ilike.%${search}%,bio.ilike.%${search}%`,
    );
  }

  if (role) {
    query = query.eq('role', role);
  }

  const { data, count, error } = await query;

  if (error) {
    return { profiles: [], total: 0 };
  }

  return { profiles: (data as Profile[]) ?? [], total: count ?? 0 };
}
