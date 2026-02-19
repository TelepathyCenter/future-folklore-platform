'use client';

import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createConcept } from '@/lib/actions/graph';
import type { Concept } from '@/lib/queries/graph';

interface ConceptFormProps {
  parentConcepts: Pick<Concept, 'id' | 'name' | 'slug'>[];
}

export function ConceptForm({ parentConcepts }: ConceptFormProps) {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  return (
    <form action={createConcept} className="space-y-6">
      {error && (
        <div className="rounded-md border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          name="name"
          placeholder="e.g., Bayesian Statistics"
          required
        />
        <p className="text-xs text-ash">
          The slug will be auto-generated from the name.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <textarea
          id="description"
          name="description"
          rows={3}
          className="flex w-full rounded-md border border-void-border bg-void-light px-3 py-2 text-sm text-white placeholder:text-ash focus:border-amber focus:outline-none focus:ring-1 focus:ring-amber"
          placeholder="Brief description of this concept..."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="parent_id">Parent Concept (optional)</Label>
        <select
          id="parent_id"
          name="parent_id"
          className="flex h-10 w-full rounded-md border border-void-border bg-void-light px-3 py-2 text-sm text-white focus:border-amber focus:outline-none focus:ring-1 focus:ring-amber"
          defaultValue=""
        >
          <option value="">None (top-level concept)</option>
          {parentConcepts.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <Button type="submit" className="w-full">
        Create Concept
      </Button>
    </form>
  );
}
