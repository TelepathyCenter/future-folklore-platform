export const PROFILE_ROLES = [
  'researcher',
  'investor',
  'practitioner',
  'mentor',
  'observer',
] as const;

export type ProfileRole = (typeof PROFILE_ROLES)[number];

export const PROFILE_ROLE_LABELS: Record<ProfileRole, string> = {
  researcher: 'Researcher',
  investor: 'Investor',
  practitioner: 'Practitioner',
  mentor: 'Mentor',
  observer: 'Observer',
};

export const PROFILE_VISIBILITIES = ['public', 'community', 'private'] as const;

export type ProfileVisibility = (typeof PROFILE_VISIBILITIES)[number];
