'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { MAX_FILE_SIZE_BYTES } from '@future-folklore-platform/shared';
import { getResource } from '@/lib/queries/resources';
import type { ResourceDetail } from '@/lib/queries/resources';

export async function getResourceAction(
  id: string,
): Promise<ResourceDetail | null> {
  return getResource(id);
}

export async function createResource(projectId: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return redirect('/login');

  // Verify membership
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: membership } = (await (supabase.from('memberships') as any)
    .select('id')
    .eq('project_id', projectId)
    .eq('profile_id', user.id)
    .maybeSingle()) as { data: { id: string } | null };

  if (!membership) {
    return { error: 'Only project members can add resources' };
  }

  const title = (formData.get('title') as string)?.trim();
  const description = (formData.get('description') as string)?.trim() || null;
  const resourceType = (formData.get('resource_type') as string) || 'document';
  const externalUrl = (formData.get('external_url') as string)?.trim() || null;
  const tagsRaw = (formData.get('tags') as string)?.trim() || '';
  const file = formData.get('file') as File | null;

  if (!title) {
    return { error: 'Title is required' };
  }

  const tags = tagsRaw
    ? tagsRaw
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
    : [];

  // Validate file size
  if (file && file.size > 0 && file.size > MAX_FILE_SIZE_BYTES) {
    return { error: 'File exceeds 50 MB limit' };
  }

  // Insert resource
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: resource, error: insertError } = (await (
    supabase.from('resources') as any
  )
    .insert({
      project_id: projectId,
      title,
      description,
      resource_type: resourceType,
      tags,
      external_url: externalUrl,
      created_by: user.id,
    })
    .select('id')
    .single()) as {
    data: { id: string } | null;
    error: { message: string } | null;
  };

  if (insertError || !resource) {
    return {
      error:
        'Failed to create resource: ' + (insertError?.message ?? 'unknown'),
    };
  }

  // Upload file and create version if file provided
  if (file && file.size > 0) {
    const storagePath = `${projectId}/${resource.id}/v1_${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from('resources')
      .upload(storagePath, file, { contentType: file.type });

    if (uploadError) {
      // Clean up resource row on upload failure
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('resources') as any).delete().eq('id', resource.id);
      return { error: 'Failed to upload file: ' + uploadError.message };
    }

    // Insert version
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: version, error: versionError } = (await (
      supabase.from('resource_versions') as any
    )
      .insert({
        resource_id: resource.id,
        version_number: 1,
        storage_path: storagePath,
        file_name: file.name,
        file_size_bytes: file.size,
        mime_type: file.type || null,
        uploaded_by: user.id,
      })
      .select('id')
      .single()) as {
      data: { id: string } | null;
      error: { message: string } | null;
    };

    if (versionError || !version) {
      return {
        error:
          'Failed to create version: ' + (versionError?.message ?? 'unknown'),
      };
    }

    // Set current_version_id
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('resources') as any)
      .update({ current_version_id: version.id })
      .eq('id', resource.id);
  }

  revalidatePath(`/projects/${projectId}`);
  revalidatePath('/resources');
  return { error: null };
}

export async function updateResource(resourceId: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return redirect('/login');

  const title = (formData.get('title') as string)?.trim();
  const description = (formData.get('description') as string)?.trim() || null;
  const externalUrl = (formData.get('external_url') as string)?.trim() || null;
  const tagsRaw = (formData.get('tags') as string)?.trim() || '';

  if (!title) {
    return { error: 'Title is required' };
  }

  const tags = tagsRaw
    ? tagsRaw
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
    : [];

  // Get existing resource for revalidation
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = (await (supabase.from('resources') as any)
    .select('project_id, created_by')
    .eq('id', resourceId)
    .single()) as {
    data: { project_id: string; created_by: string } | null;
  };

  if (!existing) {
    return { error: 'Resource not found' };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('resources') as any)
    .update({ title, description, external_url: externalUrl, tags })
    .eq('id', resourceId);

  if (error) {
    return { error: 'Failed to update resource: ' + error.message };
  }

  revalidatePath(`/projects/${existing.project_id}`);
  revalidatePath('/resources');
  return { error: null };
}

export async function deleteResource(resourceId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return redirect('/login');

  // Get resource info for cleanup
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = (await (supabase.from('resources') as any)
    .select('project_id, created_by')
    .eq('id', resourceId)
    .single()) as {
    data: { project_id: string; created_by: string } | null;
  };

  if (!existing) {
    return { error: 'Resource not found' };
  }

  // Get all version storage paths to delete files
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: versions } = (await (supabase.from('resource_versions') as any)
    .select('storage_path')
    .eq('resource_id', resourceId)) as {
    data: { storage_path: string }[] | null;
  };

  // Delete files from storage
  if (versions && versions.length > 0) {
    const paths = versions.map((v) => v.storage_path);
    await supabase.storage.from('resources').remove(paths);
  }

  // Delete resource row (cascades to versions)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('resources') as any)
    .delete()
    .eq('id', resourceId);

  if (error) {
    return { error: 'Failed to delete resource: ' + error.message };
  }

  revalidatePath(`/projects/${existing.project_id}`);
  revalidatePath('/resources');
  return { error: null };
}

export async function uploadNewVersion(resourceId: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return redirect('/login');

  const file = formData.get('file') as File | null;
  const uploadNotes = (formData.get('upload_notes') as string)?.trim() || null;

  if (!file || file.size === 0) {
    return { error: 'File is required' };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { error: 'File exceeds 50 MB limit' };
  }

  // Get resource + verify membership
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: resource } = (await (supabase.from('resources') as any)
    .select('id, project_id')
    .eq('id', resourceId)
    .single()) as {
    data: { id: string; project_id: string } | null;
  };

  if (!resource) {
    return { error: 'Resource not found' };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: membership } = (await (supabase.from('memberships') as any)
    .select('id')
    .eq('project_id', resource.project_id)
    .eq('profile_id', user.id)
    .maybeSingle()) as { data: { id: string } | null };

  if (!membership) {
    return { error: 'Only project members can upload new versions' };
  }

  // Get next version number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: latestVersion } = (await (
    supabase.from('resource_versions') as any
  )
    .select('version_number')
    .eq('resource_id', resourceId)
    .order('version_number', { ascending: false })
    .limit(1)
    .single()) as { data: { version_number: number } | null };

  const nextVersion = (latestVersion?.version_number ?? 0) + 1;
  const storagePath = `${resource.project_id}/${resourceId}/v${nextVersion}_${file.name}`;

  // Upload file
  const { error: uploadError } = await supabase.storage
    .from('resources')
    .upload(storagePath, file, { contentType: file.type });

  if (uploadError) {
    return { error: 'Failed to upload file: ' + uploadError.message };
  }

  // Insert version
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: version, error: versionError } = (await (
    supabase.from('resource_versions') as any
  )
    .insert({
      resource_id: resourceId,
      version_number: nextVersion,
      storage_path: storagePath,
      file_name: file.name,
      file_size_bytes: file.size,
      mime_type: file.type || null,
      upload_notes: uploadNotes,
      uploaded_by: user.id,
    })
    .select('id')
    .single()) as {
    data: { id: string } | null;
    error: { message: string } | null;
  };

  if (versionError || !version) {
    return {
      error:
        'Failed to create version: ' + (versionError?.message ?? 'unknown'),
    };
  }

  // Update current_version_id
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from('resources') as any)
    .update({ current_version_id: version.id })
    .eq('id', resourceId);

  revalidatePath(`/projects/${resource.project_id}`);
  revalidatePath('/resources');
  return { error: null };
}

export async function getSignedUrl(
  storagePath: string,
): Promise<{ url: string | null; error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { url: null, error: 'Not authenticated' };

  const { data, error } = await supabase.storage
    .from('resources')
    .createSignedUrl(storagePath, 3600); // 1 hour

  if (error) {
    return {
      url: null,
      error: 'Failed to create download URL: ' + error.message,
    };
  }

  return { url: data.signedUrl, error: null };
}
