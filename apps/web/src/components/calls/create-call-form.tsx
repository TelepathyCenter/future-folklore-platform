'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createCall } from '@/lib/actions/calls';

interface CreateCallFormProps {
  projects: Array<{ id: string; name: string; slug: string }>;
}

export function CreateCallForm({ projects }: CreateCallFormProps) {
  return (
    <form action={createCall} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          name="title"
          required
          placeholder="e.g. Weekly Community Call"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <textarea
          id="description"
          name="description"
          rows={3}
          placeholder="What will be discussed?"
          className="flex w-full rounded-md border border-void-border bg-void-light px-3 py-2 text-sm text-ash-light placeholder:text-ash-dark focus-ring disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="scheduled_at">Date & time</Label>
          <Input
            id="scheduled_at"
            name="scheduled_at"
            type="datetime-local"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="duration_minutes">Duration (minutes)</Label>
          <Input
            id="duration_minutes"
            name="duration_minutes"
            type="number"
            defaultValue={60}
            min={5}
            max={480}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="video_link">Video link</Label>
        <Input
          id="video_link"
          name="video_link"
          type="url"
          placeholder="https://meet.google.com/... or https://zoom.us/..."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="project_id">Link to project (optional)</Label>
        <select
          id="project_id"
          name="project_id"
          className="flex h-10 w-full rounded-md border border-void-border bg-void-light px-3 py-2 text-sm text-ash-light focus-ring"
        >
          <option value="">Community-wide (no project)</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
        <p className="text-xs text-ash">
          Leave empty for a community-wide call
        </p>
      </div>

      <div className="flex gap-3">
        <Button type="submit">Schedule call</Button>
        <Button type="button" variant="outline" onClick={() => history.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
