import { Suspense } from 'react';
import { PageContainer } from '@/components/layout/page-container';
import { ProfileCard } from '@/components/profile/profile-card';
import { DirectoryFilters } from '@/components/directory/directory-filters';
import { Button } from '@/components/ui/button';
import { listProfiles } from '@/lib/queries/profiles';
import Link from 'next/link';

interface DirectoryPageProps {
  searchParams: Promise<{ search?: string; role?: string; page?: string }>;
}

export default async function DirectoryPage({
  searchParams,
}: DirectoryPageProps) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const { profiles, total } = await listProfiles({
    search: params.search,
    role: params.role,
    page,
    limit: 12,
  });

  const totalPages = Math.ceil(total / 12);

  return (
    <PageContainer>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Community Directory</h1>
          <p className="text-sm text-ash">
            {total} member{total !== 1 ? 's' : ''} in the community
          </p>
        </div>

        <Suspense
          fallback={
            <div className="h-10 animate-pulse rounded bg-void-lighter" />
          }
        >
          <DirectoryFilters />
        </Suspense>

        {profiles.length === 0 ? (
          <div className="py-12 text-center text-ash">
            <p className="text-lg">No members found</p>
            <p className="text-sm">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {profiles.map((profile) => (
              <ProfileCard key={profile.id} profile={profile} />
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            {page > 1 && (
              <Link
                href={`/directory?${new URLSearchParams({ ...params, page: String(page - 1) }).toString()}`}
              >
                <Button variant="outline" size="sm">
                  Previous
                </Button>
              </Link>
            )}
            <span className="text-sm text-ash">
              Page {page} of {totalPages}
            </span>
            {page < totalPages && (
              <Link
                href={`/directory?${new URLSearchParams({ ...params, page: String(page + 1) }).toString()}`}
              >
                <Button variant="outline" size="sm">
                  Next
                </Button>
              </Link>
            )}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
