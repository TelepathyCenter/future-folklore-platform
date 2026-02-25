'use client';

import { useState, useTransition, useRef } from 'react';
import { Send, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DOMAIN_TAGS } from '@future-folklore-platform/shared';
import { createUpdate, editUpdate } from '@/lib/actions/updates';
import type { UpdateWithMeta } from '@/lib/queries/updates';

interface UpdateFormProps {
  projectId?: string;
  existingUpdate?: UpdateWithMeta;
  onSuccess?: () => void;
}

export function UpdateForm({
  projectId,
  existingUpdate,
  onSuccess,
}: UpdateFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(existingUpdate?.tags ?? []);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const tagInputRef = useRef<HTMLInputElement | null>(null);

  const filteredSuggestions = tagInput
    ? DOMAIN_TAGS.filter(
        (t) =>
          t.toLowerCase().includes(tagInput.toLowerCase()) && !tags.includes(t),
      )
    : [];

  const addTag = (tag: string) => {
    const normalized = tag.trim().toLowerCase();
    if (normalized && !tags.includes(normalized)) {
      setTags((prev) => [...prev, normalized]);
    }
    setTagInput('');
    setShowSuggestions(false);
  };

  const removeTag = (tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag));
  };

  const handleSubmit = (
    e: React.FormEvent<HTMLFormElement>,
    status: 'draft' | 'published',
  ) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    formData.set('tags', tags.join(','));
    formData.set('status', status);

    if (projectId) {
      formData.set('project_id', projectId);
    }

    startTransition(async () => {
      const result = existingUpdate
        ? await editUpdate(existingUpdate.id, formData)
        : await createUpdate(formData);

      if (result && 'error' in result && result.error) {
        setError(result.error);
      } else {
        onSuccess?.();
      }
    });
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
      }}
      className="space-y-4"
    >
      <div>
        <label
          htmlFor="update-title"
          className="mb-1.5 block text-xs font-medium text-ash"
        >
          Title *
        </label>
        <Input
          id="update-title"
          name="title"
          required
          defaultValue={existingUpdate?.title ?? ''}
          placeholder="What's new?"
          className="h-9"
        />
      </div>

      <div>
        <label
          htmlFor="update-body"
          className="mb-1.5 block text-xs font-medium text-ash"
        >
          Body
        </label>
        <textarea
          id="update-body"
          name="body"
          rows={4}
          defaultValue={existingUpdate?.body ?? ''}
          placeholder="Share details about your progress..."
          className="flex w-full rounded-md border border-void-border bg-void-light px-3 py-2 text-sm text-ash-light placeholder:text-ash-dark focus-ring"
        />
      </div>

      <div className="relative">
        <label
          htmlFor="update-tags"
          className="mb-1.5 block text-xs font-medium text-ash"
        >
          Tags
        </label>
        {tags.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1">
            {tags.map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className="cursor-pointer hover:bg-void-lighter"
                onClick={() => removeTag(tag)}
              >
                {tag} &times;
              </Badge>
            ))}
          </div>
        )}
        <Input
          id="update-tags"
          ref={tagInputRef}
          value={tagInput}
          onChange={(e) => {
            setTagInput(e.target.value);
            setShowSuggestions(true);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && tagInput.trim()) {
              e.preventDefault();
              addTag(tagInput);
            }
          }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          placeholder="Type to add tags..."
          className="h-9"
        />
        {showSuggestions && filteredSuggestions.length > 0 && (
          <div className="absolute z-10 mt-1 w-full rounded-md border border-void-border bg-void-light shadow-lg">
            {filteredSuggestions.slice(0, 5).map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                className="w-full px-3 py-1.5 text-left text-sm text-ash-light hover:bg-void-lighter hover:text-white"
                onMouseDown={(e) => {
                  e.preventDefault();
                  addTag(suggestion);
                }}
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>

      {error && <p className="text-xs text-error">{error}</p>}

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={(e) => {
            const form = (e.target as HTMLElement).closest('form');
            if (form) {
              handleSubmit(
                {
                  ...new Event('submit'),
                  currentTarget: form,
                  preventDefault: () => {},
                } as unknown as React.FormEvent<HTMLFormElement>,
                'draft',
              );
            }
          }}
        >
          <Save className="mr-1 h-3.5 w-3.5" />
          {isPending ? 'Saving...' : 'Save Draft'}
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={isPending}
          onClick={(e) => {
            const form = (e.target as HTMLElement).closest('form');
            if (form) {
              handleSubmit(
                {
                  ...new Event('submit'),
                  currentTarget: form,
                  preventDefault: () => {},
                } as unknown as React.FormEvent<HTMLFormElement>,
                'published',
              );
            }
          }}
        >
          <Send className="mr-1 h-3.5 w-3.5" />
          {isPending ? 'Publishing...' : 'Publish'}
        </Button>
      </div>
    </form>
  );
}
