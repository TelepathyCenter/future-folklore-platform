/**
 * @future-folklore-platform/shared
 *
 * Shared types, constants, and validation schemas used across
 * the Future Folklore Platform frontend and backend.
 */

export const APP_NAME = 'Future Folklore Platform';

export {
  PROFILE_ROLES,
  PROFILE_VISIBILITIES,
  PROFILE_ROLE_LABELS,
} from './profile';
export type { ProfileRole, ProfileVisibility } from './profile';

export {
  PROJECT_STATUSES,
  PROJECT_STATUS_LABELS,
  PROJECT_STATUS_BADGE_VARIANT,
  PROJECT_VISIBILITIES,
  DOMAIN_TAGS,
  MEMBERSHIP_ROLES,
  MEMBERSHIP_ROLE_LABELS,
} from './project';
export type {
  ProjectStatus,
  ProjectVisibility,
  DomainTag,
  MembershipRole,
} from './project';

export {
  CALL_STATUSES,
  CALL_STATUS_LABELS,
  CALL_STATUS_BADGE_VARIANT,
  RSVP_STATUSES,
  RSVP_STATUS_LABELS,
} from './call';
export type { CallStatus, RsvpStatus } from './call';

export {
  NODE_TYPES,
  NODE_TYPE_LABELS,
  NODE_TYPE_COLORS,
  EDGE_TYPES,
  EDGE_TYPE_LABELS,
  EDGE_TYPE_DESCRIPTIONS,
  EDGE_TYPE_BADGE_VARIANT,
  EDGE_TYPE_RULES,
  getValidEdgeTypes,
} from './graph';
export type { NodeType, EdgeType } from './graph';
