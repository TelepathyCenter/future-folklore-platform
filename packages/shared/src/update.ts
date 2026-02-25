export const UPDATE_STATUSES = ['draft', 'published'] as const;

export type UpdateStatus = (typeof UPDATE_STATUSES)[number];

export const UPDATE_STATUS_LABELS: Record<UpdateStatus, string> = {
  draft: 'Draft',
  published: 'Published',
};

export const UPDATE_STATUS_BADGE_VARIANT: Record<
  UpdateStatus,
  'secondary' | 'success'
> = {
  draft: 'secondary',
  published: 'success',
};
