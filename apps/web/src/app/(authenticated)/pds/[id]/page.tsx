import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getReport } from '@/lib/queries/pds';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  ArrowLeft,
  MapPin,
  Clock,
  FlaskConical,
  Zap,
  Shield,
  ShieldCheck,
  Calendar,
  Timer,
  ExternalLink,
} from 'lucide-react';
import type { SensoryData, SensoryChannel_Key } from '@future-folklore-platform/shared';
import { SENSORY_CHANNELS } from '@future-folklore-platform/shared';

export const metadata = { title: 'Report — FF-PDS' };

const CHANNEL_LABELS: Record<SensoryChannel_Key, string> = {
  visual: 'Visual',
  auditory: 'Auditory',
  tactile: 'Tactile / Physical',
  olfactory: 'Olfactory',
  emotional: 'Emotional',
  proprioceptive: 'Proprioceptive / Kinesthetic',
};

function AnchorBadge({
  status,
  chain,
  tx,
}: {
  status: 'pending' | 'anchored' | 'verified' | null;
  chain: string | null;
  tx: string | null;
}) {
  if (!status || status === 'pending') {
    return (
      <div className="flex items-center gap-2 rounded-md border border-void-border bg-void-lighter px-3 py-2">
        <Clock className="h-4 w-4 text-ash" />
        <div>
          <p className="text-xs font-medium text-white">Pending Anchoring</p>
          <p className="text-xs text-ash">Hash submitted — waiting for batch anchoring</p>
        </div>
      </div>
    );
  }

  if (status === 'anchored') {
    return (
      <div className="flex items-start gap-2 rounded-md border border-amber/30 bg-amber-muted px-3 py-2">
        <Shield className="mt-0.5 h-4 w-4 text-amber" />
        <div className="min-w-0">
          <p className="text-xs font-medium text-amber">
            Anchored on {chain ?? 'blockchain'}
          </p>
          {tx && (
            <p className="mt-0.5 truncate text-xs text-ash" title={tx}>
              TX: {tx.slice(0, 24)}…
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2 rounded-md border border-electric/30 bg-electric/10 px-3 py-2">
      <ShieldCheck className="mt-0.5 h-4 w-4 text-electric" />
      <div className="min-w-0">
        <p className="text-xs font-medium text-electric">
          Verified on {chain ?? 'blockchain'}
        </p>
        {tx && (
          <p className="mt-0.5 truncate text-xs text-ash" title={tx}>
            TX: {tx.slice(0, 24)}…
          </p>
        )}
      </div>
    </div>
  );
}

function ConfidenceBar({ value }: { value: number }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs text-ash">Confidence</span>
        <span className="text-xs font-semibold text-amber">{value}/10</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-void-border">
        <div
          className="h-full rounded-full bg-amber"
          style={{ width: `${value * 10}%` }}
        />
      </div>
    </div>
  );
}

function SensorySection({ sensoryData }: { sensoryData: SensoryData }) {
  const activeChannels = SENSORY_CHANNELS.filter(
    (ch) => sensoryData[ch]?.intensity || sensoryData[ch]?.notes,
  );

  if (activeChannels.length === 0) return null;

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-amber">
        Sensory Impressions
      </h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {activeChannels.map((channel) => {
          const ch = sensoryData[channel];
          const intensity = ch?.intensity ?? 0;
          return (
            <Card key={channel} className="border-void-border bg-void p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-semibold text-white">{CHANNEL_LABELS[channel]}</p>
                {intensity > 0 && (
                  <span className="text-xs text-amber">{intensity}/10</span>
                )}
              </div>
              {intensity > 0 && (
                <div className="mb-2 h-1 overflow-hidden rounded-full bg-void-border">
                  <div
                    className="h-full rounded-full bg-amber/60"
                    style={{ width: `${intensity * 10}%` }}
                  />
                </div>
              )}
              {ch?.notes && (
                <p className="text-xs leading-relaxed text-ash">{ch.notes}</p>
              )}
            </Card>
          );
        })}
      </div>
    </section>
  );
}

export default async function ReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const report = await getReport(id);

  if (!report) notFound();

  // Only author or public reports
  if (report.author_id !== user.id && !report.is_public) notFound();

  const isDetailed = report.capture_mode === 'detailed';
  const bt = report.blockchain_timestamp;

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      {/* Back nav */}
      <Link
        href="/pds"
        className="flex items-center gap-2 text-sm text-ash transition-colors hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Reports
      </Link>

      {/* Report header */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {isDetailed ? (
            <Badge variant="secondary" className="gap-1">
              <FlaskConical className="h-3 w-3" />
              Detailed Report
            </Badge>
          ) : (
            <Badge variant="outline" className="gap-1">
              <Zap className="h-3 w-3" />
              Field Capture
            </Badge>
          )}
          {report.is_public && (
            <Badge variant="outline" className="text-ash">
              Public
            </Badge>
          )}
          {report.project && (
            <Link href={`/projects/${report.project.id}`}>
              <Badge variant="secondary" className="gap-1 hover:bg-void-border">
                {report.project.name}
                <ExternalLink className="h-2.5 w-2.5" />
              </Badge>
            </Link>
          )}
        </div>

        {/* Date / time / location */}
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          <span className="flex items-center gap-1 text-sm text-white">
            <Calendar className="h-3.5 w-3.5 text-ash" />
            {new Date(report.session_date).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </span>
          {report.session_time && (
            <span className="flex items-center gap-1 text-sm text-ash">
              <Clock className="h-3.5 w-3.5" />
              {report.session_time}
            </span>
          )}
          {report.location && (
            <span className="flex items-center gap-1 text-sm text-ash">
              <MapPin className="h-3.5 w-3.5" />
              {report.location}
            </span>
          )}
          {report.duration_minutes && (
            <span className="flex items-center gap-1 text-sm text-ash">
              <Timer className="h-3.5 w-3.5" />
              {report.duration_minutes} min
            </span>
          )}
        </div>

        {/* Confidence */}
        <div className="max-w-xs">
          <ConfidenceBar value={report.confidence} />
        </div>

        {/* Protocol */}
        {report.protocol && (
          <p className="text-xs text-ash">
            <span className="font-medium text-white">Protocol:</span> {report.protocol}
          </p>
        )}
      </div>

      {/* Blockchain timestamp */}
      <AnchorBadge
        status={bt?.anchor_status ?? null}
        chain={bt?.anchor_chain ?? null}
        tx={bt?.anchor_tx ?? null}
      />

      {/* Pre-session state */}
      {report.pre_session_state && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-amber">
            Pre-session State
          </h2>
          <p className="rounded-md border border-void-border bg-void-lighter px-4 py-3 text-sm leading-relaxed text-ash">
            {report.pre_session_state}
          </p>
        </section>
      )}

      {/* Sensory data */}
      <SensorySection sensoryData={report.sensory_data} />

      {/* Narrative */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-amber">Narrative</h2>
        <div className="rounded-md border border-void-border bg-void-lighter px-4 py-4">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-white">
            {report.narrative}
          </p>
        </div>
      </section>

      {/* Tags */}
      {report.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {report.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs text-ash">
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {/* Provenance footer */}
      <Card className="border-void-border bg-void p-4">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-ash">
          Provenance
        </p>
        <p className="break-all font-mono text-xs text-ash/70">
          {report.hash_algorithm}: {report.content_hash}
        </p>
        <p className="mt-1 text-xs text-ash/50">
          Submitted:{' '}
          {new Date(report.created_at).toLocaleString('en-US', {
            dateStyle: 'medium',
            timeStyle: 'short',
          })}
        </p>
      </Card>
    </div>
  );
}
