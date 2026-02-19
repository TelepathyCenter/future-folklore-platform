import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import type { Profile } from '@/lib/queries/profiles';

function getInitials(profile: Profile): string {
  if (profile.display_name) {
    return profile.display_name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }
  return profile.username.slice(0, 2).toUpperCase();
}

export function ProfileCard({ profile }: { profile: Profile }) {
  return (
    <Link href={`/profile/${profile.username}`}>
      <Card className="transition-colors hover:border-amber-muted">
        <CardContent className="flex items-start gap-4 p-4">
          <Avatar className="h-12 w-12">
            {profile.avatar_url && (
              <AvatarImage
                src={profile.avatar_url}
                alt={profile.display_name ?? profile.username}
              />
            )}
            <AvatarFallback>{getInitials(profile)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-white">
              {profile.display_name ?? profile.username}
            </p>
            <p className="text-xs text-ash">@{profile.username}</p>
            {profile.bio && (
              <p className="mt-1 line-clamp-2 text-sm text-ash-light">
                {profile.bio}
              </p>
            )}
            <div className="mt-2 flex flex-wrap gap-1">
              <Badge variant="secondary" className="capitalize">
                {profile.role}
              </Badge>
              {profile.expertise_tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
