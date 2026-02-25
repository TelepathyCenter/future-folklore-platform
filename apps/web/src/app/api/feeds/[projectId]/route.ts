import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { listPublicUpdates } from '@/lib/queries/updates';

export const dynamic = 'force-dynamic';

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;
  const supabase = await createClient();

  // Verify project exists and is public or community
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: project, error } = (await (supabase.from('projects') as any)
    .select('id, name, visibility')
    .eq('id', projectId)
    .single()) as {
    data: { id: string; name: string; visibility: string } | null;
    error: { message: string } | null;
  };

  if (error || !project || !['public', 'community'].includes(project.visibility)) {
    return new NextResponse('Not Found', { status: 404 });
  }

  const updates = await listPublicUpdates(projectId, 50);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://futurefolklore.org';
  const feedUpdated = updates.length > 0
    ? updates[0].published_at ?? updates[0].created_at
    : new Date().toISOString();

  const entries = updates
    .map((update) => {
      const url = `${siteUrl}/projects/${project.id}`;
      const published = update.published_at ?? update.created_at;
      const authorName = update.profiles.display_name ?? update.profiles.username;

      return `  <entry>
    <title>${escapeXml(update.title)}</title>
    <id>urn:uuid:${update.id}</id>
    <link href="${escapeXml(url)}" rel="alternate" />
    <updated>${published}</updated>
    <author><name>${escapeXml(authorName)}</name></author>${
      update.body
        ? `\n    <content type="text">${escapeXml(update.body)}</content>`
        : ''
    }${update.tags.map((t) => `\n    <category term="${escapeXml(t)}" />`).join('')}
  </entry>`;
    })
    .join('\n');

  const atom = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Future Folklore — ${escapeXml(project.name)} Updates</title>
  <link href="${siteUrl}/api/feeds/${project.id}" rel="self" type="application/atom+xml" />
  <link href="${siteUrl}/projects/${project.id}" rel="alternate" />
  <id>${siteUrl}/api/feeds/${project.id}</id>
  <updated>${feedUpdated}</updated>
  <subtitle>Updates from ${escapeXml(project.name)}</subtitle>
${entries}
</feed>`;

  return new NextResponse(atom, {
    status: 200,
    headers: {
      'Content-Type': 'application/atom+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=300, s-maxage=300',
    },
  });
}
