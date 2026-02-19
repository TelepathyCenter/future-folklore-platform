import { Suspense } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { PageContainer } from '@/components/layout/page-container';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ConceptForm } from '@/components/graph/concept-form';
import { listConcepts } from '@/lib/queries/graph';

export default async function NewConceptPage() {
  const { concepts } = await listConcepts({ limit: 100 });

  const parentOptions = concepts.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
  }));

  return (
    <PageContainer>
      <div className="mx-auto max-w-lg space-y-6">
        <Link
          href="/graph/concepts"
          className="inline-flex items-center text-sm text-ash hover:text-white"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Concepts
        </Link>

        <Card>
          <CardHeader>
            <CardTitle className="text-white">New Concept</CardTitle>
          </CardHeader>
          <CardContent>
            <Suspense
              fallback={
                <div className="h-64 animate-pulse rounded bg-void-lighter" />
              }
            >
              <ConceptForm parentConcepts={parentOptions} />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
