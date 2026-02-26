'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import {
  PROJECT_STAGES,
  type FundingStage,
} from '@future-folklore-platform/shared';

export async function updateProjectFunding(
  projectId: string,
  formData: FormData,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return redirect('/login');

  // Verify project lead
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: membership } = (await (supabase.from('memberships') as any)
    .select('id')
    .eq('project_id', projectId)
    .eq('profile_id', user.id)
    .eq('role', 'lead')
    .maybeSingle()) as { data: { id: string } | null };

  if (!membership) {
    return { error: 'Only project leads can update funding details' };
  }

  const stageRaw = (formData.get('funding_stage') as string)?.trim() || null;
  const stage: FundingStage | null =
    stageRaw && (PROJECT_STAGES as readonly string[]).includes(stageRaw)
      ? (stageRaw as FundingStage)
      : null;

  const soughtRaw = (formData.get('funding_sought') as string)?.trim();
  const receivedRaw = (formData.get('funding_received') as string)?.trim();

  const update: Record<string, unknown> = {
    funding_stage: stage,
    use_of_funds: (formData.get('use_of_funds') as string)?.trim() || null,
    funding_sought: soughtRaw ? parseFloat(soughtRaw) : null,
    funding_received: receivedRaw ? parseFloat(receivedRaw) : null,
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('projects') as any)
    .update(update)
    .eq('id', projectId);

  if (error) return { error: 'Failed to update funding: ' + error.message };

  revalidatePath(`/projects/${projectId}`);
  revalidatePath('/investor');
  return { error: null };
}
