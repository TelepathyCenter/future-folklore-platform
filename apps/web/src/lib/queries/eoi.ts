import { createClient } from '@/lib/supabase/server';

export interface EOIWithInvestor {
  id: string;
  project_id: string;
  investor_id: string;
  message: string;
  status: 'pending' | 'acknowledged' | 'declined';
  notify_on_update: boolean;
  created_at: string;
  profiles: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
}

export interface MyEOI {
  id: string;
  project_id: string;
  message: string;
  status: 'pending' | 'acknowledged' | 'declined';
  notify_on_update: boolean;
  created_at: string;
}

export async function listInboundEOIs(
  projectId: string,
): Promise<EOIWithInvestor[]> {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('expressions_of_interest')
    .select('*, profiles(id, username, display_name, avatar_url)')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  if (error) return [];
  return (data ?? []) as EOIWithInvestor[];
}

export async function getMyEOI(projectId: string): Promise<MyEOI | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('expressions_of_interest')
    .select('id, project_id, message, status, notify_on_update, created_at')
    .eq('project_id', projectId)
    .eq('investor_id', user.id)
    .maybeSingle();

  if (error) return null;
  return (data as MyEOI) ?? null;
}
