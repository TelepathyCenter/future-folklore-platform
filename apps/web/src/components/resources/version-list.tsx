'use client';

import { useState, useTransition } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { getSignedUrl } from '@/lib/actions/resources';
import type { Tables } from '@future-folklore-platform/db';

type VersionWithProfile = Tables<'resource_versions'> & {
  profiles: Pick<
    Tables<'profiles'>,
    'id' | 'username' | 'display_name' | 'avatar_url'
  >;
};

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function DownloadButton({ storagePath }: { storagePath: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleDownload = () => {
    setError(null);
    startTransition(async () => {
      const result = await getSignedUrl(storagePath);
      if (result.error) {
        setError(result.error);
      } else if (result.url) {
        window.open(result.url, '_blank');
      }
    });
  };

  return (
    <div>
      <Button
        variant="outline"
        size="sm"
        onClick={handleDownload}
        disabled={isPending}
        className="h-7 text-xs"
      >
        {isPending ? (
          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
        ) : (
          <Download className="mr-1 h-3 w-3" />
        )}
        Download
      </Button>
      {error && <p className="mt-1 text-[10px] text-error">{error}</p>}
    </div>
  );
}

export function VersionList({ versions }: { versions: VersionWithProfile[] }) {
  if (versions.length === 0) {
    return <p className="text-sm text-ash">No versions uploaded.</p>;
  }

  return (
    <div className="space-y-2">
      {versions.map((version) => {
        const profile = version.profiles;
        const initials = profile.display_name
          ? profile.display_name
              .split(' ')
              .map((n: string) => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2)
          : profile.username.slice(0, 2).toUpperCase();

        return (
          <div
            key={version.id}
            className="flex items-center justify-between gap-3 rounded-md border border-void-border bg-void p-3"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="shrink-0 rounded bg-void-lighter px-1.5 py-0.5 text-xs font-mono text-ash-light">
                  v{version.version_number}
                </span>
                <span className="truncate text-sm text-white">
                  {version.file_name}
                </span>
                <span className="shrink-0 text-xs text-ash">
                  {formatBytes(version.file_size_bytes)}
                </span>
              </div>
              {version.upload_notes && (
                <p className="mt-1 text-xs text-ash">{version.upload_notes}</p>
              )}
              <div className="mt-1 flex items-center gap-2 text-[11px] text-ash">
                <Avatar className="h-4 w-4">
                  {profile.avatar_url && (
                    <AvatarImage
                      src={profile.avatar_url}
                      alt={profile.display_name ?? profile.username}
                    />
                  )}
                  <AvatarFallback className="text-[7px]">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span>{profile.display_name ?? profile.username}</span>
                <span>&middot;</span>
                <time dateTime={version.created_at}>
                  {formatDate(version.created_at)}
                </time>
              </div>
            </div>
            <DownloadButton storagePath={version.storage_path} />
          </div>
        );
      })}
    </div>
  );
}
