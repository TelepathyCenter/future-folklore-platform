import Link from 'next/link';
import { Network, Tag, ArrowRight } from 'lucide-react';
import { PageContainer } from '@/components/layout/page-container';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { listConcepts } from '@/lib/queries/graph';

export default async function GraphPage() {
  const { concepts, total } = await listConcepts({
    canonicalOnly: true,
    limit: 10,
  });

  return (
    <PageContainer>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Knowledge Graph</h1>
          <p className="text-sm text-ash">
            Explore connections between researchers, projects, and ideas
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-amber-muted">
            <CardContent className="flex flex-col gap-4 p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-muted">
                  <Network className="h-5 w-5 text-amber" />
                </div>
                <div>
                  <h2 className="font-semibold text-white">Graph Explorer</h2>
                  <p className="text-xs text-ash">Coming soon</p>
                </div>
              </div>
              <p className="text-sm text-ash-light">
                Interactive visualization of how researchers, projects, and
                concepts connect across the platform.
              </p>
            </CardContent>
          </Card>

          <Link href="/graph/concepts">
            <Card className="transition-colors hover:border-amber-muted">
              <CardContent className="flex flex-col gap-4 p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-electric-muted">
                    <Tag className="h-5 w-5 text-electric" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-white">Concepts</h2>
                    <p className="text-xs text-ash">
                      {total} topic{total !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-ash-light">
                  Browse and manage research topics, domains, and their
                  relationships.
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {concepts.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">
                Core Concepts
              </h2>
              <Link href="/graph/concepts">
                <Button variant="ghost" size="sm">
                  View all
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </div>
            <div className="flex flex-wrap gap-2">
              {concepts.map((concept) => (
                <Link
                  key={concept.id}
                  href={`/graph/concepts/${concept.slug}`}
                  className="rounded-full border border-void-border bg-void-lighter px-3 py-1.5 text-sm text-ash-light transition-colors hover:border-amber-muted hover:text-amber"
                >
                  {concept.name}
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </PageContainer>
  );
}
