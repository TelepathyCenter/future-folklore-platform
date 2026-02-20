'use client';

import { Maximize, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NODE_TYPE_LABELS } from '@future-folklore-platform/shared';
import { cn } from '@/lib/utils';

const NODE_TYPE_ICON_COLORS: Record<string, string> = {
  concept: 'bg-amber/20 border-amber/40 text-amber',
  profile: 'bg-amber-light/20 border-amber-light/40 text-amber-light',
  project: 'bg-electric/20 border-electric/40 text-electric',
  organization: 'bg-ash/20 border-ash/40 text-ash-light',
  call: 'bg-electric-light/20 border-electric-light/40 text-electric-light',
};

interface GraphControlsProps {
  filters: Set<string>;
  onFiltersChange: (filters: Set<string>) => void;
  nodeCount: number;
  edgeCount: number;
  onResetLayout: () => void;
  onFitView: () => void;
}

export function GraphControls({
  filters,
  onFiltersChange,
  nodeCount,
  edgeCount,
  onResetLayout,
  onFitView,
}: GraphControlsProps) {
  const toggleFilter = (type: string) => {
    const next = new Set(filters);
    if (next.has(type)) {
      next.delete(type);
    } else {
      next.add(type);
    }
    onFiltersChange(next);
  };

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-void-border bg-void-light/95 p-3 shadow-lg backdrop-blur-sm">
      <div className="flex items-center justify-between gap-4">
        <span className="text-xs font-medium text-ash">
          {nodeCount} nodes &middot; {edgeCount} edges
        </span>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onFitView}
            title="Fit view"
          >
            <Maximize className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onResetLayout}
            title="Reset layout"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {Object.entries(NODE_TYPE_LABELS).map(([type, label]) => (
          <button
            key={type}
            onClick={() => toggleFilter(type)}
            className={cn(
              'rounded-full border px-2.5 py-0.5 text-xs font-medium transition-all',
              filters.has(type)
                ? NODE_TYPE_ICON_COLORS[type]
                : 'border-void-border bg-void text-ash-dark opacity-50',
            )}
          >
            {label}s
          </button>
        ))}
      </div>
    </div>
  );
}
