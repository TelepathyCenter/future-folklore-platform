import { Suspense } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { PageContainer } from '@/components/layout/page-container';
import { CallCard } from '@/components/calls/call-card';
import { CallFilters } from '@/components/calls/call-filters';
import { Button } from '@/components/ui/button';
import { listCalls } from '@/lib/queries/calls';

interface CallsPageProps {
  searchParams: Promise<{ scope?: string; page?: string }>;
}

export default async function CallsPage({ searchParams }: CallsPageProps) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const scope = (params.scope as 'community' | 'project' | 'all') ?? 'all';

  const [upcomingResult, pastResult] = await Promise.all([
    listCalls({ scope, timeframe: 'upcoming', page, limit: 12 }),
    listCalls({ scope, timeframe: 'past', page: 1, limit: 6 }),
  ]);

  const totalPages = Math.ceil(upcomingResult.total / 12);

  return (
    <PageContainer>
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Calls & Events</h1>
            <p className="text-sm text-ash">
              {upcomingResult.total} upcoming call
              {upcomingResult.total !== 1 ? 's' : ''}
            </p>
          </div>
          <Link href="/calls/new">
            <Button size="sm">
              <Plus className="mr-1 h-4 w-4" />
              Schedule a call
            </Button>
          </Link>
        </div>

        <Suspense
          fallback={
            <div className="h-10 animate-pulse rounded bg-void-lighter" />
          }
        >
          <CallFilters />
        </Suspense>

        {upcomingResult.calls.length === 0 ? (
          <div className="py-12 text-center text-ash">
            <p className="text-lg">No upcoming calls</p>
            <p className="text-sm">Schedule one for the community</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {upcomingResult.calls.map((call) => (
              <CallCard key={call.id} call={call} />
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            {page > 1 && (
              <Link
                href={`/calls?${new URLSearchParams({ ...params, page: String(page - 1) }).toString()}`}
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
                href={`/calls?${new URLSearchParams({ ...params, page: String(page + 1) }).toString()}`}
              >
                <Button variant="outline" size="sm">
                  Next
                </Button>
              </Link>
            )}
          </div>
        )}

        {pastResult.calls.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-ash">Past Calls</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {pastResult.calls.map((call) => (
                <CallCard key={call.id} call={call} past />
              ))}
            </div>
          </section>
        )}
      </div>
    </PageContainer>
  );
}
