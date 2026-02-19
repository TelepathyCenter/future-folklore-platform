export const PROJECT_STATUSES = [
  'active',
  'incubating',
  'paused',
  'completed',
] as const;

export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  active: 'Active',
  incubating: 'Incubating',
  paused: 'Paused',
  completed: 'Completed',
};

export const PROJECT_STATUS_BADGE_VARIANT: Record<
  ProjectStatus,
  'success' | 'electric' | 'warning' | 'secondary'
> = {
  active: 'success',
  incubating: 'electric',
  paused: 'warning',
  completed: 'secondary',
};

export const PROJECT_VISIBILITIES = [
  'public',
  'community',
  'incubator',
] as const;

export type ProjectVisibility = (typeof PROJECT_VISIBILITIES)[number];

export const DOMAIN_TAGS = [
  'consciousness',
  'remote-viewing',
  'psi',
  'quantum-biology',
  'ai-agents',
  'blockchain',
  'desci',
  'phenomenology',
  'neuroscience',
  'philosophy-of-mind',
] as const;

export type DomainTag = (typeof DOMAIN_TAGS)[number];

export const MEMBERSHIP_ROLES = [
  'lead',
  'member',
  'advisor',
  'observer',
] as const;

export type MembershipRole = (typeof MEMBERSHIP_ROLES)[number];

export const MEMBERSHIP_ROLE_LABELS: Record<MembershipRole, string> = {
  lead: 'Lead',
  member: 'Member',
  advisor: 'Advisor',
  observer: 'Observer',
};
