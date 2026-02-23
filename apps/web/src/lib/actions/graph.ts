'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { TablesInsert } from '@future-folklore-platform/db';
import { NODE_TYPES, EDGE_TYPES } from '@future-folklore-platform/shared';
import type { NodeType, EdgeType } from '@future-folklore-platform/shared';
import { searchEntities } from '@/lib/queries/graph';
import type { EntitySearchResult } from '@/lib/queries/graph';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const nodeTypeSet = new Set<string>(NODE_TYPES);
const edgeTypeSet = new Set<string>(EDGE_TYPES);

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

  // Verify ownership — only creator can update non-canonical concepts
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = (await (supabase.from('concepts') as any)
    .select('created_by, is_canonical')
    .eq('id', id)
    .single()) as {
    data: { created_by: string; is_canonical: boolean } | null;
  };

  if (!existing) {
    return { error: 'Concept not found' };
  }
  if (existing.is_canonical) {
    return { error: 'Canonical concepts cannot be edited' };
  }
  if (existing.created_by !== user.id) {
    return { error: 'You can only edit concepts you created' };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('concepts') as any)
    .update({ name, slug, description, parent_id: parentId })
    .eq('id', id);

  if (error) {
    return { error: 'Failed to update concept' };
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

  // Runtime validation — enum and UUID checks
  if (!nodeTypeSet.has(sourceType)) {
    return { error: 'Invalid source type' };
  }
  if (!nodeTypeSet.has(targetType)) {
    return { error: 'Invalid target type' };
  }
  if (!edgeTypeSet.has(edgeType)) {
    return { error: 'Invalid edge type' };
  }
  if (!UUID_RE.test(sourceId) || !UUID_RE.test(targetId)) {
    return { error: 'Invalid entity ID' };
  }

  const insert: TablesInsert<'graph_edges'> = {
    source_type: sourceType as NodeType,
    source_id: sourceId,
    target_type: targetType as NodeType,
    target_id: targetId,
    edge_type: edgeType as EdgeType,
    notes,
    created_by: user.id,
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('graph_edges') as any).insert(insert);

  if (error) {
    const msg =
      error.code === '23505'
        ? 'This connection already exists'
        : 'Failed to create connection';
    return { error: msg };
  }

  revalidatePath('/graph');
  revalidatePath('/graph/concepts');
  return { error: null };
}

export async function searchEntitiesAction(
  query: string,
  nodeTypes?: string[],
): Promise<EntitySearchResult[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];
  if (!query || query.trim().length < 2) return [];

  return searchEntities(query.trim(), nodeTypes);
}

export async function deleteEdge(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return redirect('/login');

  if (!UUID_RE.test(id)) {
    return { error: 'Invalid edge ID' };
  }

  // Verify ownership before deleting
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = (await (supabase.from('graph_edges') as any)
    .select('created_by')
    .eq('id', id)
    .single()) as { data: { created_by: string } | null };

  if (!existing) {
    return { error: 'Connection not found' };
  }
  if (existing.created_by !== user.id) {
    return { error: 'You can only delete connections you created' };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('graph_edges') as any)
    .delete()
    .eq('id', id);

  if (error) {
    return { error: 'Failed to delete connection' };
  }

  revalidatePath('/graph');
  revalidatePath('/graph/concepts');
  return { error: null };
}

export async function generateEdgesFromData(): Promise<{
  created: number;
  skipped: number;
  error: string | null;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { created: 0, skipped: 0, error: 'Not authenticated' };

  const edgesToInsert: TablesInsert<'graph_edges'>[] = [];

  // 1. Memberships -> works_on (profile->project) + member_of (profile->org)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: memberships } = (await (
    supabase.from('memberships') as any
  ).select('user_id, project_id, projects!inner(organization_id)')) as {
    data: any[] | null;
  };

  for (const m of memberships ?? []) {
    edgesToInsert.push({
      source_type: 'profile' as NodeType,
      source_id: m.user_id,
      target_type: 'project' as NodeType,
      target_id: m.project_id,
      edge_type: 'works_on' as EdgeType,
      created_by: user.id,
    });

    if (m.projects?.organization_id) {
      edgesToInsert.push({
        source_type: 'profile' as NodeType,
        source_id: m.user_id,
        target_type: 'organization' as NodeType,
        target_id: m.projects.organization_id,
        edge_type: 'member_of' as EdgeType,
        created_by: user.id,
      });
    }
  }

  // 2. Profiles expertise_tags -> expert_in (profile->concept, match by slug)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profiles } = (await (supabase.from('profiles') as any).select(
    'id, expertise_tags',
  )) as { data: any[] | null };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: concepts } = (await (supabase.from('concepts') as any).select(
    'id, slug, name',
  )) as { data: any[] | null };

  const conceptSlugMap = new Map<string, string>();
  for (const c of concepts ?? []) {
    conceptSlugMap.set(c.slug, c.id);
    conceptSlugMap.set(c.name.toLowerCase().replace(/\s+/g, '-'), c.id);
  }

  for (const profile of profiles ?? []) {
    const tags: string[] = profile.expertise_tags ?? [];
    for (const tag of tags) {
      const slug = tag.toLowerCase().replace(/\s+/g, '-');
      const conceptId = conceptSlugMap.get(slug);
      if (conceptId) {
        edgesToInsert.push({
          source_type: 'profile' as NodeType,
          source_id: profile.id,
          target_type: 'concept' as NodeType,
          target_id: conceptId,
          edge_type: 'expert_in' as EdgeType,
          created_by: user.id,
        });
      }
    }
  }

  // 3. Projects domain_tags -> explores (project->concept, match by slug)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: projectsData } = (await (
    supabase.from('projects') as any
  ).select('id, domain_tags')) as { data: any[] | null };

  for (const project of projectsData ?? []) {
    const tags: string[] = project.domain_tags ?? [];
    for (const tag of tags) {
      const slug = tag.toLowerCase().replace(/\s+/g, '-');
      const conceptId = conceptSlugMap.get(slug);
      if (conceptId) {
        edgesToInsert.push({
          source_type: 'project' as NodeType,
          source_id: project.id,
          target_type: 'concept' as NodeType,
          target_id: conceptId,
          edge_type: 'explores' as EdgeType,
          created_by: user.id,
        });
      }
    }
  }

  if (edgesToInsert.length === 0) {
    return { created: 0, skipped: 0, error: null };
  }

  // Bulk upsert — ignoreDuplicates for idempotent insert
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: inserted, error: upsertError } = (await (
    supabase.from('graph_edges') as any
  )
    .upsert(edgesToInsert, {
      onConflict: 'source_type,source_id,target_type,target_id,edge_type',
      ignoreDuplicates: true,
    })
    .select('id')) as { data: any[] | null; error: any };

  if (upsertError) {
    return {
      created: 0,
      skipped: 0,
      error: 'Failed to generate edges: ' + upsertError.message,
    };
  }

  const created = inserted?.length ?? 0;
  const skipped = edgesToInsert.length - created;

  revalidatePath('/graph');
  revalidatePath('/graph/concepts');
  return { created, skipped, error: null };
}
