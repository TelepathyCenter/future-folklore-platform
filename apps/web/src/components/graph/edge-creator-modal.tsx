'use client';

import { useState, useTransition, useCallback, useRef, useEffect } from 'react';
import type { ReactNode } from 'react';
import { Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  EDGE_TYPE_LABELS,
  NODE_TYPE_LABELS,
  getValidEdgeTypes,
} from '@future-folklore-platform/shared';
import type { NodeType, EdgeType } from '@future-folklore-platform/shared';
import { createEdge, searchEntitiesAction } from '@/lib/actions/graph';
import type { EntitySearchResult } from '@/lib/queries/graph';

export interface EntityPreset {
  id: string;
  nodeType: NodeType;
  label: string;
}

interface EdgeCreatorModalProps {
  trigger: ReactNode;
  presetSource?: EntityPreset;
  presetTarget?: EntityPreset;
}

function EntityPicker({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: EntityPreset | null;
  onChange: (entity: EntityPreset | null) => void;
  disabled?: boolean;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<EntitySearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const doSearch = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      return;
    }
    setIsSearching(true);
    const res = await searchEntitiesAction(q);
    setResults(res);
    setIsSearching(false);
    setShowDropdown(true);
  }, []);

  const handleInputChange = useCallback(
    (val: string) => {
      setQuery(val);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => doSearch(val), 300);
    },
    [doSearch],
  );

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (disabled && value) {
    return (
      <div>
        <p className="mb-1.5 text-xs font-medium text-ash">{label}</p>
        <div className="flex items-center gap-2 rounded-md border border-void-border bg-void px-3 py-2">
          <Badge variant="outline" className="text-[10px]">
            {NODE_TYPE_LABELS[value.nodeType]}
          </Badge>
          <span className="text-sm text-ash-light">{value.label}</span>
        </div>
      </div>
    );
  }

  if (value) {
    return (
      <div>
        <p className="mb-1.5 text-xs font-medium text-ash">{label}</p>
        <div className="flex items-center gap-2 rounded-md border border-void-border bg-void px-3 py-2">
          <Badge variant="outline" className="text-[10px]">
            {NODE_TYPE_LABELS[value.nodeType]}
          </Badge>
          <span className="flex-1 text-sm text-ash-light">{value.label}</span>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="text-xs text-ash hover:text-white"
          >
            Change
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <p className="mb-1.5 text-xs font-medium text-ash">{label}</p>
      <Input
        value={query}
        onChange={(e) => handleInputChange(e.target.value)}
        onFocus={() => results.length > 0 && setShowDropdown(true)}
        placeholder="Search by name..."
        className="h-9"
      />
      {isSearching && <p className="mt-1 text-xs text-ash">Searching...</p>}
      {showDropdown && results.length > 0 && (
        <div className="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-md border border-void-border bg-void-light shadow-lg">
          {results.map((r) => (
            <button
              key={r.id}
              type="button"
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-ash-light hover:bg-void-lighter hover:text-white"
              onClick={() => {
                onChange({
                  id: r.id,
                  nodeType: r.nodeType as NodeType,
                  label: r.label,
                });
                setShowDropdown(false);
                setQuery('');
                setResults([]);
              }}
            >
              <Badge variant="outline" className="shrink-0 text-[10px]">
                {NODE_TYPE_LABELS[r.nodeType as NodeType]}
              </Badge>
              <span className="truncate">{r.label}</span>
            </button>
          ))}
        </div>
      )}
      {showDropdown &&
        !isSearching &&
        query.length >= 2 &&
        results.length === 0 && (
          <p className="mt-1 text-xs text-ash">No results found</p>
        )}
    </div>
  );
}

export function EdgeCreatorModal({
  trigger,
  presetSource,
  presetTarget,
}: EdgeCreatorModalProps) {
  const [open, setOpen] = useState(false);
  const [source, setSource] = useState<EntityPreset | null>(
    presetSource ?? null,
  );
  const [target, setTarget] = useState<EntityPreset | null>(
    presetTarget ?? null,
  );
  const [edgeType, setEdgeType] = useState<EdgeType | ''>('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Compute valid edge types
  const validEdgeTypes =
    source && target ? getValidEdgeTypes(source.nodeType, target.nodeType) : [];

  // Reset edge type if it becomes invalid
  useEffect(() => {
    if (edgeType && !validEdgeTypes.includes(edgeType as EdgeType)) {
      setEdgeType('');
    }
  }, [validEdgeTypes, edgeType]);

  const handleReset = useCallback(() => {
    setSource(presetSource ?? null);
    setTarget(presetTarget ?? null);
    setEdgeType('');
    setNotes('');
    setError(null);
  }, [presetSource, presetTarget]);

  const handleSubmit = () => {
    if (!source || !target || !edgeType) {
      setError('Please select source, target, and edge type');
      return;
    }
    setError(null);

    const formData = new FormData();
    formData.set('source_type', source.nodeType);
    formData.set('source_id', source.id);
    formData.set('target_type', target.nodeType);
    formData.set('target_id', target.id);
    formData.set('edge_type', edgeType);
    if (notes.trim()) formData.set('notes', notes.trim());

    startTransition(async () => {
      const result = await createEdge(formData);
      if (result && 'error' in result && result.error) {
        setError(result.error);
      } else {
        handleReset();
        setOpen(false);
      }
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) handleReset();
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Connection</DialogTitle>
          <DialogDescription>
            Create a relationship between two entities in the knowledge graph.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <EntityPicker
            label="Source"
            value={source}
            onChange={setSource}
            disabled={!!presetSource}
          />

          <EntityPicker
            label="Target"
            value={target}
            onChange={setTarget}
            disabled={!!presetTarget}
          />

          {source && target && validEdgeTypes.length > 0 && (
            <div>
              <p className="mb-1.5 text-xs font-medium text-ash">
                Connection Type
              </p>
              <select
                value={edgeType}
                onChange={(e) => setEdgeType(e.target.value as EdgeType)}
                className="flex h-9 w-full rounded-md border border-void-border bg-void-light px-3 py-1.5 text-sm text-ash-light focus-ring"
              >
                <option value="">Select type...</option>
                {validEdgeTypes.map((t) => (
                  <option key={t} value={t}>
                    {EDGE_TYPE_LABELS[t]}
                  </option>
                ))}
              </select>
            </div>
          )}

          {source && target && validEdgeTypes.length === 0 && (
            <p className="text-xs text-error">
              No valid connection types for {NODE_TYPE_LABELS[source.nodeType]}{' '}
              &rarr; {NODE_TYPE_LABELS[target.nodeType]}. Try swapping source
              and target.
            </p>
          )}

          {edgeType && (
            <div>
              <p className="mb-1.5 text-xs font-medium text-ash">
                Notes (optional)
              </p>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Additional context..."
                className="flex w-full rounded-md border border-void-border bg-void-light px-3 py-2 text-sm text-ash-light placeholder:text-ash-dark focus-ring"
              />
            </div>
          )}

          {error && <p className="text-xs text-error">{error}</p>}

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={isPending || !source || !target || !edgeType}
            >
              <Plus className="mr-1 h-3.5 w-3.5" />
              {isPending ? 'Creating...' : 'Create Connection'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
