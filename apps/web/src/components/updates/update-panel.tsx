'use client';

import { useState } from 'react';
import { MessageSquarePlus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { UpdateForm } from '@/components/updates/update-form';
import { UpdateCard } from '@/components/updates/update-card';
import type { UpdateWithMeta } from '@/lib/queries/updates';

interface UpdatePanelProps {
  projectId: string;
  updates: UpdateWithMeta[];
  isMember: boolean;
}

export function UpdatePanel({
  projectId,
  updates,
  isMember,
}: UpdatePanelProps) {
  const [open, setOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div key={refreshKey}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase text-ash">
          Updates ({updates.length})
        </p>
        {isMember && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <MessageSquarePlus className="mr-1.5 h-3.5 w-3.5" />
                Post Update
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Post Update</DialogTitle>
                <DialogDescription>
                  Share progress, findings, or news with the community.
                </DialogDescription>
              </DialogHeader>
              <UpdateForm
                projectId={projectId}
                onSuccess={() => {
                  setOpen(false);
                  setRefreshKey((k) => k + 1);
                }}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {updates.length === 0 && (
        <p className="mt-3 text-sm text-ash">
          No updates posted yet.
          {isMember && ' Share your first update with the community.'}
        </p>
      )}

      {updates.length > 0 && (
        <div className="mt-3 space-y-3">
          {updates.map((update) => (
            <UpdateCard key={update.id} update={update} />
          ))}
        </div>
      )}
    </div>
  );
}
