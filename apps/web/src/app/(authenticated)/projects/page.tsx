import { Suspense } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { PageContainer } from '@/components/layout/page-container';
import { ProjectCard } from '@/components/project/project-card';
import { ProjectFilters } from '@/components/project/project-filters';
import { Button } from '@/components/ui/button';
import { listProjects } from '@/lib/queries/projects';

interface ProjectsPageProps {
  searchParams: Promise<{
    search?: string;
    status?: string;
    tag?: string;
    page?: string;
  }>;
}

export default async function ProjectsPage({
  searchParams,
}: ProjectsPageProps) {
  const params = await searchParams;
  const page = Number(params.page) || 1;

  const { projects, total } = await listProjects({
    search: params.search,
    status: params.status,
    tag: params.tag,
    page,
    limit: 12,
  });

  const totalPages = Math.ceil(total / 12);

  return (
    <PageContainer>
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Projects</h1>
            <p className="text-sm text-ash">
              {total} project{total !== 1 ? 's' : ''} in the incubator
            </p>
          </div>
          <Link href="/projects/new">
            <Button size="sm">
              <Plus className="mr-1 h-4 w-4" />
              New project
            </Button>
          </Link>
        </div>

        <Suspense
          fallback={
            <div className="h-28 animate-pulse rounded bg-void-lighter" />
          }
        >
          <ProjectFilters />
        </Suspense>

        {projects.length === 0 ? (
          <div className="py-12 text-center text-ash">
            <p className="text-lg">No projects found</p>
            <p className="text-sm">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            {page > 1 && (
              <Link
                href={`/projects?${new URLSearchParams({ ...params, page: String(page - 1) }).toString()}`}
              >
                <Button variant="outline" size="sm">
                  Previous
                </Button>
              </Link>
            )}
            <span className="text-sm text-ash">
              Page {page} of {totalPages}
            </span>
            {page < totalPages && (
              <Link
                href={`/projects?${new URLSearchParams({ ...params, page: String(page + 1) }).toString()}`}
              >
                <Button variant="outline" size="sm">
                  Next
                </Button>
              </Link>
            )}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
