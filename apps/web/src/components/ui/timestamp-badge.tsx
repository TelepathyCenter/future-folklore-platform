'use client';

import { useState, useTransition } from 'react';
import { Anchor, Loader2, RotateCcw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  ANCHOR_STATUS_LABELS,
  ANCHOR_STATUS_BADGE_VARIANT,
} from '@future-folklore-platform/shared';
import type { AnchorStatus } from '@future-folklore-platform/shared';
import { refreshAnchorStatus } from '@/lib/actions/timestamps';

interface TimestampBadgeProps {
  timestampId: string;
  contentHash: string;
  status: AnchorStatus;
  anchorChain?: string | null;
  anchorTx?: string | null;
  /** Paths to revalidate after a successful status refresh */
  revalidatePaths?: string[];
}

export function TimestampBadge({
  timestampId,
  contentHash,
  status: initialStatus,
  anchorChain,
  anchorTx,
  revalidatePaths = [],
}: TimestampBadgeProps) {
  const [status, setStatus] = useState<AnchorStatus>(initialStatus);
  const [isPending, startTransition] = useTransition();

  const handleRefresh = () => {
    startTransition(async () => {
      const result = await refreshAnchorStatus(
        timestampId,
        contentHash,
        revalidatePaths,
      );
      if (result.anchored) {
        setStatus('anchored');
      }
    });
  };

  const isAnchored = status === 'anchored' || status === 'verified';
  const chainLabel = anchorChain
    ? anchorChain.charAt(0).toUpperCase() + anchorChain.slice(1)
    : null;

  return (
    <div className="flex items-center gap-1.5">
      <Badge variant={ANCHOR_STATUS_BADGE_VARIANT[status]} className="gap-1">
        <Anchor className="h-2.5 w-2.5" />
        {chainLabel
          ? `${ANCHOR_STATUS_LABELS[status]} (${chainLabel})`
          : ANCHOR_STATUS_LABELS[status]}
      </Badge>

      {/* Show tx link when anchored */}
      {isAnchored && anchorTx && (
        <a
          href={`https://mempool.space/tx/${anchorTx}`}
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono text-[9px] text-ash hover:text-electric transition-colors truncate max-w-[80px]"
          title={anchorTx}
        >
          {anchorTx.slice(0, 8)}…
        </a>
      )}

      {/* Refresh button for pending status */}
      {status === 'pending' && (
        <button
          type="button"
          onClick={handleRefresh}
          disabled={isPending}
          className="text-ash hover:text-electric transition-colors"
          title="Check anchor status"
        >
          {isPending ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <RotateCcw className="h-3 w-3" />
          )}
        </button>
      )}
    </div>
  );
}
