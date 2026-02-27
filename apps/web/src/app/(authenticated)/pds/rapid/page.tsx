import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { RapidCaptureForm } from '@/components/pds/rapid-capture-form';
import { ArrowLeft, Zap } from 'lucide-react';

export const metadata = { title: 'Quick Field Capture — FF-PDS' };

async function getUserProjects(userId: string) {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = (await (supabase.from('memberships') as any)
    .select('project:projects (id, name)')
    .eq('profile_id', userId)) as {
    data: { project: { id: string; name: string } | null }[] | null;
  };
  if (!data) return [];
  return data.flatMap((m) => (m.project ? [m.project] : []));
}

export default async function RapidCapturePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const projects = await getUserProjects(user.id);

  return (
    <div className="mx-auto max-w-lg space-y-6 p-6">
      {/* Back nav */}
      <Link
        href="/pds"
        className="flex items-center gap-2 text-sm text-ash transition-colors hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Reports
      </Link>

      {/* Header */}
      <div>
        <div className="mb-1 flex items-center gap-2">
          <Zap className="h-5 w-5 text-amber" />
          <h1 className="text-xl font-bold text-white">Quick Field Capture</h1>
        </div>
        <p className="text-sm text-ash">
          Capture an experience in under 5 minutes. Your submission will be
          SHA-256 hashed and blockchain-timestamped.
        </p>
      </div>

      <RapidCaptureForm projects={projects} />
    </div>
  );
}
