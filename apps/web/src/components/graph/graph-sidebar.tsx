'use client';

import Link from 'next/link';
import { X, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  EDGE_TYPE_LABELS,
  NODE_TYPE_LABELS,
} from '@future-folklore-platform/shared';
import type { NodeType, EdgeType } from '@future-folklore-platform/shared';
import type { GraphData, GraphNodeData } from '@/lib/queries/graph';

interface GraphSidebarProps {
  node: GraphNodeData;
  edges: GraphData['edges'];
  allNodes: GraphNodeData[];
  onClose: () => void;
}

function getEntityLink(node: GraphNodeData): string | null {
  if (node.nodeType === 'concept' && node.slug)
    return `/graph/concepts/${node.slug}`;
  if (node.nodeType === 'project') return `/projects/${node.id}`;
  if (node.nodeType === 'profile' && node.slug) return `/profile/${node.slug}`;
  if (node.nodeType === 'call') return `/calls/${node.id}`;
  return null;
}

export function GraphSidebar({
  node,
  edges,
  allNodes,
  onClose,
}: GraphSidebarProps) {
  const link = getEntityLink(node);
  const nodeMap = new Map(allNodes.map((n) => [n.id, n]));

  return (
    <div className="absolute right-0 top-0 z-10 flex h-full w-80 flex-col border-l border-void-border bg-void-light/95 shadow-2xl backdrop-blur-sm">
      <div className="flex items-center justify-between border-b border-void-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {NODE_TYPE_LABELS[node.nodeType as NodeType]}
          </Badge>
          <h3 className="text-sm font-semibold text-white">{node.label}</h3>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {node.description && (
            <p className="text-sm text-ash-light">{node.description}</p>
          )}

          {link && (
            <Link href={link}>
              <Button variant="outline" size="sm" className="w-full">
                <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                View details
              </Button>
            </Link>
          )}

          {edges.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-medium uppercase tracking-wider text-ash">
                Connections ({edges.length})
              </h4>
              <div className="space-y-1.5">
                {edges.map((edge) => {
                  const isSource = edge.source === node.id;
                  const otherId = isSource ? edge.target : edge.source;
                  const otherNode = nodeMap.get(otherId);

                  return (
                    <div
                      key={edge.id}
                      className="flex items-center gap-2 rounded-md bg-void px-2.5 py-1.5"
                    >
                      <Badge variant="outline" className="shrink-0 text-[10px]">
                        {EDGE_TYPE_LABELS[edge.edgeType as EdgeType]}
                      </Badge>
                      <span className="truncate text-xs text-ash-light">
                        {otherNode?.label ?? 'Unknown'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {edges.length === 0 && (
            <p className="text-center text-xs text-ash">
              No connections from this node
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
