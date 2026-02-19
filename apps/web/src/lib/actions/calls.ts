'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { TablesInsert } from '@future-folklore-platform/db';

export async function createCall(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return redirect('/login');

  const title = (formData.get('title') as string)?.trim();
  const description = (formData.get('description') as string)?.trim() || null;
  const scheduled_at = formData.get('scheduled_at') as string;
  const duration_minutes = Number(formData.get('duration_minutes')) || 60;
  const video_link = (formData.get('video_link') as string)?.trim() || null;
  const project_id = (formData.get('project_id') as string) || null;

  if (!title || !scheduled_at) {
    return redirect('/calls/new?error=Title+and+date+are+required');
  }

  const insert: TablesInsert<'calls'> = {
    title,
    description,
    scheduled_at,
    duration_minutes,
    video_link,
    project_id,
    created_by: user.id,
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- PostgREST v14 type inference
  const { data, error } = await (supabase.from('calls') as any)
    .insert(insert)
    .select('id')
    .single();

  if (error || !data) {
    return redirect(
      `/calls/new?error=${encodeURIComponent(error?.message ?? 'Unknown error')}`,
    );
  }

  revalidatePath('/calls');
  return redirect(`/calls/${data.id}`);
}

export async function upsertRsvp(callId: string, status: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return redirect('/login');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- PostgREST v14 upsert type issue
  const { error } = await (supabase.from('call_rsvps') as any).upsert(
    { call_id: callId, profile_id: user.id, status },
    { onConflict: 'call_id,profile_id' },
  );

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/calls/${callId}`);
  revalidatePath('/calls');
  return { error: null };
}

export async function removeRsvp(callId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return redirect('/login');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from('call_rsvps') as any)
    .delete()
    .eq('call_id', callId)
    .eq('profile_id', user.id);

  revalidatePath(`/calls/${callId}`);
  revalidatePath('/calls');
}

export async function saveCallNotes(callId: string, notes: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return redirect('/login');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('calls') as any)
    .update({ notes: notes.trim() || null })
    .eq('id', callId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/calls/${callId}`);
  return { error: null };
}
