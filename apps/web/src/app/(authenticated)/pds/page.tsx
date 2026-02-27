import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { listReports } from '@/lib/queries/pds';
import { ReportCard } from '@/components/pds/report-card';
import { Button } from '@/components/ui/button';
import { Zap, FlaskConical, FileText } from 'lucide-react';

export const metadata = { title: 'Reports — FF-PDS' };

export default async function PdsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const reports = await listReports({ authorId: user.id, limit: 50 });

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Phenomenological Reports
          </h1>
          <p className="mt-1 text-sm text-ash">
            Your blockchain-anchored experiential data records.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link href="/pds/rapid">
            <Button variant="outline" className="gap-2 border-void-border">
              <Zap className="h-4 w-4 text-amber" />
              Quick Capture
            </Button>
          </Link>
          <Link href="/pds/new">
            <Button className="gap-2 bg-amber text-void hover:bg-amber/90">
              <FlaskConical className="h-4 w-4" />
              Full Report
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex gap-4 rounded-lg border border-void-border bg-void-lighter px-4 py-3">
        <div className="text-center">
          <p className="text-lg font-bold text-white">{reports.length}</p>
          <p className="text-xs text-ash">Total reports</p>
        </div>
        <div className="w-px bg-void-border" />
        <div className="text-center">
          <p className="text-lg font-bold text-white">
            {reports.filter((r) => r.capture_mode === 'detailed').length}
          </p>
          <p className="text-xs text-ash">Detailed</p>
        </div>
        <div className="w-px bg-void-border" />
        <div className="text-center">
          <p className="text-lg font-bold text-white">
            {
              reports.filter(
                (r) =>
                  r.blockchain_timestamp?.anchor_status === 'anchored' ||
                  r.blockchain_timestamp?.anchor_status === 'verified',
              ).length
            }
          </p>
          <p className="text-xs text-ash">Anchored</p>
        </div>
      </div>

      {/* Reports list */}
      {reports.length === 0 ? (
        <div className="rounded-lg border border-dashed border-void-border py-16 text-center">
          <FileText className="mx-auto mb-3 h-10 w-10 text-ash/40" />
          <h2 className="mb-1 text-base font-semibold text-white">
            No reports yet
          </h2>
          <p className="mb-6 text-sm text-ash">
            Start documenting your experiential research.
          </p>
          <div className="flex justify-center gap-3">
            <Link href="/pds/rapid">
              <Button variant="outline" className="gap-2 border-void-border">
                <Zap className="h-4 w-4 text-amber" />
                Quick Capture
              </Button>
            </Link>
            <Link href="/pds/new">
              <Button className="gap-2 bg-amber text-void hover:bg-amber/90">
                <FlaskConical className="h-4 w-4" />
                Full Report
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => (
            <ReportCard key={report.id} report={report} />
          ))}
        </div>
      )}
    </div>
  );
}
