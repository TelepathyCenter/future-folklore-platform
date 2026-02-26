'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { hashMilestoneContent, verifyMilestoneHash } from '@/lib/utils/hash';
import type { MilestoneHashInput } from '@/lib/utils/hash';
import { submitHash } from '@/lib/services/originstamp';

export async function createMilestone(projectId: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return redirect('/login');

  const title = (formData.get('title') as string)?.trim();
  const description = (formData.get('description') as string)?.trim() || null;
  const evidenceUrl = (formData.get('evidence_url') as string)?.trim() || null;

  if (!title) {
    return { error: 'Title is required' };
  }

  // Verify user is a project member
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: membership } = (await (supabase.from('memberships') as any)
    .select('id')
    .eq('project_id', projectId)
    .eq('profile_id', user.id)
    .maybeSingle()) as { data: { id: string } | null };

  if (!membership) {
    return { error: 'Only project members can record milestones' };
  }

  // Generate timestamp server-side BEFORE hashing
  const createdAt = new Date().toISOString();

  const hashInput: MilestoneHashInput = {
    title,
    description,
    evidence_url: evidenceUrl,
    created_at: createdAt,
  };

  const contentHash = await hashMilestoneContent(hashInput);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: milestone, error } = (await (
    supabase.from('project_milestones') as any
  )
    .insert({
      project_id: projectId,
      title,
      description,
      evidence_url: evidenceUrl,
      content_hash: contentHash,
      created_by: user.id,
      created_at: createdAt,
    })
    .select('id')
    .single()) as {
    data: { id: string } | null;
    error: { message: string } | null;
  };

  if (error || !milestone) {
    return {
      error: 'Failed to record milestone: ' + (error?.message ?? 'unknown'),
    };
  }

  // Submit hash to OriginStamp for blockchain anchoring (fire-and-forget style;
  // failure is non-fatal — the hash is still stored locally).
  const receipt = await submitHash(
    contentHash,
    `Future Folklore Platform — milestone: ${title}`,
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from('blockchain_timestamps') as any).insert({
    content_hash: contentHash,
    content_type: 'milestone',
    content_id: milestone.id,
    anchor_status: receipt.anchored
      ? receipt.submitStatus === 3
        ? 'verified'
        : 'anchored'
      : 'pending',
    anchor_chain: receipt.anchorChain,
    anchor_tx: receipt.anchorTx,
    anchored_at: receipt.anchoredAt?.toISOString() ?? null,
    created_by: user.id,
  });

  revalidatePath(`/projects/${projectId}`);
  return { error: null };
}

export async function verifyMilestone(
  milestoneId: string,
): Promise<{ valid: boolean; error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { valid: false, error: 'Not authenticated' };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: milestone, error } = (await (
    supabase.from('project_milestones') as any
  )
    .select('title, description, evidence_url, created_at, content_hash')
    .eq('id', milestoneId)
    .single()) as {
    data: {
      title: string;
      description: string | null;
      evidence_url: string | null;
      created_at: string;
      content_hash: string;
    } | null;
    error: { message: string } | null;
  };

  if (error || !milestone) {
    return { valid: false, error: 'Milestone not found' };
  }

  const hashInput: MilestoneHashInput = {
    title: milestone.title,
    description: milestone.description,
    evidence_url: milestone.evidence_url,
    created_at: milestone.created_at,
  };

  const valid = await verifyMilestoneHash(hashInput, milestone.content_hash);

  return { valid, error: null };
}
