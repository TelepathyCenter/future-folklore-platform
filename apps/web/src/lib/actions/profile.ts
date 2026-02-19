'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { TablesUpdate } from '@future-folklore-platform/db';

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect('/login');
  }

  const display_name = formData.get('display_name') as string;
  const bio = formData.get('bio') as string;
  const role = formData.get('role') as string;
  const visibility = formData.get('visibility') as string;
  const expertise_tags_raw = formData.get('expertise_tags') as string;
  const expertise_tags = expertise_tags_raw
    ? expertise_tags_raw
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
    : [];

  const updates: TablesUpdate<'profiles'> = {
    display_name: display_name || null,
    bio: bio || null,
    role: role as TablesUpdate<'profiles'>['role'],
    visibility: visibility as TablesUpdate<'profiles'>['visibility'],
    expertise_tags,
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase PostgREST v14 type inference issue with .update().eq() chain
  const { error } = await (supabase.from('profiles') as any)
    .update(updates)
    .eq('id', user.id);

  if (error) {
    return redirect(`/profile/edit?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath('/profile');
  revalidatePath('/directory');
  return redirect('/profile');
}
