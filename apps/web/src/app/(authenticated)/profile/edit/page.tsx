import { redirect } from 'next/navigation';
import { PageContainer } from '@/components/layout/page-container';
import { ProfileEditForm } from '@/components/profile/profile-edit-form';
import { getCurrentProfile } from '@/lib/queries/profiles';

export default async function ProfileEditPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const [profile, params] = await Promise.all([
    getCurrentProfile(),
    searchParams,
  ]);

  if (!profile) {
    return redirect('/login');
  }

  return (
    <PageContainer className="max-w-2xl">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Edit profile</h1>
          <p className="text-sm text-ash">
            Update your community profile information
          </p>
        </div>
        {params.error && (
          <p className="rounded-md bg-error/10 p-3 text-sm text-error">
            {params.error}
          </p>
        )}
        <ProfileEditForm profile={profile} />
      </div>
    </PageContainer>
  );
}
