import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';
import { FolderOpen } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { GraphNodeData } from '@/lib/queries/graph';
import {
  PROJECT_STATUS_LABELS,
  PROJECT_STATUS_BADGE_VARIANT,
} from '@future-folklore-platform/shared';
import type { ProjectStatus } from '@future-folklore-platform/shared';

type ProjectNodeProps = NodeProps<Node<GraphNodeData>>;

export function ProjectNode({ data, selected }: ProjectNodeProps) {
  const status = data.meta?.status as ProjectStatus | undefined;

  return (
    <div
      className={cn(
        'w-52 rounded-lg border-2 bg-void-light px-3 py-2 shadow-md transition-all',
        selected
          ? 'border-electric shadow-electric/20'
          : 'border-electric/40 hover:border-electric',
      )}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!h-2.5 !w-2.5 !border-2 !border-void !bg-electric"
      />

      <div className="flex items-start gap-2">
        <FolderOpen className="mt-0.5 h-3.5 w-3.5 shrink-0 text-electric" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-white">
            {data.label}
          </p>
          {status && (
            <Badge
              variant={PROJECT_STATUS_BADGE_VARIANT[status]}
              className="mt-1 text-[10px]"
            >
              {PROJECT_STATUS_LABELS[status]}
            </Badge>
          )}
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!h-2.5 !w-2.5 !border-2 !border-void !bg-electric"
      />
    </div>
  );
}
