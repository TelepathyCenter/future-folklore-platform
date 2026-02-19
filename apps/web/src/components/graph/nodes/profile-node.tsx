import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';
import { User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { GraphNodeData } from '@/lib/queries/graph';

type ProfileNodeProps = NodeProps<Node<GraphNodeData>>;

export function ProfileNode({ data, selected }: ProfileNodeProps) {
  const role = data.meta?.role as string | undefined;
  const avatarUrl = data.meta?.avatar_url as string | undefined;

  return (
    <div
      className={cn(
        'w-48 rounded-lg border-2 bg-void-light px-3 py-2 shadow-md transition-all',
        selected
          ? 'border-amber shadow-amber/20'
          : 'border-amber/40 hover:border-amber',
      )}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!h-2.5 !w-2.5 !border-2 !border-void !bg-amber-light"
      />

      <div className="flex items-center gap-2">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt=""
            className="h-7 w-7 shrink-0 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-muted">
            <User className="h-3.5 w-3.5 text-amber" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-white">
            {data.label}
          </p>
          {role && (
            <Badge variant="outline" className="mt-0.5 text-[10px]">
              {role}
            </Badge>
          )}
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!h-2.5 !w-2.5 !border-2 !border-void !bg-amber-light"
      />
    </div>
  );
}
