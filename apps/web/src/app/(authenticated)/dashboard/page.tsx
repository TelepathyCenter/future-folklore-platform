import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PageContainer } from '@/components/layout/page-container';
import { getCurrentProfile } from '@/lib/queries/profiles';
import { listUpdates } from '@/lib/queries/updates';
import { UpdateCard } from '@/components/updates/update-card';

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageStr } = await searchParams;
  const page = Math.max(1, parseInt(pageStr ?? '1', 10) || 1);
  const limit = 10;

  const [profile, { updates, total }] = await Promise.all([
    getCurrentProfile(),
    listUpdates({ status: 'published', page, limit }),
  ]);

  const totalPages = Math.ceil(total / limit);

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

        <div>
          <h2 className="text-lg font-semibold text-white">Activity Feed</h2>
          <p className="text-sm text-ash">
            Latest updates from across the community.
          </p>
        </div>

        {updates.length === 0 && (
          <p className="text-sm text-ash">
            No updates yet. Activity will appear here as projects post updates.
          </p>
        )}

        {updates.length > 0 && (
          <div className="space-y-3">
            {updates.map((update) => (
              <UpdateCard key={update.id} update={update} />
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4">
            {page > 1 ? (
              <Link
                href={`/dashboard?page=${page - 1}`}
                className="flex items-center gap-1 text-sm text-electric hover:underline"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Link>
            ) : (
              <span className="flex items-center gap-1 text-sm text-ash-dark">
                <ChevronLeft className="h-4 w-4" />
                Previous
              </span>
            )}
            <span className="text-sm text-ash">
              Page {page} of {totalPages}
            </span>
            {page < totalPages ? (
              <Link
                href={`/dashboard?page=${page + 1}`}
                className="flex items-center gap-1 text-sm text-electric hover:underline"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Link>
            ) : (
              <span className="flex items-center gap-1 text-sm text-ash-dark">
                Next
                <ChevronRight className="h-4 w-4" />
              </span>
            )}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
