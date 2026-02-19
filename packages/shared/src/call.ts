export const CALL_STATUSES = [
  'scheduled',
  'live',
  'completed',
  'cancelled',
] as const;

export type CallStatus = (typeof CALL_STATUSES)[number];

export const CALL_STATUS_LABELS: Record<CallStatus, string> = {
  scheduled: 'Scheduled',
  live: 'Live',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export const CALL_STATUS_BADGE_VARIANT: Record<
  CallStatus,
  'electric' | 'success' | 'secondary' | 'destructive'
> = {
  scheduled: 'electric',
  live: 'success',
  completed: 'secondary',
  cancelled: 'destructive',
};

export const RSVP_STATUSES = ['going', 'not_going', 'maybe'] as const;

export type RsvpStatus = (typeof RSVP_STATUSES)[number];

export const RSVP_STATUS_LABELS: Record<RsvpStatus, string> = {
  going: 'Going',
  not_going: 'Not Going',
  maybe: 'Maybe',
};
