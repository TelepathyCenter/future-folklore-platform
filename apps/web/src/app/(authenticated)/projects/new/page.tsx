import { redirect } from 'next/navigation';
import { PageContainer } from '@/components/layout/page-container';
import { ProjectCreateForm } from '@/components/project/project-create-form';
import { listUserOrganizations } from '@/lib/queries/projects';
import { createClient } from '@/lib/supabase/server';

interface NewProjectPageProps {
  searchParams: Promise<{ error?: string }>;
}

export default async function NewProjectPage({
  searchParams,
}: NewProjectPageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect('/login');
  }

  const [organizations, params] = await Promise.all([
    listUserOrganizations(),
    searchParams,
  ]);

  return (
    <PageContainer className="max-w-2xl">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">New project</h1>
          <p className="text-sm text-ash">
            Create a new research project in your organization
          </p>
        </div>
        {params.error && (
          <p className="rounded-md bg-error/10 p-3 text-sm text-error">
            {params.error}
          </p>
        )}
        {organizations.length === 0 ? (
          <div className="rounded-md border border-void-border bg-void-light p-6 text-center">
            <p className="text-ash">
              You need to belong to an organization before creating a project.
            </p>
          </div>
        ) : (
          <ProjectCreateForm organizations={organizations} />
        )}
      </div>
    </PageContainer>
  );
}
