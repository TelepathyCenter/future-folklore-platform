'use client';

import { useState, useTransition } from 'react';
import {
  Hash,
  Plus,
  CheckCircle2,
  XCircle,
  ExternalLink,
  ShieldCheck,
  Loader2,
} from 'lucide-react';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  MILESTONE_STATUS_LABELS,
  MILESTONE_STATUS_BADGE_VARIANT,
} from '@future-folklore-platform/shared';
import type { MilestoneStatus } from '@future-folklore-platform/shared';
import { createMilestone, verifyMilestone } from '@/lib/actions/milestones';
import type { MilestoneWithCreator } from '@/lib/queries/milestones';

interface MilestonePanelProps {
  projectId: string;
  milestones: MilestoneWithCreator[];
  isMember: boolean;
}

function VerifyButton({ milestoneId }: { milestoneId: string }) {
  const [result, setResult] = useState<'idle' | 'valid' | 'invalid'>('idle');
  const [isPending, startTransition] = useTransition();

  const handleVerify = () => {
    startTransition(async () => {
      const res = await verifyMilestone(milestoneId);
      setResult(res.valid ? 'valid' : 'invalid');
    });
  };

  if (result === 'valid') {
    return (
      <span className="flex items-center gap-1 text-xs text-emerald-400">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Hash verified
      </span>
    );
  }

  if (result === 'invalid') {
    return (
      <span className="flex items-center gap-1 text-xs text-error">
        <XCircle className="h-3.5 w-3.5" />
        Hash mismatch
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={handleVerify}
      disabled={isPending}
      className="flex items-center gap-1 text-xs text-ash hover:text-electric transition-colors"
    >
      {isPending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <ShieldCheck className="h-3.5 w-3.5" />
      )}
      Verify
    </button>
  );
}

function CreateMilestoneDialog({
  projectId,
  onCreated,
}: {
  projectId: string;
  onCreated: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await createMilestone(projectId, formData);
      if (result && 'error' in result && result.error) {
        setError(result.error);
      } else {
        setOpen(false);
        onCreated();
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Record Milestone
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Record Milestone</DialogTitle>
          <DialogDescription>
            Record a project milestone with a tamper-evident SHA-256 hash.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="milestone-title"
              className="mb-1.5 block text-xs font-medium text-ash"
            >
              Title *
            </label>
            <Input
              id="milestone-title"
              name="title"
              required
              placeholder="e.g. Completed initial protocol design"
              className="h-9"
            />
          </div>
          <div>
            <label
              htmlFor="milestone-description"
              className="mb-1.5 block text-xs font-medium text-ash"
            >
              Description
            </label>
            <textarea
              id="milestone-description"
              name="description"
              rows={3}
              placeholder="Describe what was accomplished..."
              className="flex w-full rounded-md border border-void-border bg-void-light px-3 py-2 text-sm text-ash-light placeholder:text-ash-dark focus-ring"
            />
          </div>
          <div>
            <label
              htmlFor="milestone-evidence"
              className="mb-1.5 block text-xs font-medium text-ash"
            >
              Evidence URL
            </label>
            <Input
              id="milestone-evidence"
              name="evidence_url"
              type="url"
              placeholder="https://..."
              className="h-9"
            />
          </div>

          {error && <p className="text-xs text-error">{error}</p>}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isPending}>
              <Hash className="mr-1 h-3.5 w-3.5" />
              {isPending ? 'Hashing...' : 'Record & Hash'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function MilestonePanel({
  projectId,
  milestones,
  isMember,
}: MilestonePanelProps) {
  // Force refresh trick: increment key to trigger server re-fetch
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div key={refreshKey}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase text-ash">
          Milestones ({milestones.length})
        </p>
        {isMember && (
          <CreateMilestoneDialog
            projectId={projectId}
            onCreated={() => setRefreshKey((k) => k + 1)}
          />
        )}
      </div>

      {milestones.length === 0 && (
        <p className="mt-3 text-sm text-ash">
          No milestones recorded yet.
          {isMember &&
            ' Record your first milestone to create a tamper-evident timestamp.'}
        </p>
      )}

      {milestones.length > 0 && (
        <div className="mt-3 space-y-3">
          {milestones.map((milestone) => {
            const profile = milestone.profiles;
            const initials = profile.display_name
              ? profile.display_name
                  .split(' ')
                  .map((n: string) => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2)
              : profile.username.slice(0, 2).toUpperCase();

            return (
              <div
                key={milestone.id}
                className="rounded-md border border-void-border bg-void-light p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="truncate text-sm font-medium text-white">
                        {milestone.title}
                      </h4>
                      <Badge
                        variant={
                          MILESTONE_STATUS_BADGE_VARIANT[
                            milestone.status as MilestoneStatus
                          ]
                        }
                        className="shrink-0"
                      >
                        {
                          MILESTONE_STATUS_LABELS[
                            milestone.status as MilestoneStatus
                          ]
                        }
                      </Badge>
                    </div>
                    {milestone.description && (
                      <p className="mt-1 text-xs text-ash-light">
                        {milestone.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Hash display */}
                <div className="mt-3 rounded bg-void px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-medium uppercase text-ash">
                        SHA-256 Hash
                      </p>
                      <p className="mt-0.5 break-all font-mono text-xs text-ash-light">
                        {milestone.content_hash}
                      </p>
                    </div>
                    <VerifyButton milestoneId={milestone.id} />
                  </div>
                </div>

                {/* Footer: creator + evidence + timestamp */}
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-5 w-5">
                      {profile.avatar_url && (
                        <AvatarImage
                          src={profile.avatar_url}
                          alt={profile.display_name ?? profile.username}
                        />
                      )}
                      <AvatarFallback className="text-[8px]">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-ash">
                      {profile.display_name ?? profile.username}
                    </span>
                    <span className="text-xs text-ash-dark">
                      {formatDate(milestone.created_at)}
                    </span>
                  </div>
                  {milestone.evidence_url && (
                    <a
                      href={milestone.evidence_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-electric hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Evidence
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
