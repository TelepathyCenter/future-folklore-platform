'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { sha256Hex } from '@/lib/utils/hash';
import { submitHash } from '@/lib/services/originstamp';
import {
  RapidCaptureSchema,
  DetailedCaptureSchema,
} from '@future-folklore-platform/shared';
import type {
  RapidCaptureInput,
  DetailedCaptureInput,
} from '@future-folklore-platform/shared';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a deterministic canonical JSON string for hashing. */
function buildCanonicalContent(
  data: RapidCaptureInput | DetailedCaptureInput,
  authorId: string,
  createdAt: string,
): string {
  const canonical = {
    author_id: authorId,
    capture_mode: 'session_time' in data ? 'detailed' : 'rapid',
    confidence: data.confidence,
    created_at: createdAt,
    is_public: data.is_public,
    location: data.location ?? '',
    narrative: data.narrative,
    project_id: data.project_id ?? '',
    session_date: data.session_date,
    tags: [...data.tags].sort(),
    ...('session_time' in data && {
      duration_minutes: data.duration_minutes ?? null,
      pre_session_state: data.pre_session_state ?? '',
      protocol: data.protocol ?? '',
      sensory_data: data.sensory_data,
      session_time: data.session_time ?? '',
    }),
  };
  return JSON.stringify(canonical);
}

// ---------------------------------------------------------------------------
// submitRapidReport
// ---------------------------------------------------------------------------

export async function submitRapidReport(
  input: RapidCaptureInput,
): Promise<{ reportId: string | null; error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return redirect('/login');

  const parsed = RapidCaptureSchema.safeParse(input);
  if (!parsed.success) {
    return {
      reportId: null,
      error: parsed.error.issues[0]?.message ?? 'Invalid data',
    };
  }

  const data = parsed.data;
  const createdAt = new Date().toISOString();
  const canonicalStr = buildCanonicalContent(data, user.id, createdAt);
  const contentHash = await sha256Hex(canonicalStr);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: report, error: insertError } = (await (
    supabase.from('phenomenological_reports') as any
  )
    .insert({
      author_id: user.id,
      project_id: data.project_id || null,
      capture_mode: 'rapid',
      session_date: data.session_date,
      location: data.location ?? null,
      sensory_data: {},
      narrative: data.narrative,
      confidence: data.confidence,
      tags: data.tags,
      content_hash: contentHash,
      is_public: data.is_public,
      created_at: createdAt,
    })
    .select('id')
    .single()) as {
    data: { id: string } | null;
    error: { message: string } | null;
  };

  if (insertError || !report) {
    return {
      reportId: null,
      error: 'Failed to save report: ' + (insertError?.message ?? 'unknown'),
    };
  }

  // Blockchain timestamp (fire-and-forget — failure is non-fatal)
  const receipt = await submitHash(
    contentHash,
    `FF-PDS rapid report — ${data.session_date}`,
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: tsRow } = (await (supabase.from('blockchain_timestamps') as any)
    .insert({
      content_hash: contentHash,
      content_type: 'report',
      content_id: report.id,
      anchor_status: receipt.anchored
        ? receipt.submitStatus === 3
          ? 'verified'
          : 'anchored'
        : 'pending',
      anchor_chain: receipt.anchorChain,
      anchor_tx: receipt.anchorTx,
      anchored_at: receipt.anchoredAt?.toISOString() ?? null,
      created_by: user.id,
    })
    .select('id')
    .single()) as { data: { id: string } | null };

  if (tsRow) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('phenomenological_reports') as any)
      .update({ blockchain_timestamp_id: tsRow.id })
      .eq('id', report.id);
  }

  revalidatePath('/pds');
  return { reportId: report.id, error: null };
}

// ---------------------------------------------------------------------------
// submitDetailedReport
// ---------------------------------------------------------------------------

export async function submitDetailedReport(
  input: DetailedCaptureInput,
): Promise<{ reportId: string | null; error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return redirect('/login');

  const parsed = DetailedCaptureSchema.safeParse(input);
  if (!parsed.success) {
    return {
      reportId: null,
      error: parsed.error.issues[0]?.message ?? 'Invalid data',
    };
  }

  const data = parsed.data;
  const createdAt = new Date().toISOString();
  const canonicalStr = buildCanonicalContent(data, user.id, createdAt);
  const contentHash = await sha256Hex(canonicalStr);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: report, error: insertError } = (await (
    supabase.from('phenomenological_reports') as any
  )
    .insert({
      author_id: user.id,
      project_id: data.project_id || null,
      capture_mode: 'detailed',
      session_date: data.session_date,
      session_time: data.session_time || null,
      location: data.location ?? null,
      protocol: data.protocol ?? null,
      pre_session_state: data.pre_session_state ?? null,
      sensory_data: data.sensory_data,
      narrative: data.narrative,
      duration_minutes: data.duration_minutes ?? null,
      confidence: data.confidence,
      tags: data.tags,
      content_hash: contentHash,
      is_public: data.is_public,
      created_at: createdAt,
    })
    .select('id')
    .single()) as {
    data: { id: string } | null;
    error: { message: string } | null;
  };

  if (insertError || !report) {
    return {
      reportId: null,
      error: 'Failed to save report: ' + (insertError?.message ?? 'unknown'),
    };
  }

  // Blockchain timestamp (fire-and-forget)
  const receipt = await submitHash(
    contentHash,
    `FF-PDS detailed report — ${data.session_date}`,
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: tsRow } = (await (supabase.from('blockchain_timestamps') as any)
    .insert({
      content_hash: contentHash,
      content_type: 'report',
      content_id: report.id,
      anchor_status: receipt.anchored
        ? receipt.submitStatus === 3
          ? 'verified'
          : 'anchored'
        : 'pending',
      anchor_chain: receipt.anchorChain,
      anchor_tx: receipt.anchorTx,
      anchored_at: receipt.anchoredAt?.toISOString() ?? null,
      created_by: user.id,
    })
    .select('id')
    .single()) as { data: { id: string } | null };

  if (tsRow) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('phenomenological_reports') as any)
      .update({ blockchain_timestamp_id: tsRow.id })
      .eq('id', report.id);
  }

  revalidatePath('/pds');
  return { reportId: report.id, error: null };
}

// ---------------------------------------------------------------------------
// deleteReport
// ---------------------------------------------------------------------------

export async function deleteReport(
  reportId: string,
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'Not authenticated' };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('phenomenological_reports') as any)
    .delete()
    .eq('id', reportId)
    .eq('author_id', user.id);

  if (error) {
    return { error: 'Failed to delete report' };
  }

  revalidatePath('/pds');
  return { error: null };
}
