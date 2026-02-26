'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export async function submitEOI(projectId: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return redirect('/login');

  const message = (formData.get('message') as string)?.trim();
  const notifyOnUpdate = formData.get('notify_on_update') === 'on';

  if (!message) return { error: 'Message is required' };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (
    supabase.from('expressions_of_interest') as any
  ).insert({
    project_id: projectId,
    investor_id: user.id,
    message,
    notify_on_update: notifyOnUpdate,
  });

  if (error) {
    if (error.code === '23505') {
      return { error: 'You have already expressed interest in this project' };
    }
    return { error: 'Failed to submit: ' + error.message };
  }

  revalidatePath(`/projects/${projectId}`);
  return { error: null };
}

export async function updateEOIStatus(
  eoiId: string,
  projectId: string,
  status: 'acknowledged' | 'declined',
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return redirect('/login');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('expressions_of_interest') as any)
    .update({ status })
    .eq('id', eoiId)
    .eq('project_id', projectId);

  if (error) return { error: 'Failed to update status: ' + error.message };

  revalidatePath(`/projects/${projectId}`);
  return { error: null };
}
