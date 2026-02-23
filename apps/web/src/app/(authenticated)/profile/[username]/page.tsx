import { notFound } from 'next/navigation';
import { Plus } from 'lucide-react';
import { PageContainer } from '@/components/layout/page-container';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { getProfileByUsername } from '@/lib/queries/profiles';
import { EdgeCreatorModal } from '@/components/graph/edge-creator-modal';

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const profile = await getProfileByUsername(username);

  if (!profile) {
    return notFound();
  }

  const initials = profile.display_name
    ? profile.display_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : profile.username.slice(0, 2).toUpperCase();

  const profilePreset = {
    id: profile.id,
    nodeType: 'profile' as const,
    label: profile.display_name ?? profile.username,
  };

  return (
    <PageContainer>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
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
          <EdgeCreatorModal
            trigger={
              <Button variant="outline" size="sm">
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Add Connection
              </Button>
            }
            presetSource={profilePreset}
          />
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
