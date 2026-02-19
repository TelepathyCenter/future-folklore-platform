import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { PageContainer } from '@/components/layout/page-container';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { RsvpPanel } from '@/components/calls/rsvp-panel';
import { NotesEditor } from '@/components/calls/notes-editor';
import { IcsDownloadButton } from '@/components/calls/ics-download-button';
import { getCall } from '@/lib/queries/calls';
import { getCurrentProfile } from '@/lib/queries/profiles';
import {
  CALL_STATUS_LABELS,
  CALL_STATUS_BADGE_VARIANT,
} from '@future-folklore-platform/shared';
import { formatCallDatetime, formatDuration } from '@/lib/utils/calls';

export default async function CallDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [call, currentProfile] = await Promise.all([
    getCall(id),
    getCurrentProfile(),
  ]);

  if (!call) return notFound();

  const isCreator = currentProfile?.id === call.created_by;

  return (
    <PageContainer>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant={CALL_STATUS_BADGE_VARIANT[call.status]}>
                {CALL_STATUS_LABELS[call.status]}
              </Badge>
              {call.project && (
                <Link href={`/projects/${call.project.id}`}>
                  <Badge variant="outline">{call.project.name}</Badge>
                </Link>
              )}
            </div>
            <h1 className="text-2xl font-bold text-white">{call.title}</h1>
            <p className="text-sm text-ash">
              {formatCallDatetime(call.scheduled_at)} &middot;{' '}
              {formatDuration(call.duration_minutes)}
            </p>
            {call.creator && (
              <p className="text-xs text-ash">
                Hosted by{' '}
                <Link
                  href={`/profile/${call.creator.username}`}
                  className="text-electric hover:underline"
                >
                  {call.creator.display_name ?? call.creator.username}
                </Link>
              </p>
            )}
          </div>
          <IcsDownloadButton call={call} />
        </div>

        {call.description && (
          <p className="text-sm text-ash-light">{call.description}</p>
        )}

        {call.video_link && (
          <a
            href={call.video_link}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-sm text-electric hover:underline"
          >
            <ExternalLink className="h-3 w-3" />
            Join video call
          </a>
        )}

        <Separator />

        <RsvpPanel
          callId={call.id}
          rsvps={call.rsvps}
          myRsvp={call.my_rsvp}
          currentProfileId={currentProfile?.id ?? null}
        />

        <Separator />

        <NotesEditor
          callId={call.id}
          initialNotes={call.notes ?? ''}
          canEdit={isCreator}
        />
      </div>
    </PageContainer>
  );
}
