import { createClient } from '@/lib/supabase/server';
import type { Tables } from '@future-folklore-platform/db';

export type ProjectMilestone = Tables<'project_milestones'>;
export type BlockchainTimestamp = Tables<'blockchain_timestamps'>;

export interface MilestoneWithCreator extends ProjectMilestone {
  profiles: Pick<
    Tables<'profiles'>,
    'id' | 'username' | 'display_name' | 'avatar_url'
  >;
  blockchainTimestamp: BlockchainTimestamp | null;
}

export async function listProjectMilestones(
  projectId: string,
): Promise<MilestoneWithCreator[]> {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: milestones, error } = (await (
    supabase.from('project_milestones') as any
  )
    .select(
      `
      *,
      profiles:created_by ( id, username, display_name, avatar_url )
      `,
    )
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })) as {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any[] | null;
    error: { message: string } | null;
  };

  if (error || !milestones || milestones.length === 0) {
    return [];
  }

  // Fetch blockchain_timestamps for all milestones in one query
  const milestoneIds = milestones.map((m) => m.id);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: timestamps } = (await (
    supabase.from('blockchain_timestamps') as any
  )
    .select('*')
    .eq('content_type', 'milestone')
    .in('content_id', milestoneIds)) as {
    data: BlockchainTimestamp[] | null;
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const timestampMap = new Map<string, any>(
    (timestamps ?? []).map((t) => [t.content_id, t]),
  );

  return milestones.map((m) => ({
    ...m,
    blockchainTimestamp: timestampMap.get(m.id) ?? null,
  })) as MilestoneWithCreator[];
}
