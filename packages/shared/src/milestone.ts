export const MILESTONE_STATUSES = ['recorded', 'anchored', 'verified'] as const;

export type MilestoneStatus = (typeof MILESTONE_STATUSES)[number];

export const MILESTONE_STATUS_LABELS: Record<MilestoneStatus, string> = {
  recorded: 'Recorded',
  anchored: 'Anchored',
  verified: 'Verified',
};

export const MILESTONE_STATUS_BADGE_VARIANT: Record<
  MilestoneStatus,
  'electric' | 'default' | 'secondary'
> = {
  recorded: 'electric',
  anchored: 'default',
  verified: 'secondary',
};
