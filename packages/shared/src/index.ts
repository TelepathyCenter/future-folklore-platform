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
  PROJECT_STAGES,
  FUNDING_STAGE_LABELS,
  FUNDING_STAGE_BADGE_VARIANT,
  EOI_STATUSES,
  EOI_STATUS_LABELS,
  EOI_STATUS_BADGE_VARIANT,
} from './project';
export type {
  ProjectStatus,
  ProjectVisibility,
  DomainTag,
  MembershipRole,
  FundingStage,
  EoiStatus,
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
  MILESTONE_STATUSES,
  MILESTONE_STATUS_LABELS,
  MILESTONE_STATUS_BADGE_VARIANT,
} from './milestone';
export type { MilestoneStatus } from './milestone';

export {
  UPDATE_STATUSES,
  UPDATE_STATUS_LABELS,
  UPDATE_STATUS_BADGE_VARIANT,
} from './update';
export type { UpdateStatus } from './update';

export {
  RESOURCE_TYPES,
  RESOURCE_TYPE_LABELS,
  RESOURCE_TYPE_BADGE_VARIANT,
  RESOURCE_TYPE_ICONS,
  RESOURCE_TYPE_ACCEPT,
  MAX_FILE_SIZE_BYTES,
  MAX_FILE_SIZE_LABEL,
} from './resource';
export type { ResourceType } from './resource';

export {
  TIMESTAMP_CONTENT_TYPES,
  ANCHOR_STATUSES,
  ANCHOR_STATUS_LABELS,
  ANCHOR_STATUS_BADGE_VARIANT,
} from './timestamp';
export type { TimestampContentType, AnchorStatus } from './timestamp';

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
