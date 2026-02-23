'use client';

import { useTransition } from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { deleteEdge } from '@/lib/actions/graph';

interface EdgeDeleteButtonProps {
  edgeId: string;
}

export function EdgeDeleteButton({ edgeId }: EdgeDeleteButtonProps) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (!confirm('Delete this connection?')) return;

    startTransition(async () => {
      await deleteEdge(edgeId);
    });
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-6 w-6 shrink-0 text-ash hover:text-error"
      onClick={handleDelete}
      disabled={isPending}
      title="Delete connection"
    >
      <Trash2 className="h-3 w-3" />
    </Button>
  );
}
