import { PageContainer } from '@/components/layout/page-container';
import { getCurrentProfile } from '@/lib/queries/profiles';

export default async function DashboardPage() {
  const profile = await getCurrentProfile();

  return (
    <PageContainer>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-ash">
            Welcome back
            {profile?.display_name ? `, ${profile.display_name}` : ''}.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-void-border bg-void-light p-6">
            <p className="text-sm text-ash">Profile completion</p>
            <p className="mt-1 text-2xl font-semibold text-white">
              {profile?.bio ? '100%' : '50%'}
            </p>
          </div>
          <div className="rounded-lg border border-void-border bg-void-light p-6">
            <p className="text-sm text-ash">Role</p>
            <p className="mt-1 text-2xl font-semibold text-amber capitalize">
              {profile?.role ?? 'observer'}
            </p>
          </div>
          <div className="rounded-lg border border-void-border bg-void-light p-6">
            <p className="text-sm text-ash">Visibility</p>
            <p className="mt-1 text-2xl font-semibold text-electric capitalize">
              {profile?.visibility ?? 'public'}
            </p>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
