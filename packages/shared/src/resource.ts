export const RESOURCE_TYPES = [
  'document',
  'image',
  'dataset',
  'video',
  'link',
  'other',
] as const;

export type ResourceType = (typeof RESOURCE_TYPES)[number];

export const RESOURCE_TYPE_LABELS: Record<ResourceType, string> = {
  document: 'Document',
  image: 'Image',
  dataset: 'Dataset',
  video: 'Video',
  link: 'Link',
  other: 'Other',
};

export const RESOURCE_TYPE_BADGE_VARIANT: Record<
  ResourceType,
  'secondary' | 'outline' | 'electric' | 'success'
> = {
  document: 'secondary',
  image: 'electric',
  dataset: 'success',
  video: 'outline',
  link: 'outline',
  other: 'secondary',
};

/** Lucide icon names for each resource type */
export const RESOURCE_TYPE_ICONS: Record<ResourceType, string> = {
  document: 'FileText',
  image: 'Image',
  dataset: 'Database',
  video: 'Video',
  link: 'ExternalLink',
  other: 'File',
};

/** File input accept strings per resource type (empty = no file upload) */
export const RESOURCE_TYPE_ACCEPT: Record<ResourceType, string> = {
  document: '.pdf,.doc,.docx,.txt,.md,.csv,.xls,.xlsx,.pptx,.rtf',
  image: 'image/*',
  dataset: '.csv,.json,.xml,.parquet,.sqlite,.tsv,.zip',
  video: 'video/*',
  link: '',
  other: '*/*',
};

/** 50 MB in bytes */
export const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;

export const MAX_FILE_SIZE_LABEL = '50 MB';
