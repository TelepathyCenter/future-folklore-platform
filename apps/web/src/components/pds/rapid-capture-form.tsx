'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Zap, X, Loader2 } from 'lucide-react';
import { submitRapidReport } from '@/lib/actions/pds';
import type { RapidCaptureInput } from '@future-folklore-platform/shared';

interface Project {
  id: string;
  name: string;
}

interface RapidCaptureFormProps {
  projects?: Project[];
}

export function RapidCaptureForm({ projects = [] }: RapidCaptureFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const todayStr = new Date().toISOString().split('T')[0]!;

  const [form, setForm] = useState<RapidCaptureInput>({
    session_date: todayStr,
    location: '',
    narrative: '',
    confidence: 5,
    tags: [],
    project_id: '',
    is_public: false,
  });

  const [tagInput, setTagInput] = useState('');

  function addTag(tag: string) {
    const clean = tag.trim().toLowerCase();
    if (clean && !form.tags.includes(clean) && form.tags.length < 10) {
      setForm((f) => ({ ...f, tags: [...f.tags, clean] }));
    }
    setTagInput('');
  }

  function removeTag(tag: string) {
    setForm((f) => ({ ...f, tags: f.tags.filter((t) => t !== tag) }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await submitRapidReport(form);
      if (result.error) {
        setError(result.error);
      } else {
        router.push(`/pds/${result.reportId}`);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Date */}
      <div className="space-y-1.5">
        <Label htmlFor="session_date" className="text-white">
          When did this happen? <span className="text-amber">*</span>
        </Label>
        <Input
          id="session_date"
          type="date"
          value={form.session_date}
          onChange={(e) =>
            setForm((f) => ({ ...f, session_date: e.target.value }))
          }
          required
          className="border-void-border bg-void text-white"
        />
      </div>

      {/* Location */}
      <div className="space-y-1.5">
        <Label htmlFor="location" className="text-ash">
          Where? <span className="text-ash/60">(optional)</span>
        </Label>
        <Input
          id="location"
          type="text"
          placeholder="City, country, or describe the setting"
          value={form.location}
          onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
          maxLength={200}
          className="border-void-border bg-void text-white placeholder:text-ash/40"
        />
      </div>

      {/* Narrative */}
      <div className="space-y-1.5">
        <Label htmlFor="narrative" className="text-white">
          What happened? <span className="text-amber">*</span>
        </Label>
        <textarea
          id="narrative"
          rows={6}
          placeholder="Describe the experience as clearly as you can remember it..."
          value={form.narrative}
          onChange={(e) =>
            setForm((f) => ({ ...f, narrative: e.target.value }))
          }
          required
          minLength={10}
          maxLength={5000}
          className="w-full rounded-md border border-void-border bg-void px-3 py-2 text-sm text-white placeholder:text-ash/40 focus:outline-none focus:ring-1 focus:ring-amber"
        />
        <p className="text-right text-xs text-ash/60">
          {form.narrative.length}/5000
        </p>
      </div>

      {/* Confidence */}
      <div className="space-y-2">
        <Label className="text-white">
          Confidence in your recollection:{' '}
          <span className="font-bold text-amber">{form.confidence}/10</span>
        </Label>
        <input
          type="range"
          min={1}
          max={10}
          value={form.confidence}
          onChange={(e) =>
            setForm((f) => ({ ...f, confidence: Number(e.target.value) }))
          }
          className="w-full accent-amber"
        />
        <div className="flex justify-between text-xs text-ash/60">
          <span>1 — Vague</span>
          <span>5 — Moderate</span>
          <span>10 — Vivid</span>
        </div>
      </div>

      {/* Tags */}
      <div className="space-y-1.5">
        <Label className="text-ash">
          Tags <span className="text-ash/60">(optional)</span>
        </Label>
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Add a tag and press Enter"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addTag(tagInput);
              }
            }}
            maxLength={50}
            className="border-void-border bg-void text-white placeholder:text-ash/40"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => addTag(tagInput)}
            className="border-void-border"
          >
            Add
          </Button>
        </div>
        {form.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {form.tags.map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="cursor-pointer gap-1 text-xs"
                onClick={() => removeTag(tag)}
              >
                {tag}
                <X className="h-2.5 w-2.5" />
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Project */}
      {projects.length > 0 && (
        <div className="space-y-1.5">
          <Label htmlFor="project_id" className="text-ash">
            Link to project <span className="text-ash/60">(optional)</span>
          </Label>
          <select
            id="project_id"
            value={form.project_id}
            onChange={(e) =>
              setForm((f) => ({ ...f, project_id: e.target.value }))
            }
            className="w-full rounded-md border border-void-border bg-void px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber"
          >
            <option value="">No project</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Visibility */}
      <label className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={form.is_public}
          onChange={(e) =>
            setForm((f) => ({ ...f, is_public: e.target.checked }))
          }
          className="h-4 w-4 accent-amber"
        />
        <span className="text-sm text-ash">
          Make this report publicly visible
        </span>
      </label>

      {/* Error */}
      {error && (
        <p className="rounded-md border border-red-800 bg-red-950/40 px-3 py-2 text-sm text-red-400">
          {error}
        </p>
      )}

      {/* Submit */}
      <Button
        type="submit"
        disabled={isPending}
        className="w-full gap-2 bg-amber text-void hover:bg-amber/90"
        size="lg"
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Zap className="h-4 w-4" />
        )}
        {isPending ? 'Submitting & timestamping…' : 'Submit Report'}
      </Button>

      <p className="text-center text-xs text-ash/60">
        Your report will be SHA-256 hashed and submitted for blockchain
        anchoring.
      </p>
    </form>
  );
}
