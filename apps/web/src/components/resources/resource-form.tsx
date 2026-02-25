'use client';

import { useState, useTransition, useRef } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  RESOURCE_TYPES,
  RESOURCE_TYPE_LABELS,
  RESOURCE_TYPE_ACCEPT,
  MAX_FILE_SIZE_BYTES,
  MAX_FILE_SIZE_LABEL,
  DOMAIN_TAGS,
} from '@future-folklore-platform/shared';
import type { ResourceType } from '@future-folklore-platform/shared';
import { createResource } from '@/lib/actions/resources';

interface ResourceFormProps {
  projectId: string;
  onSuccess: () => void;
}

export function ResourceForm({ projectId, onSuccess }: ResourceFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [resourceType, setResourceType] = useState<ResourceType>('document');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const tagInputRef = useRef<HTMLInputElement | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);

  const isLink = resourceType === 'link';
  const acceptStr = RESOURCE_TYPE_ACCEPT[resourceType];

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

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    formData.set('tags', tags.join(','));
    formData.set('resource_type', resourceType);

    // Client-side file size check
    if (!isLink) {
      const file = formData.get('file') as File | null;
      if (file && file.size > MAX_FILE_SIZE_BYTES) {
        setError(`File exceeds ${MAX_FILE_SIZE_LABEL} limit`);
        return;
      }
    }

    startTransition(async () => {
      const result = await createResource(projectId, formData);
      if (result && 'error' in result && result.error) {
        setError(result.error);
      } else {
        onSuccess();
      }
    });
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="resource-title"
          className="mb-1.5 block text-xs font-medium text-ash"
        >
          Title *
        </label>
        <Input
          id="resource-title"
          name="title"
          required
          placeholder="Resource name"
          className="h-9"
        />
      </div>

      <div>
        <label
          htmlFor="resource-description"
          className="mb-1.5 block text-xs font-medium text-ash"
        >
          Description
        </label>
        <textarea
          id="resource-description"
          name="description"
          rows={3}
          placeholder="Brief description of this resource..."
          className="flex w-full rounded-md border border-void-border bg-void-light px-3 py-2 text-sm text-ash-light placeholder:text-ash-dark focus-ring"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-ash">
          Type
        </label>
        <div className="flex flex-wrap gap-1.5">
          {RESOURCE_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setResourceType(type)}
              className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                resourceType === type
                  ? 'border-amber bg-amber-muted text-amber'
                  : 'border-void-border text-ash hover:border-ash hover:text-white'
              }`}
            >
              {RESOURCE_TYPE_LABELS[type]}
            </button>
          ))}
        </div>
      </div>

      {isLink ? (
        <div>
          <label
            htmlFor="resource-url"
            className="mb-1.5 block text-xs font-medium text-ash"
          >
            URL *
          </label>
          <Input
            id="resource-url"
            name="external_url"
            type="url"
            required
            placeholder="https://..."
            className="h-9"
          />
        </div>
      ) : (
        <div>
          <label
            htmlFor="resource-file"
            className="mb-1.5 block text-xs font-medium text-ash"
          >
            File
          </label>
          <Input
            id="resource-file"
            name="file"
            type="file"
            accept={acceptStr}
            className="h-9 text-sm file:mr-2 file:rounded file:border-0 file:bg-void-lighter file:px-2 file:py-1 file:text-xs file:text-ash-light"
          />
          <p className="mt-1 text-[11px] text-ash">Max {MAX_FILE_SIZE_LABEL}</p>
        </div>
      )}

      <div className="relative">
        <label
          htmlFor="resource-tags"
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
          id="resource-tags"
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

      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? (
            <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
          ) : (
            <Plus className="mr-1 h-3.5 w-3.5" />
          )}
          {isPending ? 'Creating...' : 'Add Resource'}
        </Button>
      </div>
    </form>
  );
}
