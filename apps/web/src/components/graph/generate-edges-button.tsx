'use client';

import { useTransition } from 'react';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { generateEdgesFromData } from '@/lib/actions/graph';
import { toast } from '@/hooks/use-toast';

export function GenerateEdgesButton() {
  const [isPending, startTransition] = useTransition();

  const handleGenerate = () => {
    startTransition(async () => {
      const result = await generateEdgesFromData();
      if (result.error) {
        toast({
          title: 'Error',
          description: result.error,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Edges Generated',
          description: `Created ${result.created} connections (${result.skipped} already existed).`,
          variant: 'success',
        });
      }
    });
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleGenerate}
      disabled={isPending}
    >
      <Sparkles className="mr-1.5 h-3.5 w-3.5" />
      {isPending ? 'Generating...' : 'Auto-generate'}
    </Button>
  );
}
