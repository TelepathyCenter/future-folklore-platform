import { createClient } from '@/lib/supabase/server';
import type { Tables } from '@future-folklore-platform/db';

export type Call = Tables<'calls'>;
export type CallRsvp = Tables<'call_rsvps'>;

export interface CallWithMeta extends Call {
  creator: Pick<
    Tables<'profiles'>,
    'id' | 'username' | 'display_name' | 'avatar_url'
  >;
  rsvp_counts: { going: number; not_going: number; maybe: number };
  my_rsvp: CallRsvp | null;
}

export interface CallDetail extends Call {
  creator: Pick<
    Tables<'profiles'>,
    'id' | 'username' | 'display_name' | 'avatar_url'
  >;
  project: Pick<Tables<'projects'>, 'id' | 'name' | 'slug'> | null;
  rsvps: Array<
    CallRsvp & {
      profiles: Pick<
        Tables<'profiles'>,
        'id' | 'username' | 'display_name' | 'avatar_url'
      >;
    }
  >;
  my_rsvp: CallRsvp | null;
}

export interface CallListParams {
  scope?: 'community' | 'project' | 'all';
  timeframe?: 'upcoming' | 'past';
  page?: number;
  limit?: number;
}

export async function listCalls(
  params: CallListParams = {},
): Promise<{ calls: CallWithMeta[]; total: number }> {
  const { scope = 'all', timeframe, page = 1, limit = 12 } = params;
  const supabase = await createClient();
  const offset = (page - 1) * limit;
  const now = new Date().toISOString();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let query = supabase
    .from('calls')
    .select(
      `
      *,
      creator:profiles!calls_created_by_fkey ( id, username, display_name, avatar_url )
      `,
      { count: 'exact' },
    )
    .order('scheduled_at', { ascending: timeframe !== 'past' })
    .range(offset, offset + limit - 1);

  if (scope === 'community') {
    query = query.is('project_id', null);
  } else if (scope === 'project') {
    query = query.not('project_id', 'is', null);
  }

  if (timeframe === 'upcoming') {
    query = query.gte('scheduled_at', now);
  } else if (timeframe === 'past') {
    query = query.lt('scheduled_at', now);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- PostgREST v14 embedded select type inference
  const { data, count, error } = (await query) as {
    data: any[] | null;
    count: number | null;
    error: any;
  };
  if (error) return { calls: [], total: 0 };

  const callIds = (data ?? []).map((c: any) => c.id);
  const rsvpsByCall: Record<string, CallRsvp[]> = {};
  const myRsvpsByCall: Record<string, CallRsvp> = {};

  if (callIds.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: rsvpData } = (await supabase
      .from('call_rsvps')
      .select('*')
      .in('call_id', callIds)) as { data: CallRsvp[] | null };

    for (const rsvp of rsvpData ?? []) {
      rsvpsByCall[rsvp.call_id] = rsvpsByCall[rsvp.call_id] ?? [];
      rsvpsByCall[rsvp.call_id].push(rsvp);
      if (user && rsvp.profile_id === user.id) {
        myRsvpsByCall[rsvp.call_id] = rsvp;
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const calls: CallWithMeta[] = (data ?? []).map((call: any) => {
    const rsvps = rsvpsByCall[call.id] ?? [];
    return {
      ...call,
      rsvp_counts: {
        going: rsvps.filter((r) => r.status === 'going').length,
        not_going: rsvps.filter((r) => r.status === 'not_going').length,
        maybe: rsvps.filter((r) => r.status === 'maybe').length,
      },
      my_rsvp: myRsvpsByCall[call.id] ?? null,
    };
  });

  return { calls, total: count ?? 0 };
}

export async function getCall(id: string): Promise<CallDetail | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- PostgREST v14 embedded select type inference
  const { data: call, error } = (await supabase
    .from('calls')
    .select(
      `
      *,
      creator:profiles!calls_created_by_fkey ( id, username, display_name, avatar_url ),
      project:projects ( id, name, slug ),
      rsvps:call_rsvps (
        *,
        profiles ( id, username, display_name, avatar_url )
      )
      `,
    )
    .eq('id', id)
    .single()) as { data: any; error: any };

  if (error || !call) return null;

  const callData = call;
  const myRsvp = user
    ? ((callData.rsvps as CallRsvp[])?.find((r) => r.profile_id === user.id) ??
      null)
    : null;

  return { ...callData, my_rsvp: myRsvp } as CallDetail;
}
