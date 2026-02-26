export const TIMESTAMP_CONTENT_TYPES = [
  'milestone',
  'update',
  'resource',
] as const;

export type TimestampContentType = (typeof TIMESTAMP_CONTENT_TYPES)[number];

export const ANCHOR_STATUSES = ['pending', 'anchored', 'verified'] as const;

export type AnchorStatus = (typeof ANCHOR_STATUSES)[number];

export const ANCHOR_STATUS_LABELS: Record<AnchorStatus, string> = {
  pending: 'Anchoring...',
  anchored: 'Anchored',
  verified: 'Verified',
};

export const ANCHOR_STATUS_BADGE_VARIANT: Record<
  AnchorStatus,
  'secondary' | 'electric' | 'success'
> = {
  pending: 'secondary',
  anchored: 'electric',
  verified: 'success',
};
