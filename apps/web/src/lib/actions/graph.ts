'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { TablesInsert } from '@future-folklore-platform/db';

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export async function createConcept(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return redirect('/login');

  const name = (formData.get('name') as string)?.trim();
  const description = (formData.get('description') as string)?.trim() || null;
  const parentId = (formData.get('parent_id') as string) || null;

  if (!name) {
    return redirect('/graph/concepts/new?error=Name+is+required');
  }

  const slug = slugify(name);
  if (!slug) {
    return redirect('/graph/concepts/new?error=Invalid+name');
  }

  const insert: TablesInsert<'concepts'> = {
    name,
    slug,
    description,
    parent_id: parentId,
    created_by: user.id,
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('concepts') as any)
    .insert(insert)
    .select('slug')
    .single();

  if (error) {
    const msg =
      error.code === '23505'
        ? 'A concept with this name already exists'
        : error.message;
    return redirect(`/graph/concepts/new?error=${encodeURIComponent(msg)}`);
  }

  revalidatePath('/graph/concepts');
  return redirect(`/graph/concepts/${data.slug}`);
}

export async function updateConcept(id: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return redirect('/login');

  const name = (formData.get('name') as string)?.trim();
  const description = (formData.get('description') as string)?.trim() || null;
  const parentId = (formData.get('parent_id') as string) || null;

  if (!name) {
    return { error: 'Name is required' };
  }

  const slug = slugify(name);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('concepts') as any)
    .update({ name, slug, description, parent_id: parentId })
    .eq('id', id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/graph/concepts');
  revalidatePath(`/graph/concepts/${slug}`);
  return { error: null };
}

export async function createEdge(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return redirect('/login');

  const sourceType = formData.get('source_type') as string;
  const sourceId = formData.get('source_id') as string;
  const targetType = formData.get('target_type') as string;
  const targetId = formData.get('target_id') as string;
  const edgeType = formData.get('edge_type') as string;
  const notes = (formData.get('notes') as string)?.trim() || null;

  if (!sourceType || !sourceId || !targetType || !targetId || !edgeType) {
    return { error: 'All fields are required' };
  }

  const insert: TablesInsert<'graph_edges'> = {
    source_type: sourceType as TablesInsert<'graph_edges'>['source_type'],
    source_id: sourceId,
    target_type: targetType as TablesInsert<'graph_edges'>['target_type'],
    target_id: targetId,
    edge_type: edgeType as TablesInsert<'graph_edges'>['edge_type'],
    notes,
    created_by: user.id,
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('graph_edges') as any).insert(insert);

  if (error) {
    const msg =
      error.code === '23505' ? 'This connection already exists' : error.message;
    return { error: msg };
  }

  revalidatePath('/graph');
  revalidatePath('/graph/concepts');
  return { error: null };
}

export async function deleteEdge(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return redirect('/login');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('graph_edges') as any)
    .delete()
    .eq('id', id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/graph');
  revalidatePath('/graph/concepts');
  return { error: null };
}
