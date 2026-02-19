'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  PROJECT_STATUSES,
  PROJECT_STATUS_LABELS,
  DOMAIN_TAGS,
} from '@future-folklore-platform/shared';

export function ProjectFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentSearch = searchParams.get('search') ?? '';
  const currentStatus = searchParams.get('status') ?? '';
  const currentTag = searchParams.get('tag') ?? '';

  const updateParams = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete('page');
      router.push(`/projects?${params.toString()}`);
    },
    [router, searchParams],
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ash" />
        <Input
          placeholder="Search by name or description..."
          defaultValue={currentSearch}
          className="pl-9"
          onChange={(e) => {
            const timeout = setTimeout(
              () => updateParams('search', e.target.value),
              300,
            );
            return () => clearTimeout(timeout);
          }}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          variant={currentStatus === '' ? 'default' : 'outline'}
          size="sm"
          onClick={() => updateParams('status', '')}
        >
          All statuses
        </Button>
        {PROJECT_STATUSES.map((status) => (
          <Button
            key={status}
            variant={currentStatus === status ? 'default' : 'outline'}
            size="sm"
            onClick={() => updateParams('status', status)}
          >
            {PROJECT_STATUS_LABELS[status]}
          </Button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          variant={currentTag === '' ? 'default' : 'outline'}
          size="sm"
          onClick={() => updateParams('tag', '')}
        >
          All domains
        </Button>
        {DOMAIN_TAGS.map((tag) => (
          <Button
            key={tag}
            variant={currentTag === tag ? 'default' : 'outline'}
            size="sm"
            onClick={() => updateParams('tag', tag)}
          >
            {tag}
          </Button>
        ))}
      </div>
    </div>
  );
}
