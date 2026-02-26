'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getTimestampStatus } from '@/lib/services/originstamp';

/**
 * Poll OriginStamp for the latest anchor status of a blockchain_timestamp row
 * and update it in the database if anchored.
 *
 * Any authenticated user can trigger this — the anchor state is a public
 * fact from OriginStamp, not user-controlled data.
 */
export async function refreshAnchorStatus(
  timestampId: string,
  contentHash: string,
  revalidatePaths: string[] = [],
): Promise<{ anchored: boolean; error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { anchored: false, error: 'Not authenticated' };
  }

  const receipt = await getTimestampStatus(contentHash);

  if (receipt.error) {
    return { anchored: false, error: receipt.error };
  }

  if (receipt.anchored) {
    const newStatus = receipt.submitStatus === 3 ? 'verified' : 'anchored';

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('blockchain_timestamps') as any)
      .update({
        anchor_status: newStatus,
        anchor_chain: receipt.anchorChain,
        anchor_tx: receipt.anchorTx,
        anchored_at: receipt.anchoredAt?.toISOString() ?? null,
      })
      .eq('id', timestampId);

    if (error) {
      return { anchored: false, error: 'Failed to update anchor status' };
    }

    for (const path of revalidatePaths) {
      revalidatePath(path);
    }
  }

  return { anchored: receipt.anchored, error: null };
}
