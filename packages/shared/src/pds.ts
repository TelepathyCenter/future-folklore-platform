/**
 * FF-PDS — Phenomenological Data Standard v1.0
 * Zod schemas and TypeScript types for experiential report capture.
 */

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Sensory channel
// ---------------------------------------------------------------------------

export const SensoryChannelSchema = z.object({
  intensity: z.number().min(0).max(10).optional(),
  notes: z.string().max(500).optional(),
});

export type SensoryChannel = z.infer<typeof SensoryChannelSchema>;

export const SensoryDataSchema = z.object({
  visual: SensoryChannelSchema.optional(),
  auditory: SensoryChannelSchema.optional(),
  tactile: SensoryChannelSchema.optional(),
  olfactory: SensoryChannelSchema.optional(),
  emotional: SensoryChannelSchema.optional(),
  proprioceptive: SensoryChannelSchema.optional(),
});

export type SensoryData = z.infer<typeof SensoryDataSchema>;

export const SENSORY_CHANNELS = [
  'visual',
  'auditory',
  'tactile',
  'olfactory',
  'emotional',
  'proprioceptive',
] as const;

export type SensoryChannel_Key = (typeof SENSORY_CHANNELS)[number];

// ---------------------------------------------------------------------------
// Rapid Field Capture (mobile-first, ≤5 min)
// ---------------------------------------------------------------------------

export const RapidCaptureSchema = z.object({
  session_date: z.string().date('Invalid date — use YYYY-MM-DD'),
  location: z.string().max(200).optional(),
  narrative: z
    .string()
    .min(10, 'Please describe what happened (at least 10 characters)')
    .max(5000),
  confidence: z.number().int().min(1).max(10),
  tags: z.array(z.string().max(50)).max(10).default([]),
  project_id: z.string().uuid().optional().or(z.literal('')),
  is_public: z.boolean().default(false),
});

export type RapidCaptureInput = z.infer<typeof RapidCaptureSchema>;

// ---------------------------------------------------------------------------
// Detailed Research Capture (full schema)
// ---------------------------------------------------------------------------

export const DetailedCaptureSchema = z.object({
  session_date: z.string().date('Invalid date — use YYYY-MM-DD'),
  session_time: z
    .string()
    .regex(/^\d{2}:\d{2}$/, 'Use HH:MM format')
    .optional()
    .or(z.literal('')),
  location: z.string().max(200).optional(),
  protocol: z.string().max(200).optional(),
  pre_session_state: z.string().max(1000).optional(),
  sensory_data: SensoryDataSchema.default({}),
  narrative: z
    .string()
    .min(10, 'Please describe what happened (at least 10 characters)')
    .max(10000),
  duration_minutes: z.number().int().min(1).max(1440).optional(),
  confidence: z.number().int().min(1).max(10),
  tags: z.array(z.string().max(50)).max(20).default([]),
  project_id: z.string().uuid().optional().or(z.literal('')),
  is_public: z.boolean().default(false),
});

export type DetailedCaptureInput = z.infer<typeof DetailedCaptureSchema>;

// ---------------------------------------------------------------------------
// Report shape returned from DB queries
// ---------------------------------------------------------------------------

export interface PdsReport {
  id: string;
  author_id: string;
  project_id: string | null;
  capture_mode: 'rapid' | 'detailed';
  session_date: string;
  session_time: string | null;
  location: string | null;
  protocol: string | null;
  pre_session_state: string | null;
  sensory_data: SensoryData;
  narrative: string;
  duration_minutes: number | null;
  confidence: number;
  tags: string[];
  content_hash: string;
  hash_algorithm: string;
  blockchain_timestamp_id: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  // Joined from profiles
  author?: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
  // Joined from projects
  project?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  // Joined from blockchain_timestamps
  blockchain_timestamp?: {
    anchor_status: 'pending' | 'anchored' | 'verified';
    anchor_chain: string | null;
    anchor_tx: string | null;
    anchored_at: string | null;
  } | null;
}

// ---------------------------------------------------------------------------
// List filters
// ---------------------------------------------------------------------------

export interface PdsListFilters {
  authorId?: string;
  projectId?: string;
  search?: string;
  tags?: string[];
  isPublic?: boolean;
  limit?: number;
  offset?: number;
}
