'use client';

import { useState } from 'react';
import { FolderOpen } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ResourceForm } from '@/components/resources/resource-form';
import { ResourceCard } from '@/components/resources/resource-card';
import { ResourceDetailDialog } from '@/components/resources/resource-detail-dialog';
import type { ResourceWithMeta } from '@/lib/queries/resources';

interface ResourcePanelProps {
  projectId: string;
  resources: ResourceWithMeta[];
  isMember: boolean;
}

export function ResourcePanel({
  projectId,
  resources,
  isMember,
}: ResourcePanelProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedResourceId, setSelectedResourceId] = useState<string | null>(
    null,
  );

  return (
    <div key={refreshKey}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase text-ash">
          Resources ({resources.length})
        </p>
        {isMember && (
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <FolderOpen className="mr-1.5 h-3.5 w-3.5" />
                Add Resource
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add Resource</DialogTitle>
                <DialogDescription>
                  Upload a document, dataset, image, or add a link to share with
                  the team.
                </DialogDescription>
              </DialogHeader>
              <ResourceForm
                projectId={projectId}
                onSuccess={() => {
                  setCreateOpen(false);
                  setRefreshKey((k) => k + 1);
                }}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {resources.length === 0 && (
        <p className="mt-3 text-sm text-ash">
          No resources shared yet.
          {isMember && ' Upload your first document or add a link.'}
        </p>
      )}

      {resources.length > 0 && (
        <div className="mt-3 space-y-2">
          {resources.map((resource) => (
            <ResourceCard
              key={resource.id}
              resource={resource}
              onSelect={(r) => setSelectedResourceId(r.id)}
            />
          ))}
        </div>
      )}

      <ResourceDetailDialog
        resourceId={selectedResourceId}
        isMember={isMember}
        onClose={() => setSelectedResourceId(null)}
        onDeleted={() => {
          setSelectedResourceId(null);
          setRefreshKey((k) => k + 1);
        }}
      />
    </div>
  );
}
