'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { saveCallNotes } from '@/lib/actions/calls';

interface NotesEditorProps {
  callId: string;
  initialNotes: string;
  canEdit: boolean;
}

export function NotesEditor({
  callId,
  initialNotes,
  canEdit,
}: NotesEditorProps) {
  const [notes, setNotes] = useState(initialNotes);
  const [saved, setSaved] = useState(true);
  const [isPending, startTransition] = useTransition();

  const handleSave = () => {
    startTransition(async () => {
      const result = await saveCallNotes(callId, notes);
      if (!result || !('error' in result) || !result.error) {
        setSaved(true);
      }
    });
  };

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold text-white">Meeting Notes</h2>
      {canEdit ? (
        <>
          <textarea
            rows={8}
            value={notes}
            onChange={(e) => {
              setNotes(e.target.value);
              setSaved(false);
            }}
            placeholder="Add meeting notes, agenda items, or minutes here..."
            className="flex w-full rounded-md border border-void-border bg-void-light px-3 py-2 text-sm text-ash-light placeholder:text-ash-dark focus-ring disabled:opacity-50"
          />
          <div className="flex items-center gap-3">
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isPending || saved}
            >
              {isPending ? 'Saving...' : saved ? 'Saved' : 'Save notes'}
            </Button>
            {!saved && (
              <span className="text-xs text-ash">Unsaved changes</span>
            )}
          </div>
        </>
      ) : (
        <div className="whitespace-pre-wrap rounded-md border border-void-border bg-void-light px-3 py-2 text-sm text-ash-light">
          {initialNotes || (
            <span className="italic text-ash-dark">No notes yet</span>
          )}
        </div>
      )}
    </div>
  );
}
