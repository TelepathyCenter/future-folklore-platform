import { redirect } from 'next/navigation';
import { PageContainer } from '@/components/layout/page-container';
import { CreateCallForm } from '@/components/calls/create-call-form';
import { createClient } from '@/lib/supabase/server';

interface NewCallPageProps {
  searchParams: Promise<{ error?: string }>;
}

export default async function NewCallPage({ searchParams }: NewCallPageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect('/login');
  }

  const [projectsResult, params] = await Promise.all([
    supabase
      .from('projects')
      .select('id, name, slug')
      .in('status', ['active', 'incubating'] as const)
      .order('name'),
    searchParams,
  ]);

  return (
    <PageContainer className="max-w-2xl">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Schedule a call</h1>
          <p className="text-sm text-ash">
            Create a community-wide or project-specific call
          </p>
        </div>
        {params.error && (
          <p className="rounded-md bg-error/10 p-3 text-sm text-error">
            {params.error}
          </p>
        )}
        <CreateCallForm projects={projectsResult.data ?? []} />
      </div>
    </PageContainer>
  );
}
