import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Tag, Network } from 'lucide-react';
import { PageContainer } from '@/components/layout/page-container';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getConcept } from '@/lib/queries/graph';
import {
  EDGE_TYPE_LABELS,
  EDGE_TYPE_BADGE_VARIANT,
  NODE_TYPE_LABELS,
} from '@future-folklore-platform/shared';
import type { NodeType, EdgeType } from '@future-folklore-platform/shared';

interface ConceptDetailPageProps {
  params: Promise<{ slug: string }>;
}

export default async function ConceptDetailPage({
  params,
}: ConceptDetailPageProps) {
  const { slug } = await params;
  const concept = await getConcept(slug);

  if (!concept) return notFound();

  const entityLink = (type: string, slug?: string, id?: string) => {
    if (type === 'concept' && slug) return `/graph/concepts/${slug}`;
    if (type === 'project' && id) return `/projects/${id}`;
    if (type === 'profile' && slug) return `/profile/${slug}`;
    if (type === 'call' && id) return `/calls/${id}`;
    return null;
  };

  return (
    <PageContainer>
      <div className="space-y-6">
        <Link
          href="/graph/concepts"
          className="inline-flex items-center text-sm text-ash hover:text-white"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Concepts
        </Link>

        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">{concept.name}</h1>
            {concept.is_canonical && <Badge variant="default">Core</Badge>}
          </div>

          {concept.parent && (
            <p className="text-sm text-ash">
              Subtopic of{' '}
              <Link
                href={`/graph/concepts/${concept.parent.slug}`}
                className="text-electric hover:underline"
              >
                {concept.parent.name}
              </Link>
            </p>
          )}

          {concept.description && (
            <p className="text-ash-light">{concept.description}</p>
          )}
        </div>

        {concept.children.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base text-white">
                <Tag className="h-4 w-4 text-amber" />
                Subtopics ({concept.children.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {concept.children.map((child) => (
                  <Link
                    key={child.id}
                    href={`/graph/concepts/${child.slug}`}
                    className="rounded-full border border-void-border bg-void-lighter px-3 py-1.5 text-sm text-ash-light transition-colors hover:border-amber-muted hover:text-amber"
                  >
                    {child.name}
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {concept.edges.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base text-white">
                <Network className="h-4 w-4 text-electric" />
                Connections ({concept.edges.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-void-border">
                {concept.edges.map((edge) => {
                  const isSource = edge.source_id === concept.id;
                  const otherType = isSource
                    ? edge.target_type
                    : edge.source_type;
                  const otherId = isSource
                    ? edge.target_id
                    : edge.source_id;
                  const link = entityLink(
                    otherType,
                    edge.resolved_slug,
                    otherId,
                  );

                  return (
                    <div
                      key={edge.id}
                      className="flex items-center justify-between gap-2 py-3"
                    >
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            EDGE_TYPE_BADGE_VARIANT[
                              edge.edge_type as EdgeType
                            ]
                          }
                          className="text-xs"
                        >
                          {EDGE_TYPE_LABELS[edge.edge_type as EdgeType]}
                        </Badge>
                        {link ? (
                          <Link
                            href={link}
                            className="text-sm text-ash-light hover:text-electric hover:underline"
                          >
                            {edge.resolved_name}
                          </Link>
                        ) : (
                          <span className="text-sm text-ash-light">
                            {edge.resolved_name}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-ash">
                        {NODE_TYPE_LABELS[otherType as NodeType]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {concept.edges.length === 0 && concept.children.length === 0 && (
          <div className="py-12 text-center text-ash">
            <p className="text-lg">No connections yet</p>
            <p className="text-sm">
              This concept will appear in the graph once it has connections to
              other entities.
            </p>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
