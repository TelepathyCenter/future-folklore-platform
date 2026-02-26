import { Suspense } from 'react';
import Link from 'next/link';
import { PageContainer } from '@/components/layout/page-container';
import { InvestorFilters } from '@/components/investor/investor-filters';
import { InvestorProjectCard } from '@/components/investor/investor-project-card';
import { Button } from '@/components/ui/button';
import { listProjectsForInvestors } from '@/lib/queries/projects';

interface InvestorPageProps {
  searchParams: Promise<{
    search?: string;
    stage?: string;
    tag?: string;
    page?: string;
  }>;
}

export default async function InvestorPage({
  searchParams,
}: InvestorPageProps) {
  const params = await searchParams;
  const page = Number(params.page) || 1;

  const { projects, total } = await listProjectsForInvestors({
    search: params.search,
    stage: params.stage,
    tag: params.tag,
    page,
    limit: 12,
  });

  const totalPages = Math.ceil(total / 12);

  return (
    <PageContainer>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Investor View</h1>
          <p className="text-sm text-ash">
            {total} project{total !== 1 ? 's' : ''} across the Future Folklore
            incubator
          </p>
        </div>

        <Suspense
          fallback={
            <div className="h-28 animate-pulse rounded bg-void-lighter" />
          }
        >
          <InvestorFilters />
        </Suspense>

        {projects.length === 0 ? (
          <div className="py-12 text-center text-ash">
            <p className="text-lg">No projects found</p>
            <p className="text-sm">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <InvestorProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            {page > 1 && (
              <Link
                href={`/investor?${new URLSearchParams({ ...params, page: String(page - 1) }).toString()}`}
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
                href={`/investor?${new URLSearchParams({ ...params, page: String(page + 1) }).toString()}`}
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
