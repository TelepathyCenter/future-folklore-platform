import { Suspense } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { PageContainer } from '@/components/layout/page-container';
import { ConceptCard } from '@/components/graph/concept-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { listConcepts } from '@/lib/queries/graph';

interface ConceptsPageProps {
  searchParams: Promise<{ search?: string; page?: string }>;
}

export default async function ConceptsPage({
  searchParams,
}: ConceptsPageProps) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const search = params.search || '';

  const { concepts, total } = await listConcepts({
    search: search || undefined,
    page,
    limit: 24,
  });

  const totalPages = Math.ceil(total / 24);

  return (
    <PageContainer>
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Concepts</h1>
            <p className="text-sm text-ash">
              {total} topic{total !== 1 ? 's' : ''} in the knowledge graph
            </p>
          </div>
          <Link href="/graph/concepts/new">
            <Button size="sm">
              <Plus className="mr-1 h-4 w-4" />
              New Concept
            </Button>
          </Link>
        </div>

        <Suspense
          fallback={
            <div className="h-10 animate-pulse rounded bg-void-lighter" />
          }
        >
          <form className="flex gap-2">
            <Input
              name="search"
              placeholder="Search concepts..."
              defaultValue={search}
              className="max-w-sm"
            />
            <Button type="submit" variant="outline" size="default">
              Search
            </Button>
          </form>
        </Suspense>

        {concepts.length === 0 ? (
          <div className="py-12 text-center text-ash">
            <p className="text-lg">No concepts found</p>
            {search && (
              <p className="text-sm">
                Try a different search term or{' '}
                <Link
                  href="/graph/concepts/new"
                  className="text-electric hover:underline"
                >
                  create a new concept
                </Link>
              </p>
            )}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {concepts.map((concept) => (
              <ConceptCard key={concept.id} concept={concept} />
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            {page > 1 && (
              <Link
                href={`/graph/concepts?${new URLSearchParams({ ...params, page: String(page - 1) }).toString()}`}
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
                href={`/graph/concepts?${new URLSearchParams({ ...params, page: String(page + 1) }).toString()}`}
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
