'use client';

import { useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { upsertRsvp, removeRsvp } from '@/lib/actions/calls';
import { RSVP_STATUS_LABELS } from '@future-folklore-platform/shared';
import type { RsvpStatus } from '@future-folklore-platform/shared';
import type { CallDetail } from '@/lib/queries/calls';

interface RsvpPanelProps {
  callId: string;
  rsvps: CallDetail['rsvps'];
  myRsvp: CallDetail['my_rsvp'];
  currentProfileId: string | null;
}

export function RsvpPanel({
  callId,
  rsvps,
  myRsvp,
  currentProfileId,
}: RsvpPanelProps) {
  const [isPending, startTransition] = useTransition();

  const handleRsvp = (status: string) => {
    startTransition(async () => {
      if (myRsvp?.status === status) {
        await removeRsvp(callId);
      } else {
        await upsertRsvp(callId, status);
      }
    });
  };

  const going = rsvps.filter((r) => r.status === 'going');
  const maybe = rsvps.filter((r) => r.status === 'maybe');

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold text-white">RSVPs</h2>
        <Badge variant="secondary">{going.length} going</Badge>
        {maybe.length > 0 && (
          <Badge variant="outline">{maybe.length} maybe</Badge>
        )}
      </div>

      {currentProfileId && (
        <div className="flex gap-2">
          {(['going', 'maybe', 'not_going'] as const).map((status) => (
            <Button
              key={status}
              size="sm"
              variant={myRsvp?.status === status ? 'default' : 'outline'}
              disabled={isPending}
              onClick={() => handleRsvp(status)}
            >
              {RSVP_STATUS_LABELS[status as RsvpStatus]}
            </Button>
          ))}
        </div>
      )}

      {going.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase text-ash">Attending</p>
          <div className="flex flex-wrap gap-3">
            {going.map((rsvp) => {
              const profile = rsvp.profiles;
              const name = profile.display_name ?? profile.username;
              return (
                <div key={rsvp.id} className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    {profile.avatar_url && (
                      <AvatarImage src={profile.avatar_url} alt={name} />
                    )}
                    <AvatarFallback className="text-xs">
                      {name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-ash-light">{name}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {maybe.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase text-ash">Maybe</p>
          <div className="flex flex-wrap gap-3">
            {maybe.map((rsvp) => {
              const profile = rsvp.profiles;
              const name = profile.display_name ?? profile.username;
              return (
                <div key={rsvp.id} className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    {profile.avatar_url && (
                      <AvatarImage src={profile.avatar_url} alt={name} />
                    )}
                    <AvatarFallback className="text-xs">
                      {name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-ash-light">{name}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
