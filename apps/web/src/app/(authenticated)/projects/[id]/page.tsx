import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ExternalLink, Plus } from 'lucide-react';
import { PageContainer } from '@/components/layout/page-container';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { createClient } from '@/lib/supabase/server';
import { getProject } from '@/lib/queries/projects';
import { listProjectMilestones } from '@/lib/queries/milestones';
import { listUpdates } from '@/lib/queries/updates';
import { listProjectResources } from '@/lib/queries/resources';
import { EdgeCreatorModal } from '@/components/graph/edge-creator-modal';
import { MilestonePanel } from '@/components/project/milestone-panel';
import { UpdatePanel } from '@/components/updates/update-panel';
import { ResourcePanel } from '@/components/resources/resource-panel';
import {
  PROJECT_STATUS_LABELS,
  PROJECT_STATUS_BADGE_VARIANT,
  MEMBERSHIP_ROLE_LABELS,
} from '@future-folklore-platform/shared';
import type { MembershipRole } from '@future-folklore-platform/shared';

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [project, milestones, { updates }, resources, supabase] =
    await Promise.all([
      getProject(id),
      listProjectMilestones(id),
      listUpdates({ projectId: id }),
      listProjectResources(id),
      createClient(),
    ]);

  if (!project) {
    return notFound();
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isMember = project.memberships.some(
    (m) => m.profile_id === user?.id,
  );

  const org = project.organizations;

  const projectPreset = {
    id: project.id,
    nodeType: 'project' as const,
    label: project.name,
  };

  return (
    <PageContainer>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">{project.name}</h1>
            <p className="text-sm text-ash">{org.name}</p>
          </div>
          <div className="flex items-center gap-2">
            <EdgeCreatorModal
              trigger={
                <Button variant="outline" size="sm">
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Add Connection
                </Button>
              }
              presetSource={projectPreset}
            />
            <Badge variant={PROJECT_STATUS_BADGE_VARIANT[project.status]}>
              {PROJECT_STATUS_LABELS[project.status]}
            </Badge>
          </div>
        </div>

        <Separator />

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {project.description && (
              <div>
                <p className="text-xs font-medium uppercase text-ash">About</p>
                <p className="mt-2 text-sm text-ash-light">
                  {project.description}
                </p>
              </div>
            )}

            {project.domain_tags.length > 0 && (
              <div>
                <p className="text-xs font-medium uppercase text-ash">
                  Domains
                </p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {project.domain_tags.map((tag) => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {project.memberships.length > 0 && (
              <div>
                <p className="text-xs font-medium uppercase text-ash">
                  Team ({project.memberships.length})
                </p>
                <div className="mt-2 space-y-3">
                  {project.memberships.map((membership) => {
                    const profile = membership.profiles;
                    const initials = profile.display_name
                      ? profile.display_name
                          .split(' ')
                          .map((n: string) => n[0])
                          .join('')
                          .toUpperCase()
                          .slice(0, 2)
                      : profile.username.slice(0, 2).toUpperCase();

                    return (
                      <Link
                        key={membership.id}
                        href={`/profile/${profile.username}`}
                        className="flex items-center gap-3 rounded-md p-2 transition-colors hover:bg-void-lighter"
                      >
                        <Avatar className="h-9 w-9">
                          {profile.avatar_url && (
                            <AvatarImage
                              src={profile.avatar_url}
                              alt={profile.display_name ?? profile.username}
                            />
                          )}
                          <AvatarFallback>{initials}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-white">
                            {profile.display_name ?? profile.username}
                          </p>
                          <p className="text-xs text-ash">
                            @{profile.username}
                          </p>
                        </div>
                        <Badge variant="secondary" className="shrink-0">
                          {MEMBERSHIP_ROLE_LABELS[membership.role as MembershipRole]}
                        </Badge>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            <UpdatePanel
              projectId={project.id}
              updates={updates}
              isMember={isMember}
            />

            <ResourcePanel
              projectId={project.id}
              resources={resources}
              isMember={isMember}
            />

            <Separator />

            <MilestonePanel
              projectId={project.id}
              milestones={milestones}
              isMember={isMember}
            />
          </div>

          <div className="space-y-6">
            <div>
              <p className="text-xs font-medium uppercase text-ash">
                Organization
              </p>
              <div className="mt-2 rounded-md border border-void-border bg-void-light p-4">
                <p className="font-medium text-white">{org.name}</p>
                {org.description && (
                  <p className="mt-1 text-sm text-ash">{org.description}</p>
                )}
                {org.website_url && (
                  <a
                    href={org.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 flex items-center gap-1 text-xs text-electric hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Website
                  </a>
                )}
              </div>
            </div>

            <div>
              <p className="text-xs font-medium uppercase text-ash">
                Visibility
              </p>
              <Badge variant="electric" className="mt-2 capitalize">
                {project.visibility}
              </Badge>
            </div>

            {project.links &&
              typeof project.links === 'object' &&
              !Array.isArray(project.links) &&
              Object.keys(project.links as Record<string, string>).length > 0 && (
                <div>
                  <p className="text-xs font-medium uppercase text-ash">
                    Links
                  </p>
                  <div className="mt-2 space-y-1">
                    {Object.entries(
                      project.links as Record<string, string>,
                    ).map(([label, url]) => (
                      <a
                        key={label}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-sm text-electric hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" />
                        {label}
                      </a>
                    ))}
                  </div>
                </div>
              )}
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
