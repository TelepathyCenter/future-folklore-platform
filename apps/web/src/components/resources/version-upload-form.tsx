'use client';

import { useState, useTransition, useRef } from 'react';
import { Upload, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  MAX_FILE_SIZE_BYTES,
  MAX_FILE_SIZE_LABEL,
} from '@future-folklore-platform/shared';
import { uploadNewVersion } from '@/lib/actions/resources';

interface VersionUploadFormProps {
  resourceId: string;
  onSuccess: () => void;
}

export function VersionUploadForm({
  resourceId,
  onSuccess,
}: VersionUploadFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    const file = formData.get('file') as File | null;

    if (!file || file.size === 0) {
      setError('Please select a file');
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError(`File exceeds ${MAX_FILE_SIZE_LABEL} limit`);
      return;
    }

    startTransition(async () => {
      const result = await uploadNewVersion(resourceId, formData);
      if (result && 'error' in result && result.error) {
        setError(result.error);
      } else {
        formRef.current?.reset();
        onSuccess();
      }
    });
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label
          htmlFor="version-file"
          className="mb-1.5 block text-xs font-medium text-ash"
        >
          File *
        </label>
        <Input
          id="version-file"
          name="file"
          type="file"
          required
          className="h-9 text-sm file:mr-2 file:rounded file:border-0 file:bg-void-lighter file:px-2 file:py-1 file:text-xs file:text-ash-light"
        />
        <p className="mt-1 text-[11px] text-ash">Max {MAX_FILE_SIZE_LABEL}</p>
      </div>

      <div>
        <label
          htmlFor="version-notes"
          className="mb-1.5 block text-xs font-medium text-ash"
        >
          Notes
        </label>
        <Input
          id="version-notes"
          name="upload_notes"
          placeholder="What changed in this version?"
          className="h-9"
        />
      </div>

      {error && <p className="text-xs text-error">{error}</p>}

      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? (
            <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
          ) : (
            <Upload className="mr-1 h-3.5 w-3.5" />
          )}
          {isPending ? 'Uploading...' : 'Upload Version'}
        </Button>
      </div>
    </form>
  );
}
