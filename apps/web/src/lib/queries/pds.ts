import { createClient } from '@/lib/supabase/server';
import type {
  PdsReport,
  PdsListFilters,
} from '@future-folklore-platform/shared';

const REPORT_SELECT = `
  id, author_id, project_id, capture_mode,
  session_date, session_time, location, protocol, pre_session_state,
  sensory_data, narrative, duration_minutes, confidence, tags,
  content_hash, hash_algorithm, blockchain_timestamp_id,
  is_public, created_at, updated_at,
  author:profiles!author_id (username, display_name, avatar_url),
  project:projects (id, name, slug),
  blockchain_timestamp:blockchain_timestamps (anchor_status, anchor_chain, anchor_tx, anchored_at)
` as const;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRow(row: any): PdsReport {
  return {
    ...row,
    sensory_data: row.sensory_data ?? {},
    tags: row.tags ?? [],
    project: Array.isArray(row.project)
      ? (row.project[0] ?? null)
      : (row.project ?? null),
    blockchain_timestamp: Array.isArray(row.blockchain_timestamp)
      ? (row.blockchain_timestamp[0] ?? null)
      : (row.blockchain_timestamp ?? null),
  };
}

export async function listReports(
  filters: PdsListFilters = {},
): Promise<PdsReport[]> {
  const supabase = await createClient();
  const limit = filters.limit ?? 50;
  const offset = filters.offset ?? 0;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase.from('phenomenological_reports') as any)
    .select(REPORT_SELECT)
    .order('session_date', { ascending: false })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (filters.authorId) {
    query = query.eq('author_id', filters.authorId);
  }
  if (filters.projectId) {
    query = query.eq('project_id', filters.projectId);
  }
  if (filters.isPublic !== undefined) {
    query = query.eq('is_public', filters.isPublic);
  }
  if (filters.tags && filters.tags.length > 0) {
    query = query.overlaps('tags', filters.tags);
  }
  if (filters.search) {
    // Simple narrative search using ilike
    query = query.ilike('narrative', `%${filters.search}%`);
  }

  const { data, error } = await query;

  if (error || !data) return [];
  return (data as unknown[]).map(mapRow);
}

export async function getReport(id: string): Promise<PdsReport | null> {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = (await (
    supabase.from('phenomenological_reports') as any
  )
    .select(REPORT_SELECT)
    .eq('id', id)
    .single()) as { data: unknown; error: unknown };

  if (error || !data) return null;
  return mapRow(data);
}
