'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import { Button } from '@/components/ui/button';

const SCOPE_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'community', label: 'Community' },
  { value: 'project', label: 'Project-linked' },
] as const;

export function CallFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentScope = searchParams.get('scope') ?? '';

  const updateScope = useCallback(
    (scope: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (scope) {
        params.set('scope', scope);
      } else {
        params.delete('scope');
      }
      params.delete('page');
      router.push(`/calls?${params.toString()}`);
    },
    [router, searchParams],
  );

  return (
    <div className="flex gap-2">
      {SCOPE_OPTIONS.map(({ value, label }) => (
        <Button
          key={value}
          variant={currentScope === value ? 'default' : 'outline'}
          size="sm"
          onClick={() => updateScope(value)}
        >
          {label}
        </Button>
      ))}
    </div>
  );
}
