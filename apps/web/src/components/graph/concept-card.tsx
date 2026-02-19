import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import type { ConceptWithMeta } from '@/lib/queries/graph';

interface ConceptCardProps {
  concept: ConceptWithMeta;
}

export function ConceptCard({ concept }: ConceptCardProps) {
  return (
    <Link href={`/graph/concepts/${concept.slug}`}>
      <Card className="transition-colors hover:border-amber-muted">
        <CardContent className="flex flex-col gap-2 p-4">
          <div className="flex items-start justify-between gap-2">
            <p className="font-medium text-white">{concept.name}</p>
            <div className="flex shrink-0 items-center gap-1">
              {concept.is_canonical && (
                <Badge variant="default" className="text-xs">
                  Core
                </Badge>
              )}
            </div>
          </div>

          {concept.description && (
            <p className="line-clamp-2 text-sm text-ash-light">
              {concept.description}
            </p>
          )}

          <div className="flex items-center gap-3 text-xs text-ash">
            {concept.child_count > 0 && (
              <span>
                {concept.child_count} subtopic
                {concept.child_count !== 1 ? 's' : ''}
              </span>
            )}
            {concept.edge_count > 0 && (
              <span>
                {concept.edge_count} connection
                {concept.edge_count !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
