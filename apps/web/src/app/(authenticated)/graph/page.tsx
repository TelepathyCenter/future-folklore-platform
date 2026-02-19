import Link from 'next/link';
import { Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { KnowledgeGraph } from '@/components/graph/knowledge-graph';
import { getGraphData } from '@/lib/queries/graph';

export default async function GraphPage() {
  const data = await getGraphData();

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col">
      <div className="flex items-center justify-between border-b border-void-border px-6 py-3">
        <div>
          <h1 className="text-lg font-bold text-white">Knowledge Graph</h1>
          <p className="text-xs text-ash">
            Explore connections between researchers, projects, and ideas
          </p>
        </div>
        <Link href="/graph/concepts">
          <Button variant="outline" size="sm">
            <Tag className="mr-1.5 h-3.5 w-3.5" />
            Concepts
          </Button>
        </Link>
      </div>

      <div className="flex-1">
        <KnowledgeGraph data={data} />
      </div>
    </div>
  );
}
