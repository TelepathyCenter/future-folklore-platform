import { createClient } from '@/lib/supabase/server';
import type { Tables } from '@future-folklore-platform/db';

export type ProjectMilestone = Tables<'project_milestones'>;

export interface MilestoneWithCreator extends ProjectMilestone {
  profiles: Pick<
    Tables<'profiles'>,
    'id' | 'username' | 'display_name' | 'avatar_url'
  >;
}

export async function listProjectMilestones(
  projectId: string,
): Promise<MilestoneWithCreator[]> {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = (await (supabase.from('project_milestones') as any)
    .select(
      `
      *,
      profiles:created_by ( id, username, display_name, avatar_url )
      `,
    )
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })) as {
    data: MilestoneWithCreator[] | null;
    error: { message: string } | null;
  };

  if (error) return [];
  return data ?? [];
}
