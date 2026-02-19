'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { TablesInsert } from '@future-folklore-platform/db';

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export async function createProject(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect('/login');
  }

  const name = (formData.get('name') as string)?.trim();
  const description = formData.get('description') as string;
  const organization_id = formData.get('organization_id') as string;
  const status = formData.get('status') as string;
  const visibility = formData.get('visibility') as string;
  const domain_tags_raw = formData.get('domain_tags') as string;
  const domain_tags = domain_tags_raw
    ? domain_tags_raw
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
    : [];

  if (!name || !organization_id) {
    return redirect('/projects/new?error=Name+and+organization+are+required');
  }

  const slug = slugify(name);

  const insert: TablesInsert<'projects'> = {
    name,
    slug,
    description: description || null,
    organization_id,
    status: status as TablesInsert<'projects'>['status'],
    visibility: visibility as TablesInsert<'projects'>['visibility'],
    domain_tags,
    links: {},
    created_by: user.id,
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase PostgREST v14 type inference issue
  const { data, error } = await (supabase.from('projects') as any)
    .insert(insert)
    .select('id')
    .single();

  if (error) {
    return redirect(`/projects/new?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath('/projects');
  return redirect(`/projects/${data.id}`);
}
