import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  CALL_STATUS_LABELS,
  CALL_STATUS_BADGE_VARIANT,
} from '@future-folklore-platform/shared';
import { formatCallDatetime, formatDuration } from '@/lib/utils/calls';
import type { CallWithMeta } from '@/lib/queries/calls';

interface CallCardProps {
  call: CallWithMeta;
  past?: boolean;
}

export function CallCard({ call, past }: CallCardProps) {
  return (
    <Link href={`/calls/${call.id}`}>
      <Card
        className={`transition-colors hover:border-amber-muted ${past ? 'opacity-60' : ''}`}
      >
        <CardContent className="flex flex-col gap-3 p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-white">{call.title}</p>
              <p className="text-xs text-ash">
                {formatCallDatetime(call.scheduled_at)}
              </p>
            </div>
            <Badge
              variant={CALL_STATUS_BADGE_VARIANT[call.status]}
              className="shrink-0"
            >
              {CALL_STATUS_LABELS[call.status]}
            </Badge>
          </div>

          {call.description && (
            <p className="line-clamp-2 text-sm text-ash-light">
              {call.description}
            </p>
          )}

          <div className="flex items-center justify-between text-xs text-ash">
            <div className="flex items-center gap-3">
              <span>{formatDuration(call.duration_minutes)}</span>
              {call.project_id && (
                <Badge variant="outline" className="text-xs">
                  Project
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              {call.rsvp_counts.going > 0 && (
                <span>{call.rsvp_counts.going} going</span>
              )}
              {call.rsvp_counts.maybe > 0 && (
                <span>{call.rsvp_counts.maybe} maybe</span>
              )}
            </div>
          </div>

          {call.creator && (
            <p className="text-xs text-ash">
              Hosted by {call.creator.display_name ?? call.creator.username}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
