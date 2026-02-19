import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  PROJECT_STATUS_LABELS,
  PROJECT_STATUS_BADGE_VARIANT,
} from '@future-folklore-platform/shared';
import type { ProjectWithOrg } from '@/lib/queries/projects';

export function ProjectCard({ project }: { project: ProjectWithOrg }) {
  return (
    <Link href={`/projects/${project.id}`}>
      <Card className="transition-colors hover:border-amber-muted">
        <CardContent className="flex flex-col gap-3 p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-white">{project.name}</p>
              <p className="text-xs text-ash">{project.organizations.name}</p>
            </div>
            <Badge
              variant={PROJECT_STATUS_BADGE_VARIANT[project.status]}
              className="shrink-0"
            >
              {PROJECT_STATUS_LABELS[project.status]}
            </Badge>
          </div>

          {project.description && (
            <p className="line-clamp-2 text-sm text-ash-light">
              {project.description}
            </p>
          )}

          <div className="flex items-center justify-between">
            <div className="flex flex-wrap gap-1">
              {project.domain_tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
            <p className="shrink-0 text-xs text-ash">
              {project.member_count} member
              {project.member_count !== 1 ? 's' : ''}
            </p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
