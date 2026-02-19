import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';
import { Tag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { GraphNodeData } from '@/lib/queries/graph';

type ConceptNodeProps = NodeProps<Node<GraphNodeData>>;

export function ConceptNode({ data, selected }: ConceptNodeProps) {
  const isCanonical = data.meta?.is_canonical === true;

  return (
    <div
      className={cn(
        'w-48 rounded-lg border-2 bg-void-light px-3 py-2 shadow-md transition-all',
        selected
          ? 'border-amber shadow-amber/20'
          : 'border-amber-muted hover:border-amber',
      )}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!h-2.5 !w-2.5 !border-2 !border-void !bg-amber"
      />

      <div className="flex items-start gap-2">
        <Tag className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-white">
            {data.label}
          </p>
          {isCanonical && (
            <Badge variant="default" className="mt-1 text-[10px]">
              Core
            </Badge>
          )}
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!h-2.5 !w-2.5 !border-2 !border-void !bg-amber"
      />
    </div>
  );
}
