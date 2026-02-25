import { NextResponse } from 'next/server';
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

export async function GET() {
  const updates = await listPublicUpdates(undefined, 50);

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? 'https://futurefolklore.org';
  const feedUpdated =
    updates.length > 0
      ? (updates[0].published_at ?? updates[0].created_at)
      : new Date().toISOString();

  const entries = updates
    .map((update) => {
      const url = update.projects
        ? `${siteUrl}/projects/${update.projects.id}`
        : `${siteUrl}/dashboard`;
      const published = update.published_at ?? update.created_at;
      const authorName =
        update.profiles.display_name ?? update.profiles.username;

      return `  <entry>
    <title>${escapeXml(update.title)}</title>
    <id>urn:uuid:${update.id}</id>
    <link href="${escapeXml(url)}" rel="alternate" />
    <updated>${published}</updated>
    <author><name>${escapeXml(authorName)}</name></author>${
      update.body
        ? `\n    <content type="text">${escapeXml(update.body)}</content>`
        : ''
    }${
      update.projects
        ? `\n    <category term="${escapeXml(update.projects.name)}" />`
        : ''
    }${update.tags.map((t) => `\n    <category term="${escapeXml(t)}" />`).join('')}
  </entry>`;
    })
    .join('\n');

  const atom = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Future Folklore Platform — Updates</title>
  <link href="${siteUrl}/api/feeds" rel="self" type="application/atom+xml" />
  <link href="${siteUrl}" rel="alternate" />
  <id>${siteUrl}/api/feeds</id>
  <updated>${feedUpdated}</updated>
  <subtitle>Latest updates from the Future Folklore research community</subtitle>
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
