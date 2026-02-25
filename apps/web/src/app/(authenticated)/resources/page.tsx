import { Suspense } from 'react';
import Link from 'next/link';
import { PageContainer } from '@/components/layout/page-container';
import { ResourceFilters } from '@/components/resources/resource-filters';
import { Button } from '@/components/ui/button';
import { listResources } from '@/lib/queries/resources';
import { ResourceListClient } from './resource-list-client';

interface ResourcesPageProps {
  searchParams: Promise<{
    search?: string;
    type?: string;
    tag?: string;
    page?: string;
  }>;
}

export default async function ResourcesPage({
  searchParams,
}: ResourcesPageProps) {
  const params = await searchParams;
  const page = Number(params.page) || 1;

  const { resources, total } = await listResources({
    search: params.search,
    type: params.type,
    tag: params.tag,
    page,
    limit: 12,
  });

  const totalPages = Math.ceil(total / 12);

  return (
    <PageContainer>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Resources</h1>
          <p className="text-sm text-ash">
            {total} resource{total !== 1 ? 's' : ''} shared across projects
          </p>
        </div>

        <Suspense
          fallback={
            <div className="h-28 animate-pulse rounded bg-void-lighter" />
          }
        >
          <ResourceFilters />
        </Suspense>

        {resources.length === 0 ? (
          <div className="py-12 text-center text-ash">
            <p className="text-lg">No resources found</p>
            <p className="text-sm">Try adjusting your search or filters</p>
          </div>
        ) : (
          <ResourceListClient resources={resources} />
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            {page > 1 && (
              <Link
                href={`/resources?${new URLSearchParams({ ...params, page: String(page - 1) }).toString()}`}
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
                href={`/resources?${new URLSearchParams({ ...params, page: String(page + 1) }).toString()}`}
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
