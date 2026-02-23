export const NODE_TYPES = [
  'profile',
  'project',
  'organization',
  'concept',
  'call',
] as const;

export type NodeType = (typeof NODE_TYPES)[number];

export const NODE_TYPE_LABELS: Record<NodeType, string> = {
  profile: 'Profile',
  project: 'Project',
  organization: 'Organization',
  concept: 'Concept',
  call: 'Call',
};

export const NODE_TYPE_COLORS: Record<NodeType, string> = {
  profile: 'amber',
  project: 'electric',
  organization: 'ash',
  concept: 'amber',
  call: 'electric',
};

export const EDGE_TYPES = [
  'works_on',
  'member_of',
  'interested_in',
  'expert_in',
  'mentors',
  'collaborates_with',
  'explores',
  'funded_by',
  'builds_on',
  'related_to',
  'subtopic_of',
  'related_concept',
  'discussed_in',
  'presented_at',
] as const;

export type EdgeType = (typeof EDGE_TYPES)[number];

export const EDGE_TYPE_LABELS: Record<EdgeType, string> = {
  works_on: 'Works On',
  member_of: 'Member Of',
  interested_in: 'Interested In',
  expert_in: 'Expert In',
  mentors: 'Mentors',
  collaborates_with: 'Collaborates With',
  explores: 'Explores',
  funded_by: 'Funded By',
  builds_on: 'Builds On',
  related_to: 'Related To',
  subtopic_of: 'Subtopic Of',
  related_concept: 'Related Concept',
  discussed_in: 'Discussed In',
  presented_at: 'Presented At',
};

export const EDGE_TYPE_DESCRIPTIONS: Record<EdgeType, string> = {
  works_on: 'Researcher is actively involved in this project',
  member_of: 'Profile belongs to this organization',
  interested_in: 'Self-declared interest in a topic',
  expert_in: 'Self-declared expertise in a topic',
  mentors: 'Mentorship relationship between researchers',
  collaborates_with: 'Active collaboration between researchers',
  explores: 'Project investigates this research topic',
  funded_by: 'Project receives funding from this organization',
  builds_on: 'Project builds on or extends another project',
  related_to: 'General association between two entities',
  subtopic_of: 'Concept is a subtopic of a broader concept',
  related_concept: 'Lateral relationship between concepts',
  discussed_in: 'Topic was discussed during this call',
  presented_at: 'Researcher presented at this event',
};

export const EDGE_TYPE_BADGE_VARIANT: Record<
  EdgeType,
  'default' | 'secondary' | 'electric' | 'outline'
> = {
  works_on: 'electric',
  member_of: 'secondary',
  interested_in: 'outline',
  expert_in: 'default',
  mentors: 'default',
  collaborates_with: 'electric',
  explores: 'electric',
  funded_by: 'secondary',
  builds_on: 'outline',
  related_to: 'outline',
  subtopic_of: 'secondary',
  related_concept: 'outline',
  discussed_in: 'electric',
  presented_at: 'default',
};

/**
 * Validity rules for each edge type: which node types can be source/target.
 */
export const EDGE_TYPE_RULES: Record<
  EdgeType,
  { source: readonly NodeType[]; target: readonly NodeType[] }
> = {
  works_on: { source: ['profile'], target: ['project'] },
  member_of: { source: ['profile'], target: ['organization'] },
  interested_in: { source: ['profile'], target: ['concept'] },
  expert_in: { source: ['profile'], target: ['concept'] },
  mentors: { source: ['profile'], target: ['profile'] },
  collaborates_with: { source: ['profile'], target: ['profile'] },
  explores: { source: ['project'], target: ['concept'] },
  funded_by: { source: ['project'], target: ['organization'] },
  builds_on: { source: ['project'], target: ['project'] },
  related_to: {
    source: ['profile', 'project', 'organization', 'concept', 'call'],
    target: ['profile', 'project', 'organization', 'concept', 'call'],
  },
  subtopic_of: { source: ['concept'], target: ['concept'] },
  related_concept: { source: ['concept'], target: ['concept'] },
  discussed_in: { source: ['concept'], target: ['call'] },
  presented_at: { source: ['profile'], target: ['call'] },
};

/**
 * Returns valid edge types for a given source→target node type pair.
 */
export function getValidEdgeTypes(
  sourceType: NodeType,
  targetType: NodeType,
): EdgeType[] {
  return EDGE_TYPES.filter((edgeType) => {
    const rule = EDGE_TYPE_RULES[edgeType];
    return rule.source.includes(sourceType) && rule.target.includes(targetType);
  });
}
