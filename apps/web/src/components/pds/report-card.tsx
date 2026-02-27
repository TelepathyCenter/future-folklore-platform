import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Shield,
  ShieldCheck,
  Clock,
  MapPin,
  Zap,
  FlaskConical,
} from 'lucide-react';
import type { PdsReport } from '@future-folklore-platform/shared';

interface ReportCardProps {
  report: PdsReport;
}

function AnchorBadge({
  status,
}: {
  status: 'pending' | 'anchored' | 'verified' | null;
}) {
  if (!status || status === 'pending') {
    return (
      <span className="flex items-center gap-1 text-xs text-ash">
        <Clock className="h-3 w-3" />
        Timestamped
      </span>
    );
  }
  if (status === 'anchored') {
    return (
      <span className="flex items-center gap-1 text-xs text-amber">
        <Shield className="h-3 w-3" />
        Anchored
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-xs text-electric">
      <ShieldCheck className="h-3 w-3" />
      Verified on-chain
    </span>
  );
}

function ConfidenceDots({ value }: { value: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {Array.from({ length: 10 }).map((_, i) => (
        <span
          key={i}
          className={`h-1.5 w-1.5 rounded-full ${
            i < value ? 'bg-amber' : 'bg-void-border'
          }`}
        />
      ))}
      <span className="ml-1 text-xs text-ash">{value}/10</span>
    </span>
  );
}

export function ReportCard({ report }: ReportCardProps) {
  const isDetailed = report.capture_mode === 'detailed';
  const anchorStatus = report.blockchain_timestamp?.anchor_status ?? null;

  return (
    <Link href={`/pds/${report.id}`}>
      <Card className="border-void-border bg-void-lighter p-4 transition-colors hover:border-amber/40 hover:bg-void-lighter/80">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            {/* Date + mode badge */}
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <time className="text-sm font-semibold text-white">
                {new Date(report.session_date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </time>
              {isDetailed ? (
                <Badge variant="secondary" className="gap-1 py-0 text-[10px]">
                  <FlaskConical className="h-2.5 w-2.5" />
                  Detailed
                </Badge>
              ) : (
                <Badge variant="outline" className="gap-1 py-0 text-[10px]">
                  <Zap className="h-2.5 w-2.5" />
                  Field
                </Badge>
              )}
              {report.is_public && (
                <Badge variant="outline" className="py-0 text-[10px] text-ash">
                  Public
                </Badge>
              )}
            </div>

            {/* Narrative preview */}
            <p className="mb-3 line-clamp-3 text-sm leading-relaxed text-ash">
              {report.narrative}
            </p>

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              {report.location && (
                <span className="flex items-center gap-1 text-xs text-ash">
                  <MapPin className="h-3 w-3" />
                  {report.location}
                </span>
              )}
              <ConfidenceDots value={report.confidence} />
              <AnchorBadge status={anchorStatus} />
            </div>

            {/* Tags */}
            {report.tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {report.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="py-0 text-[10px] text-ash"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Project pill */}
          {report.project && (
            <div className="shrink-0">
              <Badge variant="secondary" className="text-[10px]">
                {report.project.name}
              </Badge>
            </div>
          )}
        </div>
      </Card>
    </Link>
  );
}
