import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';
import { Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { GraphNodeData } from '@/lib/queries/graph';

type OrgNodeProps = NodeProps<Node<GraphNodeData>>;

export function OrgNode({ data, selected }: OrgNodeProps) {
  return (
    <div
      className={cn(
        'w-48 rounded-lg border-2 bg-void-light px-3 py-2 shadow-md transition-all',
        selected
          ? 'border-ash-light shadow-ash/20'
          : 'border-ash/40 hover:border-ash-light',
      )}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!h-2.5 !w-2.5 !border-2 !border-void !bg-ash"
      />

      <div className="flex items-center gap-2">
        <Building2 className="h-3.5 w-3.5 shrink-0 text-ash-light" />
        <p className="truncate text-sm font-medium text-white">{data.label}</p>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!h-2.5 !w-2.5 !border-2 !border-void !bg-ash"
      />
    </div>
  );
}
