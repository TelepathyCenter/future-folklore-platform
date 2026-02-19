import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Pencil } from 'lucide-react';
import { PageContainer } from '@/components/layout/page-container';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { getCurrentProfile } from '@/lib/queries/profiles';
import { signOut } from '@/lib/auth/actions';

export default async function ProfilePage() {
  const profile = await getCurrentProfile();

  if (!profile) {
    return redirect('/login');
  }

  const initials = profile.display_name
    ? profile.display_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : profile.username.slice(0, 2).toUpperCase();

  return (
    <PageContainer>
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              {profile.avatar_url && (
                <AvatarImage
                  src={profile.avatar_url}
                  alt={profile.display_name ?? profile.username}
                />
              )}
              <AvatarFallback className="text-lg">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold text-white">
                {profile.display_name ?? profile.username}
              </h1>
              <p className="text-sm text-ash">@{profile.username}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href="/profile/edit">
              <Button variant="outline" size="sm">
                <Pencil className="mr-1 h-3 w-3" />
                Edit
              </Button>
            </Link>
            <form action={signOut}>
              <Button variant="ghost" size="sm" type="submit">
                Sign out
              </Button>
            </form>
          </div>
        </div>

        <Separator />

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-4">
            <div>
              <p className="text-xs font-medium uppercase text-ash">Role</p>
              <Badge variant="secondary" className="mt-1 capitalize">
                {profile.role}
              </Badge>
            </div>
            <div>
              <p className="text-xs font-medium uppercase text-ash">
                Visibility
              </p>
              <Badge variant="electric" className="mt-1 capitalize">
                {profile.visibility}
              </Badge>
            </div>
          </div>
          <div className="space-y-4">
            {profile.bio && (
              <div>
                <p className="text-xs font-medium uppercase text-ash">Bio</p>
                <p className="mt-1 text-sm text-ash-light">{profile.bio}</p>
              </div>
            )}
            {profile.expertise_tags.length > 0 && (
              <div>
                <p className="text-xs font-medium uppercase text-ash">
                  Expertise
                </p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {profile.expertise_tags.map((tag) => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
