'use client';

import { Button } from '@/components/ui/button';
import { CalendarPlus } from 'lucide-react';
import type { Call } from '@/lib/queries/calls';

function generateIcs(
  call: Call & { project?: { name: string } | null },
): string {
  const start = new Date(call.scheduled_at);
  const end = new Date(start.getTime() + call.duration_minutes * 60 * 1000);

  const format = (d: Date) =>
    d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  const escape = (s: string) =>
    s.replace(/[\\,;]/g, (c) => `\\${c}`).replace(/\n/g, '\\n');

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Future Folklore Platform//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${call.id}@future-folklore-platform`,
    `DTSTAMP:${format(new Date())}`,
    `DTSTART:${format(start)}`,
    `DTEND:${format(end)}`,
    `SUMMARY:${escape(call.title)}`,
    call.description ? `DESCRIPTION:${escape(call.description)}` : null,
    call.video_link ? `URL:${call.video_link}` : null,
    call.project ? `CATEGORIES:${escape(call.project.name)}` : null,
    'END:VEVENT',
    'END:VCALENDAR',
  ]
    .filter(Boolean)
    .join('\r\n');

  return lines;
}

export function IcsDownloadButton({
  call,
}: {
  call: Call & { project?: { name: string } | null };
}) {
  const handleDownload = () => {
    const ics = generateIcs(call);
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${call.title.toLowerCase().replace(/\s+/g, '-')}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Button variant="outline" size="sm" onClick={handleDownload}>
      <CalendarPlus className="mr-1 h-4 w-4" />
      Add to calendar
    </Button>
  );
}
