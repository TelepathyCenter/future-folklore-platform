'use client';

import { useState, useTransition } from 'react';
import { DollarSign, Edit2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  PROJECT_STAGES,
  FUNDING_STAGE_LABELS,
  FUNDING_STAGE_BADGE_VARIANT,
  EOI_STATUS_LABELS,
  EOI_STATUS_BADGE_VARIANT,
  type FundingStage,
  type EoiStatus,
} from '@future-folklore-platform/shared';
import { updateProjectFunding } from '@/lib/actions/project-funding';
import { submitEOI, updateEOIStatus } from '@/lib/actions/eoi';
import type { EOIWithInvestor, MyEOI } from '@/lib/queries/eoi';

function formatAmount(amount: number): string {
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${Math.round(amount / 1_000)}K`;
  return `$${amount.toLocaleString()}`;
}

interface FundingPanelProps {
  projectId: string;
  fundingStage: string | null;
  fundingSought: number | null;
  fundingReceived: number | null;
  useOfFunds: string | null;
  isLead: boolean;
  myEOI: MyEOI | null;
  inboundEOIs: EOIWithInvestor[];
}

// ---------------------------------------------------------------------------
// Funding edit dialog (project lead only)
// ---------------------------------------------------------------------------

function FundingEditDialog({
  projectId,
  fundingStage,
  fundingSought,
  fundingReceived,
  useOfFunds,
}: {
  projectId: string;
  fundingStage: string | null;
  fundingSought: number | null;
  fundingReceived: number | null;
  useOfFunds: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await updateProjectFunding(projectId, formData);
      if (result?.error) {
        setError(result.error);
      } else {
        setOpen(false);
        setError(null);
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) setError(null);
      }}
    >
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-ash hover:text-white"
        >
          <Edit2 className="h-3 w-3" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Funding Details</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-ash">
              Stage
            </label>
            <select
              name="funding_stage"
              defaultValue={fundingStage ?? ''}
              className="w-full rounded-md border border-void-border bg-void px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber"
            >
              <option value="">— Not set —</option>
              {PROJECT_STAGES.map((s) => (
                <option key={s} value={s}>
                  {FUNDING_STAGE_LABELS[s]}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-ash">
                Seeking (USD)
              </label>
              <input
                name="funding_sought"
                type="number"
                min="0"
                step="1000"
                defaultValue={fundingSought ?? ''}
                placeholder="e.g. 250000"
                className="w-full rounded-md border border-void-border bg-void px-3 py-2 text-sm text-white placeholder:text-ash focus:outline-none focus:ring-1 focus:ring-amber"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-ash">
                Received (USD)
              </label>
              <input
                name="funding_received"
                type="number"
                min="0"
                step="1000"
                defaultValue={fundingReceived ?? ''}
                placeholder="e.g. 50000"
                className="w-full rounded-md border border-void-border bg-void px-3 py-2 text-sm text-white placeholder:text-ash focus:outline-none focus:ring-1 focus:ring-amber"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-ash">
              Use of Funds
            </label>
            <textarea
              name="use_of_funds"
              rows={3}
              defaultValue={useOfFunds ?? ''}
              placeholder="Describe how funding will be used..."
              className="w-full rounded-md border border-void-border bg-void px-3 py-2 text-sm text-white placeholder:text-ash focus:outline-none focus:ring-1 focus:ring-amber"
            />
          </div>
          {error && <p className="text-xs text-error">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// EOI submission dialog (non-leads)
// ---------------------------------------------------------------------------

function EOIDialog({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await submitEOI(projectId, formData);
      if (result?.error) {
        setError(result.error);
      } else {
        setOpen(false);
        setError(null);
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) setError(null);
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full">
          <DollarSign className="mr-1.5 h-3.5 w-3.5" />
          Express Interest
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Express Interest</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <p className="text-sm text-ash">
            Send a message to the project lead introducing yourself and your
            interest.
          </p>
          <div>
            <label className="mb-1 block text-xs font-medium text-ash">
              Message
            </label>
            <textarea
              name="message"
              rows={4}
              required
              placeholder="Introduce yourself and explain your interest in this project..."
              className="w-full rounded-md border border-void-border bg-void px-3 py-2 text-sm text-white placeholder:text-ash focus:outline-none focus:ring-1 focus:ring-amber"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-ash-light">
            <input
              type="checkbox"
              name="notify_on_update"
              className="rounded border-void-border"
            />
            Notify me by email when status changes
          </label>
          {error && <p className="text-xs text-error">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Sending…' : 'Send'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Inbound EOI row (project lead view)
// ---------------------------------------------------------------------------

function InboundEOIRow({
  eoi,
  projectId,
}: {
  eoi: EOIWithInvestor;
  projectId: string;
}) {
  const [isPending, startTransition] = useTransition();
  const profile = eoi.profiles;
  const initials = profile.display_name
    ? profile.display_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : profile.username.slice(0, 2).toUpperCase();

  function handleStatus(status: 'acknowledged' | 'declined') {
    startTransition(async () => {
      await updateEOIStatus(eoi.id, projectId, status);
    });
  }

  return (
    <div className="space-y-2 rounded-md border border-void-border bg-void p-3">
      <div className="flex items-center gap-2">
        <Avatar className="h-7 w-7">
          {profile.avatar_url && (
            <AvatarImage
              src={profile.avatar_url}
              alt={profile.display_name ?? profile.username}
            />
          )}
          <AvatarFallback className="text-xs">{initials}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-white">
            {profile.display_name ?? profile.username}
          </p>
          <p className="text-xs text-ash">@{profile.username}</p>
        </div>
        <Badge
          variant={EOI_STATUS_BADGE_VARIANT[eoi.status as EoiStatus]}
          className="shrink-0"
        >
          {EOI_STATUS_LABELS[eoi.status as EoiStatus]}
        </Badge>
      </div>

      <p className="text-sm text-ash-light">{eoi.message}</p>

      {eoi.status === 'pending' && (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={() => handleStatus('acknowledged')}
          >
            Acknowledge
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={isPending}
            className="text-ash hover:text-white"
            onClick={() => handleStatus('declined')}
          >
            Decline
          </Button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main FundingPanel
// ---------------------------------------------------------------------------

export function FundingPanel({
  projectId,
  fundingStage,
  fundingSought,
  fundingReceived,
  useOfFunds,
  isLead,
  myEOI,
  inboundEOIs,
}: FundingPanelProps) {
  const stage = fundingStage as FundingStage | null;
  const hasFundingInfo =
    stage || fundingSought !== null || fundingReceived !== null || useOfFunds;

  return (
    <div className="space-y-6">
      {/* Funding details */}
      <div>
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium uppercase text-ash">Funding</p>
          {isLead && (
            <FundingEditDialog
              projectId={projectId}
              fundingStage={fundingStage}
              fundingSought={fundingSought}
              fundingReceived={fundingReceived}
              useOfFunds={useOfFunds}
            />
          )}
        </div>

        {hasFundingInfo ? (
          <div className="mt-2 space-y-2 rounded-md border border-void-border bg-void-light p-3">
            {stage && (
              <Badge variant={FUNDING_STAGE_BADGE_VARIANT[stage]}>
                {FUNDING_STAGE_LABELS[stage]}
              </Badge>
            )}
            {fundingSought !== null && (
              <div className="flex justify-between text-sm">
                <span className="text-ash">Seeking</span>
                <span className="font-medium text-amber">
                  {formatAmount(fundingSought)}
                </span>
              </div>
            )}
            {fundingReceived !== null && (
              <div className="flex justify-between text-sm">
                <span className="text-ash">Received</span>
                <span className="font-medium text-white">
                  {formatAmount(fundingReceived)}
                </span>
              </div>
            )}
            {useOfFunds && (
              <p className="text-xs text-ash-light">{useOfFunds}</p>
            )}
          </div>
        ) : (
          <p className="mt-2 text-sm text-ash">
            {isLead
              ? 'No funding details yet. Click edit to add them.'
              : 'No funding details provided.'}
          </p>
        )}
      </div>

      {/* Express Interest / EOI status (non-leads) */}
      {!isLead && (
        <div>
          <p className="mb-2 text-xs font-medium uppercase text-ash">
            Interest
          </p>
          {myEOI ? (
            <div className="rounded-md border border-void-border bg-void-light p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-ash-light">Your inquiry</p>
                <Badge
                  variant={EOI_STATUS_BADGE_VARIANT[myEOI.status as EoiStatus]}
                >
                  {EOI_STATUS_LABELS[myEOI.status as EoiStatus]}
                </Badge>
              </div>
            </div>
          ) : (
            <EOIDialog projectId={projectId} />
          )}
        </div>
      )}

      {/* Inbound EOIs (project lead only) */}
      {isLead && (
        <div>
          <p className="mb-2 text-xs font-medium uppercase text-ash">
            Investor Inquiries ({inboundEOIs.length})
          </p>
          {inboundEOIs.length === 0 ? (
            <p className="text-sm text-ash">No inquiries yet.</p>
          ) : (
            <div className="space-y-2">
              {inboundEOIs.map((eoi) => (
                <InboundEOIRow key={eoi.id} eoi={eoi} projectId={projectId} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
