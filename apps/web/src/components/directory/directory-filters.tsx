'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  PROFILE_ROLES,
  PROFILE_ROLE_LABELS,
} from '@future-folklore-platform/shared';

export function DirectoryFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentSearch = searchParams.get('search') ?? '';
  const currentRole = searchParams.get('role') ?? '';

  const updateParams = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete('page');
      router.push(`/directory?${params.toString()}`);
    },
    [router, searchParams],
  );

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ash" />
        <Input
          placeholder="Search by name, username, or bio..."
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
      <div className="flex gap-2">
        <Button
          variant={currentRole === '' ? 'default' : 'outline'}
          size="sm"
          onClick={() => updateParams('role', '')}
        >
          All
        </Button>
        {PROFILE_ROLES.map((role) => (
          <Button
            key={role}
            variant={currentRole === role ? 'default' : 'outline'}
            size="sm"
            onClick={() => updateParams('role', role)}
          >
            {PROFILE_ROLE_LABELS[role]}
          </Button>
        ))}
      </div>
    </div>
  );
}
