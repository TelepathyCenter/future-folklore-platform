'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { sha256Hex } from '@/lib/utils/hash';
import { submitHash } from '@/lib/services/originstamp';

/** Build a deterministic canonical string for an update so its hash is reproducible. */
function buildUpdateCanonical(fields: {
  body: string | null;
  created_at: string;
  created_by: string;
  project_id: string | null;
  tags: string[];
  title: string;
}): string {
  return JSON.stringify({
    body: fields.body ?? '',
    created_at: fields.created_at,
    created_by: fields.created_by,
    project_id: fields.project_id ?? '',
    tags: [...fields.tags].sort(),
    title: fields.title,
  });
}

async function timestampUpdate(params: {
  updateId: string;
  title: string;
  body: string | null;
  tags: string[];
  projectId: string | null;
  createdBy: string;
  createdAt: string;
  supabase: Awaited<ReturnType<typeof createClient>>;
}): Promise<void> {
  const canonical = buildUpdateCanonical({
    body: params.body,
    created_at: params.createdAt,
    created_by: params.createdBy,
    project_id: params.projectId,
    tags: params.tags,
    title: params.title,
  });
  const contentHash = await sha256Hex(canonical);

  const receipt = await submitHash(
    contentHash,
    `Future Folklore Platform — update: ${params.title}`,
  );

  // Upsert so re-publishing an edited update updates the receipt
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (params.supabase.from('blockchain_timestamps') as any).upsert(
    {
      content_hash: contentHash,
      content_type: 'update',
      content_id: params.updateId,
      anchor_status: receipt.anchored
        ? receipt.submitStatus === 3
          ? 'verified'
          : 'anchored'
        : 'pending',
      anchor_chain: receipt.anchorChain,
      anchor_tx: receipt.anchorTx,
      anchored_at: receipt.anchoredAt?.toISOString() ?? null,
      created_by: params.createdBy,
    },
    { onConflict: 'content_type,content_id' },
  );
}

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

  const isPublished = status === 'published';
  const createdAt = new Date().toISOString();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: update, error } = (await (supabase.from('updates') as any)
    .insert({
      title,
      body,
      tags,
      project_id: projectId,
      status: isPublished ? 'published' : 'draft',
      created_by: user.id,
      created_at: createdAt,
    })
    .select('id')
    .single()) as {
    data: { id: string } | null;
    error: { message: string } | null;
  };

  if (error || !update) {
    return {
      error: 'Failed to create update: ' + (error?.message ?? 'unknown'),
    };
  }

  // Blockchain-timestamp published updates
  if (isPublished) {
    await timestampUpdate({
      updateId: update.id,
      title,
      body,
      tags,
      projectId,
      createdBy: user.id,
      createdAt,
      supabase,
    });
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
    .select('project_id, created_by, created_at')
    .eq('id', id)
    .single()) as {
    data: {
      project_id: string | null;
      created_by: string;
      created_at: string;
    } | null;
  };

  if (!existing || existing.created_by !== user.id) {
    return { error: 'Update not found or not authorized' };
  }

  const isPublished = status === 'published';

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('updates') as any)
    .update({
      title,
      body,
      tags,
      status: isPublished ? 'published' : 'draft',
    })
    .eq('id', id);

  if (error) {
    return { error: 'Failed to update: ' + error.message };
  }

  // (Re-)timestamp when publishing or re-publishing after edits
  if (isPublished) {
    await timestampUpdate({
      updateId: id,
      title,
      body,
      tags,
      projectId: existing.project_id,
      createdBy: existing.created_by,
      createdAt: existing.created_at,
      supabase,
    });
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
