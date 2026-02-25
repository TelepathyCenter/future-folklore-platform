'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export async function createUpdate(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return redirect('/login');

  const title = (formData.get('title') as string)?.trim();
  const body = (formData.get('body') as string)?.trim() || null;
  const projectId = (formData.get('project_id') as string)?.trim() || null;
  const tagsRaw = (formData.get('tags') as string)?.trim() || '';
  const status = formData.get('status') as string;

  if (!title) {
    return { error: 'Title is required' };
  }

  const tags = tagsRaw
    ? tagsRaw
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
    : [];

  // If project-scoped, verify membership
  if (projectId) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: membership } = (await (supabase.from('memberships') as any)
      .select('id')
      .eq('project_id', projectId)
      .eq('profile_id', user.id)
      .maybeSingle()) as { data: { id: string } | null };

    if (!membership) {
      return { error: 'Only project members can post project updates' };
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('updates') as any).insert({
    title,
    body,
    tags,
    project_id: projectId,
    status: status === 'published' ? 'published' : 'draft',
    created_by: user.id,
  });

  if (error) {
    return { error: 'Failed to create update: ' + error.message };
  }

  revalidatePath('/dashboard');
  if (projectId) {
    revalidatePath(`/projects/${projectId}`);
  }
  return { error: null };
}

export async function editUpdate(id: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return redirect('/login');

  const title = (formData.get('title') as string)?.trim();
  const body = (formData.get('body') as string)?.trim() || null;
  const tagsRaw = (formData.get('tags') as string)?.trim() || '';
  const status = formData.get('status') as string;

  if (!title) {
    return { error: 'Title is required' };
  }

  const tags = tagsRaw
    ? tagsRaw
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
    : [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = (await (supabase.from('updates') as any)
    .select('project_id, created_by')
    .eq('id', id)
    .single()) as {
    data: { project_id: string | null; created_by: string } | null;
  };

  if (!existing || existing.created_by !== user.id) {
    return { error: 'Update not found or not authorized' };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('updates') as any)
    .update({
      title,
      body,
      tags,
      status: status === 'published' ? 'published' : 'draft',
    })
    .eq('id', id);

  if (error) {
    return { error: 'Failed to update: ' + error.message };
  }

  revalidatePath('/dashboard');
  if (existing.project_id) {
    revalidatePath(`/projects/${existing.project_id}`);
  }
  return { error: null };
}

export async function deleteUpdate(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return redirect('/login');

  // Get project_id for revalidation before deleting
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = (await (supabase.from('updates') as any)
    .select('project_id, created_by')
    .eq('id', id)
    .single()) as {
    data: { project_id: string | null; created_by: string } | null;
  };

  if (!existing || existing.created_by !== user.id) {
    return { error: 'Update not found or not authorized' };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('updates') as any)
    .delete()
    .eq('id', id);

  if (error) {
    return { error: 'Failed to delete update: ' + error.message };
  }

  revalidatePath('/dashboard');
  if (existing.project_id) {
    revalidatePath(`/projects/${existing.project_id}`);
  }
  return { error: null };
}
