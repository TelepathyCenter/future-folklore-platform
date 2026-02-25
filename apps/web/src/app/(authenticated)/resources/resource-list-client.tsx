'use client';

import { useState } from 'react';
import { ResourceCard } from '@/components/resources/resource-card';
import { ResourceDetailDialog } from '@/components/resources/resource-detail-dialog';
import type { ResourceWithMeta } from '@/lib/queries/resources';

export function ResourceListClient({
  resources,
}: {
  resources: ResourceWithMeta[];
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {resources.map((resource) => (
          <ResourceCard
            key={resource.id}
            resource={resource}
            onSelect={(r) => setSelectedId(r.id)}
          />
        ))}
      </div>

      <ResourceDetailDialog
        resourceId={selectedId}
        isMember={false}
        onClose={() => setSelectedId(null)}
        onDeleted={() => setSelectedId(null)}
      />
    </>
  );
}
