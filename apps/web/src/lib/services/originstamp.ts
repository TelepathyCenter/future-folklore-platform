/**
 * OriginStamp API client.
 *
 * Submits SHA-256 hashes to OriginStamp for blockchain anchoring.
 * Falls back gracefully when ORIGINSTAMP_API_KEY is not configured.
 *
 * API docs: https://docs.originstamp.com/guide/gettingstarted.html
 */

const ORIGINSTAMP_API_BASE = 'https://api.originstamp.com/v4';

/** currency_id -> readable chain name */
const CURRENCY_NAMES: Record<number, string> = {
  0: 'bitcoin',
  3: 'ethereum',
};

interface OriginStampTimestampData {
  currency_id: number;
  private_key: string;
  seed_id: string;
  /** 0: not broadcasted, 1: in tx (unconfirmed), 2: in block, 3: fully confirmed */
  submit_status: number;
  /** Unix ms */
  timestamp: number;
  transaction: string | null;
}

interface OriginStampApiResponse {
  error_code: number;
  error_message: string | null;
  data: {
    comment: string | null;
    created: boolean;
    date_created: number;
    hash_string: string;
    timestamps: OriginStampTimestampData[];
  } | null;
}

export interface TimestampReceipt {
  submitted: boolean;
  anchored: boolean;
  anchorChain: string | null;
  anchorTx: string | null;
  anchoredAt: Date | null;
  /** OriginStamp submit_status (0-3); null if not submitted */
  submitStatus: number | null;
  error: string | null;
}

function getApiKey(): string | null {
  return process.env.ORIGINSTAMP_API_KEY ?? null;
}

function extractAnchorInfo(timestamps: OriginStampTimestampData[]): {
  anchored: boolean;
  anchorChain: string | null;
  anchorTx: string | null;
  anchoredAt: Date | null;
  submitStatus: number | null;
} {
  // Find the first entry with a confirmed block (submit_status >= 2) and a tx hash
  const confirmed = timestamps.find(
    (t) => t.submit_status >= 2 && t.transaction,
  );

  // Best overall submit_status across all chains
  const bestStatus =
    timestamps.length > 0
      ? timestamps.reduce((max, t) => Math.max(max, t.submit_status), -1)
      : null;

  return {
    anchored: !!confirmed,
    anchorChain: confirmed
      ? (CURRENCY_NAMES[confirmed.currency_id] ?? 'blockchain')
      : null,
    anchorTx: confirmed?.transaction ?? null,
    anchoredAt: confirmed ? new Date(confirmed.timestamp) : null,
    submitStatus: bestStatus !== null && bestStatus >= 0 ? bestStatus : null,
  };
}

/**
 * Submit a hash to OriginStamp for blockchain anchoring.
 * Returns immediately — OriginStamp batches hashes and anchors them periodically.
 */
export async function submitHash(
  hashHex: string,
  comment = '',
): Promise<TimestampReceipt> {
  const apiKey = getApiKey();

  if (!apiKey) {
    console.warn(
      '[OriginStamp] ORIGINSTAMP_API_KEY not configured — skipping blockchain anchoring',
    );
    return {
      submitted: false,
      anchored: false,
      anchorChain: null,
      anchorTx: null,
      anchoredAt: null,
      submitStatus: null,
      error: 'API key not configured',
    };
  }

  try {
    const res = await fetch(`${ORIGINSTAMP_API_BASE}/timestamp/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: apiKey,
      },
      body: JSON.stringify({ comment, hash_string: hashHex }),
    });

    const json: OriginStampApiResponse = await res.json();

    if (json.error_code !== 0 || !json.data) {
      return {
        submitted: false,
        anchored: false,
        anchorChain: null,
        anchorTx: null,
        anchoredAt: null,
        submitStatus: null,
        error: json.error_message ?? 'Unknown OriginStamp error',
      };
    }

    const anchorInfo = extractAnchorInfo(json.data.timestamps);

    return {
      submitted: true,
      ...anchorInfo,
      error: null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Network error';
    console.error('[OriginStamp] submitHash failed:', message);
    return {
      submitted: false,
      anchored: false,
      anchorChain: null,
      anchorTx: null,
      anchoredAt: null,
      submitStatus: null,
      error: message,
    };
  }
}

/**
 * Check the current anchoring status of a previously submitted hash.
 */
export async function getTimestampStatus(
  hashHex: string,
): Promise<TimestampReceipt> {
  const apiKey = getApiKey();

  if (!apiKey) {
    return {
      submitted: false,
      anchored: false,
      anchorChain: null,
      anchorTx: null,
      anchoredAt: null,
      submitStatus: null,
      error: 'API key not configured',
    };
  }

  try {
    const res = await fetch(
      `${ORIGINSTAMP_API_BASE}/timestamp/${encodeURIComponent(hashHex)}`,
      { headers: { Authorization: apiKey } },
    );

    const json: OriginStampApiResponse = await res.json();

    if (json.error_code !== 0 || !json.data) {
      return {
        submitted: false,
        anchored: false,
        anchorChain: null,
        anchorTx: null,
        anchoredAt: null,
        submitStatus: null,
        error: json.error_message ?? 'Unknown OriginStamp error',
      };
    }

    const anchorInfo = extractAnchorInfo(json.data.timestamps);

    return {
      submitted: true,
      ...anchorInfo,
      error: null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Network error';
    console.error('[OriginStamp] getTimestampStatus failed:', message);
    return {
      submitted: false,
      anchored: false,
      anchorChain: null,
      anchorTx: null,
      anchoredAt: null,
      submitStatus: null,
      error: message,
    };
  }
}
