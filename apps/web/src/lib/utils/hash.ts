/**
 * SHA-256 content hashing for milestone tamper detection.
 * Uses the Web Crypto API (available in Node.js and browsers).
 */

export interface MilestoneHashInput {
  title: string;
  description: string | null;
  evidence_url: string | null;
  created_at: string;
}

/**
 * Build a deterministic canonical string from milestone fields.
 * Keys are alphabetically sorted, nulls normalized to empty strings.
 */
export function buildCanonicalContent(input: MilestoneHashInput): string {
  const canonical = {
    created_at: input.created_at,
    description: input.description ?? '',
    evidence_url: input.evidence_url ?? '',
    title: input.title,
  };
  return JSON.stringify(canonical);
}

/**
 * Compute SHA-256 hex digest of the given string.
 */
export async function sha256Hex(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Hash milestone content using SHA-256.
 */
export async function hashMilestoneContent(
  input: MilestoneHashInput,
): Promise<string> {
  const canonical = buildCanonicalContent(input);
  return sha256Hex(canonical);
}

/**
 * Verify that a milestone's stored hash matches a recomputed hash.
 */
export async function verifyMilestoneHash(
  input: MilestoneHashInput,
  storedHash: string,
): Promise<boolean> {
  const computedHash = await hashMilestoneContent(input);
  return computedHash === storedHash;
}
