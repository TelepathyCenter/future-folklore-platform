'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { FlaskConical, X, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { submitDetailedReport } from '@/lib/actions/pds';
import { SENSORY_CHANNELS } from '@future-folklore-platform/shared';
import type {
  DetailedCaptureInput,
  SensoryData,
  SensoryChannel_Key,
} from '@future-folklore-platform/shared';

interface Project {
  id: string;
  name: string;
}

interface DetailedCaptureFormProps {
  projects?: Project[];
}

const CHANNEL_LABELS: Record<SensoryChannel_Key, string> = {
  visual: 'Visual',
  auditory: 'Auditory',
  tactile: 'Tactile / Physical',
  olfactory: 'Olfactory',
  emotional: 'Emotional',
  proprioceptive: 'Proprioceptive / Kinesthetic',
};

export function DetailedCaptureForm({
  projects = [],
}: DetailedCaptureFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [sensoryOpen, setSensoryOpen] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0]!;

  const [form, setForm] = useState<DetailedCaptureInput>({
    session_date: todayStr,
    session_time: '',
    location: '',
    protocol: '',
    pre_session_state: '',
    sensory_data: {},
    narrative: '',
    duration_minutes: undefined,
    confidence: 5,
    tags: [],
    project_id: '',
    is_public: false,
  });

  const [tagInput, setTagInput] = useState('');

  function updateSensory(
    channel: SensoryChannel_Key,
    field: 'intensity' | 'notes',
    value: string | number,
  ) {
    setForm((f) => ({
      ...f,
      sensory_data: {
        ...f.sensory_data,
        [channel]: {
          ...(f.sensory_data as SensoryData)[channel],
          [field]: value,
        },
      },
    }));
  }

  function addTag(tag: string) {
    const clean = tag.trim().toLowerCase();
    if (clean && !form.tags.includes(clean) && form.tags.length < 20) {
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
      const result = await submitDetailedReport(form);
      if (result.error) {
        setError(result.error);
      } else {
        router.push(`/pds/${result.reportId}`);
      }
    });
  }

  const sensoryData = form.sensory_data as SensoryData;

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* ── CONTEXT SECTION ── */}
      <section className="space-y-5">
        <h2 className="border-b border-void-border pb-2 text-sm font-semibold uppercase tracking-wider text-amber">
          Context
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="session_date" className="text-white">
              Date <span className="text-amber">*</span>
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

          <div className="space-y-1.5">
            <Label htmlFor="session_time" className="text-ash">
              Time <span className="text-ash/60">(optional)</span>
            </Label>
            <Input
              id="session_time"
              type="time"
              value={form.session_time}
              onChange={(e) =>
                setForm((f) => ({ ...f, session_time: e.target.value }))
              }
              className="border-void-border bg-void text-white"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="location" className="text-ash">
            Location <span className="text-ash/60">(optional)</span>
          </Label>
          <Input
            id="location"
            type="text"
            placeholder="City, coordinates, or setting description"
            value={form.location}
            onChange={(e) =>
              setForm((f) => ({ ...f, location: e.target.value }))
            }
            maxLength={200}
            className="border-void-border bg-void text-white placeholder:text-ash/40"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="protocol" className="text-ash">
            Protocol <span className="text-ash/60">(optional)</span>
          </Label>
          <Input
            id="protocol"
            type="text"
            placeholder="e.g. CRV Stage 1-2, CE-5, Ganzfeld, free-form"
            value={form.protocol}
            onChange={(e) =>
              setForm((f) => ({ ...f, protocol: e.target.value }))
            }
            maxLength={200}
            className="border-void-border bg-void text-white placeholder:text-ash/40"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="pre_session_state" className="text-ash">
            Pre-session state <span className="text-ash/60">(optional)</span>
          </Label>
          <textarea
            id="pre_session_state"
            rows={3}
            placeholder="Describe your physical, emotional, and mental state before the session..."
            value={form.pre_session_state}
            onChange={(e) =>
              setForm((f) => ({ ...f, pre_session_state: e.target.value }))
            }
            maxLength={1000}
            className="w-full rounded-md border border-void-border bg-void px-3 py-2 text-sm text-white placeholder:text-ash/40 focus:outline-none focus:ring-1 focus:ring-amber"
          />
        </div>
      </section>

      {/* ── SENSORY SECTION ── */}
      <section className="space-y-4">
        <button
          type="button"
          onClick={() => setSensoryOpen((o) => !o)}
          className="flex w-full items-center justify-between border-b border-void-border pb-2"
        >
          <h2 className="text-sm font-semibold uppercase tracking-wider text-amber">
            Sensory Channels <span className="text-ash/60">(optional)</span>
          </h2>
          {sensoryOpen ? (
            <ChevronUp className="h-4 w-4 text-ash" />
          ) : (
            <ChevronDown className="h-4 w-4 text-ash" />
          )}
        </button>

        {sensoryOpen && (
          <div className="space-y-5">
            {SENSORY_CHANNELS.map((channel) => {
              const ch = sensoryData[channel];
              return (
                <div
                  key={channel}
                  className="rounded-md border border-void-border bg-void p-4"
                >
                  <p className="mb-3 text-sm font-medium text-white">
                    {CHANNEL_LABELS[channel]}
                  </p>

                  <div className="mb-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-ash">Intensity</span>
                      <span className="text-xs font-semibold text-amber">
                        {ch?.intensity ?? 0}/10
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={10}
                      value={ch?.intensity ?? 0}
                      onChange={(e) =>
                        updateSensory(
                          channel,
                          'intensity',
                          Number(e.target.value),
                        )
                      }
                      className="w-full accent-amber"
                    />
                  </div>

                  <textarea
                    rows={2}
                    placeholder={`Describe ${channel} impressions…`}
                    value={ch?.notes ?? ''}
                    onChange={(e) =>
                      updateSensory(channel, 'notes', e.target.value)
                    }
                    maxLength={500}
                    className="w-full rounded-md border border-void-border bg-void-lighter px-3 py-2 text-sm text-white placeholder:text-ash/40 focus:outline-none focus:ring-1 focus:ring-amber"
                  />
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── NARRATIVE SECTION ── */}
      <section className="space-y-4">
        <h2 className="border-b border-void-border pb-2 text-sm font-semibold uppercase tracking-wider text-amber">
          Narrative
        </h2>

        <div className="space-y-1.5">
          <Label htmlFor="narrative" className="text-white">
            Full description <span className="text-amber">*</span>
          </Label>
          <textarea
            id="narrative"
            rows={10}
            placeholder="Describe the experience in as much detail as you can. Include the sequence of impressions, any imagery, feelings, or knowing. Write in present tense if possible."
            value={form.narrative}
            onChange={(e) =>
              setForm((f) => ({ ...f, narrative: e.target.value }))
            }
            required
            minLength={10}
            maxLength={10000}
            className="w-full rounded-md border border-void-border bg-void px-3 py-2 text-sm text-white placeholder:text-ash/40 focus:outline-none focus:ring-1 focus:ring-amber"
          />
          <p className="text-right text-xs text-ash/60">
            {form.narrative.length}/10000
          </p>
        </div>
      </section>

      {/* ── METADATA SECTION ── */}
      <section className="space-y-5">
        <h2 className="border-b border-void-border pb-2 text-sm font-semibold uppercase tracking-wider text-amber">
          Metadata
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="duration_minutes" className="text-ash">
              Duration (minutes) <span className="text-ash/60">(optional)</span>
            </Label>
            <Input
              id="duration_minutes"
              type="number"
              min={1}
              max={1440}
              placeholder="e.g. 20"
              value={form.duration_minutes ?? ''}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  duration_minutes: e.target.value
                    ? Number(e.target.value)
                    : undefined,
                }))
              }
              className="border-void-border bg-void text-white placeholder:text-ash/40"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-white">
              Confidence:{' '}
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
              <span>10 — Vivid</span>
            </div>
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
      </section>

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
          <FlaskConical className="h-4 w-4" />
        )}
        {isPending ? 'Submitting & timestamping…' : 'Submit Research Report'}
      </Button>

      <p className="text-center text-xs text-ash/60">
        Your report will be SHA-256 hashed and submitted for blockchain
        anchoring.
      </p>
    </form>
  );
}
