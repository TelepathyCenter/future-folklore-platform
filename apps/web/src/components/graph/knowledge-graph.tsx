'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
  useReactFlow,
  BackgroundVariant,
  Panel,
  type Node,
  type Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { ConceptNode } from '@/components/graph/nodes/concept-node';
import { ProfileNode } from '@/components/graph/nodes/profile-node';
import { ProjectNode } from '@/components/graph/nodes/project-node';
import { OrgNode } from '@/components/graph/nodes/org-node';
import { CallNode } from '@/components/graph/nodes/call-node';
import { GraphControls } from '@/components/graph/graph-controls';
import { GraphSidebar } from '@/components/graph/graph-sidebar';
import type { GraphData, GraphNodeData } from '@/lib/queries/graph';

const STORAGE_KEY = 'ff-knowledge-graph-layout';

function readSavedPositions(): Record<string, { x: number; y: number }> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return {};
  }
}

const nodeTypes = {
  concept: ConceptNode,
  profile: ProfileNode,
  project: ProjectNode,
  organization: OrgNode,
  call: CallNode,
};

interface KnowledgeGraphProps {
  data: GraphData;
  currentUserId?: string;
}

function KnowledgeGraphInner({ data, currentUserId }: KnowledgeGraphProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const { fitView } = useReactFlow();
  const [isLayoutReady, setIsLayoutReady] = useState(false);
  const [selectedNode, setSelectedNode] = useState<GraphNodeData | null>(null);
  const [filters, setFilters] = useState<Set<string>>(
    new Set(['concept', 'profile', 'project', 'organization', 'call']),
  );

  // Initialize nodes and edges from server data
  useEffect(() => {
    if (data.nodes.length === 0 || isLayoutReady) return;

    const savedPositions = readSavedPositions();

    const rowLength = Math.max(Math.ceil(Math.sqrt(data.nodes.length)), 1);

    const initialNodes: Node[] = data.nodes.map((node, index) => {
      const savedPos = savedPositions[node.id];
      const x = (index % rowLength) * 280;
      const y = Math.floor(index / rowLength) * 160;

      return {
        id: node.id,
        type: node.nodeType,
        position: savedPos ?? { x, y },
        data: node,
      };
    });

    const initialEdges: Edge[] = data.edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      label: edge.label,
      animated: true,
      style: { stroke: '#606070' },
      labelStyle: { fill: '#a0a0b0', fontWeight: 500, fontSize: 10 },
    }));

    setNodes(initialNodes);
    setEdges(initialEdges);
    setIsLayoutReady(true);
    setTimeout(() => fitView({ padding: 0.3 }), 100);
  }, [data, isLayoutReady, setNodes, setEdges, fitView]);

  // Save node positions on drag stop
  const onNodeDragStop = useCallback((_: React.MouseEvent, node: Node) => {
    const savedPositions = readSavedPositions();
    savedPositions[node.id] = node.position;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(savedPositions));
  }, []);

  // Handle node click
  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node.data as GraphNodeData);
  }, []);

  // Handle pane click (deselect)
  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  // Reset layout
  const handleResetLayout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setIsLayoutReady(false);
    setNodes([]);
    setSelectedNode(null);
  }, [setNodes]);

  // Filter visibility
  const visibleNodes = useMemo(() => {
    return nodes.map((node) => ({
      ...node,
      hidden: !filters.has((node.data as GraphNodeData).nodeType),
    }));
  }, [nodes, filters]);

  const visibleEdges = useMemo(() => {
    const visibleIds = new Set(
      visibleNodes.filter((n) => !n.hidden).map((n) => n.id),
    );
    return edges.map((edge) => ({
      ...edge,
      hidden: !visibleIds.has(edge.source) || !visibleIds.has(edge.target),
    }));
  }, [edges, visibleNodes]);

  // MiniMap node color
  const minimapColor = useCallback((node: Node) => {
    const nodeType = (node.data as GraphNodeData).nodeType;
    if (nodeType === 'concept') return '#c8952a';
    if (nodeType === 'profile') return '#d4a84a';
    if (nodeType === 'project') return '#4a9eff';
    if (nodeType === 'organization') return '#a0a0b0';
    if (nodeType === 'call') return '#6db3ff';
    return '#606070';
  }, []);

  return (
    <div className="relative h-full w-full">
      <ReactFlow
        nodes={visibleNodes}
        edges={visibleEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDragStop={onNodeDragStop}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.1}
        maxZoom={4}
        defaultEdgeOptions={{
          type: 'smoothstep',
          animated: true,
        }}
        snapToGrid
        snapGrid={[15, 15]}
        className="bg-void"
      >
        <Background
          color="#1a1b24"
          gap={20}
          size={1}
          variant={BackgroundVariant.Dots}
        />
        <Controls
          className="!border-void-border !bg-void-light [&>button]:!border-void-border [&>button]:!bg-void-light [&>button]:!fill-ash [&>button:hover]:!bg-void-lighter"
          showInteractive={false}
        />
        <MiniMap
          nodeColor={minimapColor}
          maskColor="rgba(10, 11, 15, 0.8)"
          className="!border-void-border !bg-void-light"
        />
        <Panel position="top-left" className="m-2">
          <GraphControls
            filters={filters}
            onFiltersChange={setFilters}
            nodeCount={visibleNodes.filter((n) => !n.hidden).length}
            edgeCount={visibleEdges.filter((e) => !e.hidden).length}
            onResetLayout={handleResetLayout}
            onFitView={() => fitView({ padding: 0.3 })}
          />
        </Panel>
      </ReactFlow>

      {selectedNode && (
        <GraphSidebar
          node={selectedNode}
          edges={data.edges.filter(
            (e) => e.source === selectedNode.id || e.target === selectedNode.id,
          )}
          allNodes={data.nodes}
          onClose={() => setSelectedNode(null)}
          currentUserId={currentUserId}
        />
      )}
    </div>
  );
}

export function KnowledgeGraph({ data, currentUserId }: KnowledgeGraphProps) {
  return (
    <ReactFlowProvider>
      <KnowledgeGraphInner data={data} currentUserId={currentUserId} />
    </ReactFlowProvider>
  );
}
