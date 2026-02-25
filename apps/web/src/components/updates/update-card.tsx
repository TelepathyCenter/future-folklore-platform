import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import type { UpdateWithMeta } from '@/lib/queries/updates';

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

export function UpdateCard({ update }: { update: UpdateWithMeta }) {
  const profile = update.profiles;
  const project = update.projects;

  const initials = profile.display_name
    ? profile.display_name
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : profile.username.slice(0, 2).toUpperCase();

  const timestamp = update.published_at ?? update.created_at;

  return (
    <div className="rounded-lg border border-void-border bg-void-light p-4">
      <div className="flex items-start gap-3">
        <Link href={`/profile/${profile.username}`} className="shrink-0">
          <Avatar className="h-8 w-8">
            {profile.avatar_url && (
              <AvatarImage
                src={profile.avatar_url}
                alt={profile.display_name ?? profile.username}
              />
            )}
            <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
          </Avatar>
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-xs text-ash">
            <Link
              href={`/profile/${profile.username}`}
              className="font-medium text-ash-light hover:text-white transition-colors"
            >
              {profile.display_name ?? profile.username}
            </Link>
            <span>&middot;</span>
            <time dateTime={timestamp}>{timeAgo(timestamp)}</time>
            {project && (
              <>
                <span>&middot;</span>
                <Link
                  href={`/projects/${project.id}`}
                  className="text-electric hover:underline"
                >
                  {project.name}
                </Link>
              </>
            )}
          </div>

          <h3 className="mt-1 text-sm font-medium text-white">
            {update.title}
          </h3>

          {update.body && (
            <p className="mt-1 text-sm text-ash-light line-clamp-3">
              {update.body}
            </p>
          )}

          {update.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {update.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-[10px]">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
