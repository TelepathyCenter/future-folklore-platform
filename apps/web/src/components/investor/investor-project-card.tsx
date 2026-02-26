import Link from 'next/link';
import { Users, CheckSquare } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  PROJECT_STATUS_LABELS,
  PROJECT_STATUS_BADGE_VARIANT,
  FUNDING_STAGE_LABELS,
  FUNDING_STAGE_BADGE_VARIANT,
  type FundingStage,
  type ProjectStatus,
} from '@future-folklore-platform/shared';
import type { ProjectForInvestor } from '@/lib/queries/projects';

function formatAmount(amount: number): string {
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${Math.round(amount / 1_000)}K`;
  return `$${amount.toLocaleString()}`;
}

interface InvestorProjectCardProps {
  project: ProjectForInvestor;
}

export function InvestorProjectCard({ project }: InvestorProjectCardProps) {
  const org = project.organizations as { name: string };
  const stage = project.funding_stage as FundingStage | null;

  return (
    <Link href={`/projects/${project.id}`}>
      <Card className="h-full transition-colors hover:border-amber/50 hover:bg-void-lighter">
        <CardContent className="flex h-full flex-col gap-3 p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-white">{project.name}</p>
              <p className="text-xs text-ash">{org.name}</p>
            </div>
            <Badge
              variant={
                PROJECT_STATUS_BADGE_VARIANT[project.status as ProjectStatus]
              }
              className="shrink-0"
            >
              {PROJECT_STATUS_LABELS[project.status as ProjectStatus]}
            </Badge>
          </div>

          {project.description && (
            <p className="line-clamp-2 text-sm text-ash-light">
              {project.description}
            </p>
          )}

          {stage && (
            <div className="flex items-center gap-2">
              <Badge variant={FUNDING_STAGE_BADGE_VARIANT[stage]}>
                {FUNDING_STAGE_LABELS[stage]}
              </Badge>
              {project.funding_sought && (
                <span className="text-sm font-medium text-amber">
                  Seeking {formatAmount(project.funding_sought as number)}
                </span>
              )}
            </div>
          )}

          {project.domain_tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {project.domain_tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {project.domain_tags.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{project.domain_tags.length - 3}
                </Badge>
              )}
            </div>
          )}

          <div className="mt-auto flex items-center gap-4 text-xs text-ash">
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {project.member_count} member
              {project.member_count !== 1 ? 's' : ''}
            </span>
            {project.milestone_count > 0 && (
              <span className="flex items-center gap-1">
                <CheckSquare className="h-3 w-3" />
                {project.milestone_count} milestone
                {project.milestone_count !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
