import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';
import { Phone } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { GraphNodeData } from '@/lib/queries/graph';
import {
  CALL_STATUS_LABELS,
  CALL_STATUS_BADGE_VARIANT,
} from '@future-folklore-platform/shared';
import type { CallStatus } from '@future-folklore-platform/shared';

type CallNodeProps = NodeProps<Node<GraphNodeData>>;

export function CallNode({ data, selected }: CallNodeProps) {
  const status = data.meta?.status as CallStatus | undefined;

  return (
    <div
      className={cn(
        'w-48 rounded-lg border-2 bg-void-light px-3 py-2 shadow-md transition-all',
        selected
          ? 'border-electric shadow-electric/20'
          : 'border-electric-muted hover:border-electric',
      )}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!h-2.5 !w-2.5 !border-2 !border-void !bg-electric-light"
      />

      <div className="flex items-start gap-2">
        <Phone className="mt-0.5 h-3.5 w-3.5 shrink-0 text-electric" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-white">
            {data.label}
          </p>
          {status && (
            <Badge
              variant={CALL_STATUS_BADGE_VARIANT[status]}
              className="mt-1 text-[10px]"
            >
              {CALL_STATUS_LABELS[status]}
            </Badge>
          )}
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!h-2.5 !w-2.5 !border-2 !border-void !bg-electric-light"
      />
    </div>
  );
}
