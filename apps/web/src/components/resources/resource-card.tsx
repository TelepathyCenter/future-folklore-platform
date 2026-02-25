import {
  FileText,
  Image as ImageIcon,
  Database,
  Video,
  ExternalLink,
  File,
  Download,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  RESOURCE_TYPE_LABELS,
  RESOURCE_TYPE_BADGE_VARIANT,
} from '@future-folklore-platform/shared';
import type { ResourceType } from '@future-folklore-platform/shared';
import type { ResourceWithMeta } from '@/lib/queries/resources';

const TYPE_ICON_MAP: Record<string, React.ElementType> = {
  document: FileText,
  image: ImageIcon,
  dataset: Database,
  video: Video,
  link: ExternalLink,
  other: File,
};

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function timeAgo(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

interface ResourceCardProps {
  resource: ResourceWithMeta;
  onSelect?: (resource: ResourceWithMeta) => void;
}

export function ResourceCard({ resource, onSelect }: ResourceCardProps) {
  const Icon = TYPE_ICON_MAP[resource.resource_type] ?? File;
  const profile = resource.profiles;
  const version = resource.current_version;

  return (
    <button
      type="button"
      onClick={() => onSelect?.(resource)}
      className="w-full rounded-lg border border-void-border bg-void-light p-4 text-left transition-colors hover:border-amber/30 hover:bg-void-lighter"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-void">
          <Icon className="h-5 w-5 text-ash-light" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-medium text-white">
            {resource.title}
          </h3>
          {resource.description && (
            <p className="mt-0.5 line-clamp-2 text-xs text-ash">
              {resource.description}
            </p>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <Badge
              variant={
                RESOURCE_TYPE_BADGE_VARIANT[
                  resource.resource_type as ResourceType
                ]
              }
              className="text-[10px]"
            >
              {RESOURCE_TYPE_LABELS[resource.resource_type as ResourceType]}
            </Badge>
            {resource.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-[10px]">
                {tag}
              </Badge>
            ))}
          </div>

          <div className="mt-2 flex items-center gap-2 text-[11px] text-ash">
            <span>{profile.display_name ?? profile.username}</span>
            <span>&middot;</span>
            <time dateTime={resource.created_at}>
              {timeAgo(resource.created_at)}
            </time>
            {version && (
              <>
                <span>&middot;</span>
                <span className="flex items-center gap-0.5">
                  <Download className="h-3 w-3" />
                  {formatBytes(version.file_size_bytes)}
                </span>
              </>
            )}
            {resource.resource_type === 'link' && resource.external_url && (
              <>
                <span>&middot;</span>
                <span className="flex items-center gap-0.5 text-electric">
                  <ExternalLink className="h-3 w-3" />
                  Link
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}
