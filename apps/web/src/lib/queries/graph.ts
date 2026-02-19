import { createClient } from '@/lib/supabase/server';
import type { Tables } from '@future-folklore-platform/db';

export type Concept = Tables<'concepts'>;
export type GraphEdge = Tables<'graph_edges'>;

export interface ConceptWithMeta extends Concept {
  child_count: number;
  edge_count: number;
}

export interface ConceptDetail extends Concept {
  children: Concept[];
  parent: Pick<Concept, 'id' | 'name' | 'slug'> | null;
  edges: Array<
    GraphEdge & {
      resolved_name: string;
      resolved_slug?: string;
    }
  >;
}

export interface ConceptListParams {
  search?: string;
  parentId?: string | null;
  canonicalOnly?: boolean;
  page?: number;
  limit?: number;
}

export async function listConcepts(
  params: ConceptListParams = {},
): Promise<{ concepts: ConceptWithMeta[]; total: number }> {
  const { search, parentId, canonicalOnly, page = 1, limit = 24 } = params;
  const supabase = await createClient();
  const offset = (page - 1) * limit;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase.from('concepts') as any)
    .select('*', { count: 'exact' })
    .order('is_canonical', { ascending: false })
    .order('name', { ascending: true })
    .range(offset, offset + limit - 1);

  if (search) {
    query = query.ilike('name', `%${search}%`);
  }

  if (parentId) {
    query = query.eq('parent_id', parentId);
  } else if (parentId === null) {
    query = query.is('parent_id', null);
  }

  if (canonicalOnly) {
    query = query.eq('is_canonical', true);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, count, error } = (await query) as {
    data: Concept[] | null;
    count: number | null;
    error: any;
  };

  if (error) return { concepts: [], total: 0 };

  const conceptIds = (data ?? []).map((c) => c.id);

  // Count children and edges for each concept
  const childCounts: Record<string, number> = {};
  const edgeCounts: Record<string, number> = {};

  if (conceptIds.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: children } = (await (supabase.from('concepts') as any)
      .select('parent_id')
      .in('parent_id', conceptIds)) as { data: any[] | null };

    for (const child of children ?? []) {
      childCounts[child.parent_id] = (childCounts[child.parent_id] ?? 0) + 1;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: edges } = (await (supabase.from('graph_edges') as any)
      .select('source_id, target_id')
      .or(
        `and(source_type.eq.concept,source_id.in.(${conceptIds.join(',')})),and(target_type.eq.concept,target_id.in.(${conceptIds.join(',')}))`,
      )) as { data: any[] | null };

    for (const edge of edges ?? []) {
      if (conceptIds.includes(edge.source_id)) {
        edgeCounts[edge.source_id] = (edgeCounts[edge.source_id] ?? 0) + 1;
      }
      if (conceptIds.includes(edge.target_id)) {
        edgeCounts[edge.target_id] = (edgeCounts[edge.target_id] ?? 0) + 1;
      }
    }
  }

  const concepts: ConceptWithMeta[] = (data ?? []).map((concept) => ({
    ...concept,
    child_count: childCounts[concept.id] ?? 0,
    edge_count: edgeCounts[concept.id] ?? 0,
  }));

  return { concepts, total: count ?? 0 };
}

export async function getConcept(slug: string): Promise<ConceptDetail | null> {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: concept, error } = (await (supabase.from('concepts') as any)
    .select(
      `
      *,
      parent:concepts!concepts_parent_id_fkey ( id, name, slug )
      `,
    )
    .eq('slug', slug)
    .single()) as { data: any; error: any };

  if (error || !concept) return null;

  // Fetch children
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: children } = (await (supabase.from('concepts') as any)
    .select('*')
    .eq('parent_id', concept.id)
    .order('name')) as { data: Concept[] | null };

  // Fetch edges touching this concept
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: edgesRaw } = (await (supabase.from('graph_edges') as any)
    .select('*')
    .or(
      `and(source_type.eq.concept,source_id.eq.${concept.id}),and(target_type.eq.concept,target_id.eq.${concept.id})`,
    )) as { data: GraphEdge[] | null };

  // Resolve names for connected entities
  const edges = await resolveEdgeNames(supabase, edgesRaw ?? [], concept.id);

  return {
    ...concept,
    children: children ?? [],
    edges,
  } as ConceptDetail;
}

async function resolveEdgeNames(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  edges: GraphEdge[],
  selfId: string,
): Promise<ConceptDetail['edges']> {
  // Collect IDs by type for the "other" side of each edge
  const idsByType: Record<string, Set<string>> = {};
  for (const edge of edges) {
    const otherId = edge.source_id === selfId ? edge.target_id : edge.source_id;
    const otherType =
      edge.source_id === selfId ? edge.target_type : edge.source_type;
    if (!idsByType[otherType]) idsByType[otherType] = new Set();
    idsByType[otherType].add(otherId);
  }

  const nameMap: Record<string, { name: string; slug?: string }> = {};

  const lookups = Object.entries(idsByType).map(async ([type, ids]) => {
    const idArr = Array.from(ids);
    const table =
      type === 'profile'
        ? 'profiles'
        : type === 'project'
          ? 'projects'
          : type === 'organization'
            ? 'organizations'
            : type === 'concept'
              ? 'concepts'
              : 'calls';
    const nameField =
      type === 'profile'
        ? 'display_name, username'
        : type === 'call'
          ? 'title'
          : 'name';
    const slugField = type === 'call' || type === 'profile' ? '' : ', slug';

    const { data } = (await supabase
      .from(table)
      .select(`id, ${nameField}${slugField}`)
      .in('id', idArr)) as { data: any[] | null };

    for (const item of data ?? []) {
      const resolvedName =
        type === 'profile'
          ? item.display_name || `@${item.username}`
          : type === 'call'
            ? item.title
            : item.name;
      nameMap[item.id] = {
        name: resolvedName,
        slug: type === 'profile' ? item.username : item.slug,
      };
    }
  });

  await Promise.all(lookups);

  return edges.map((edge) => {
    const otherId = edge.source_id === selfId ? edge.target_id : edge.source_id;
    const resolved = nameMap[otherId] ?? { name: 'Unknown' };
    return {
      ...edge,
      resolved_name: resolved.name,
      resolved_slug: resolved.slug,
    };
  });
}
