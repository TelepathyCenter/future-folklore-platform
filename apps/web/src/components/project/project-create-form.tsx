'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createProject } from '@/lib/actions/project';
import {
  PROJECT_STATUSES,
  PROJECT_STATUS_LABELS,
  PROJECT_VISIBILITIES,
  DOMAIN_TAGS,
} from '@future-folklore-platform/shared';
import type { Organization } from '@/lib/queries/projects';

interface ProjectCreateFormProps {
  organizations: Organization[];
}

export function ProjectCreateForm({ organizations }: ProjectCreateFormProps) {
  return (
    <form action={createProject} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Project name</Label>
        <Input
          id="name"
          name="name"
          required
          placeholder="e.g. Remote Viewing Protocol Study"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <textarea
          id="description"
          name="description"
          rows={4}
          placeholder="What is this project working on?"
          className="flex w-full rounded-md border border-void-border bg-void-light px-3 py-2 text-sm text-ash-light placeholder:text-ash-dark focus-ring disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="organization_id">Organization</Label>
        <select
          id="organization_id"
          name="organization_id"
          required
          className="flex h-10 w-full rounded-md border border-void-border bg-void-light px-3 py-2 text-sm text-ash-light focus-ring"
        >
          <option value="">Select an organization...</option>
          {organizations.map((org) => (
            <option key={org.id} value={org.id}>
              {org.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            name="status"
            defaultValue="incubating"
            className="flex h-10 w-full rounded-md border border-void-border bg-void-light px-3 py-2 text-sm text-ash-light focus-ring"
          >
            {PROJECT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {PROJECT_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="visibility">Visibility</Label>
          <select
            id="visibility"
            name="visibility"
            defaultValue="community"
            className="flex h-10 w-full rounded-md border border-void-border bg-void-light px-3 py-2 text-sm text-ash-light focus-ring"
          >
            {PROJECT_VISIBILITIES.map((v) => (
              <option key={v} value={v}>
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="domain_tags">Domain tags</Label>
        <Input
          id="domain_tags"
          name="domain_tags"
          placeholder={`e.g. ${DOMAIN_TAGS.slice(0, 3).join(', ')}`}
        />
        <p className="text-xs text-ash">Comma-separated list</p>
      </div>

      <div className="flex gap-3">
        <Button type="submit">Create project</Button>
        <Button type="button" variant="outline" onClick={() => history.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
