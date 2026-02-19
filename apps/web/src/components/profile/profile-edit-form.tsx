'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updateProfile } from '@/lib/actions/profile';
import {
  PROFILE_ROLES,
  PROFILE_ROLE_LABELS,
  PROFILE_VISIBILITIES,
} from '@future-folklore-platform/shared';
import type { Profile } from '@/lib/queries/profiles';

export function ProfileEditForm({ profile }: { profile: Profile }) {
  return (
    <form action={updateProfile} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="display_name">Display name</Label>
        <Input
          id="display_name"
          name="display_name"
          defaultValue={profile.display_name ?? ''}
          placeholder="Your name"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">Bio</Label>
        <textarea
          id="bio"
          name="bio"
          rows={4}
          defaultValue={profile.bio ?? ''}
          placeholder="Tell the community about yourself..."
          className="flex w-full rounded-md border border-void-border bg-void-light px-3 py-2 text-sm text-ash-light placeholder:text-ash-dark focus-ring disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="role">Role</Label>
        <select
          id="role"
          name="role"
          defaultValue={profile.role}
          className="flex h-10 w-full rounded-md border border-void-border bg-void-light px-3 py-2 text-sm text-ash-light focus-ring"
        >
          {PROFILE_ROLES.map((role) => (
            <option key={role} value={role}>
              {PROFILE_ROLE_LABELS[role]}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="visibility">Visibility</Label>
        <select
          id="visibility"
          name="visibility"
          defaultValue={profile.visibility}
          className="flex h-10 w-full rounded-md border border-void-border bg-void-light px-3 py-2 text-sm text-ash-light focus-ring"
        >
          {PROFILE_VISIBILITIES.map((v) => (
            <option key={v} value={v}>
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="expertise_tags">Expertise tags</Label>
        <Input
          id="expertise_tags"
          name="expertise_tags"
          defaultValue={profile.expertise_tags.join(', ')}
          placeholder="e.g. remote viewing, quantum biology, AI"
        />
        <p className="text-xs text-ash">Comma-separated list</p>
      </div>

      <div className="flex gap-3">
        <Button type="submit">Save changes</Button>
        <Button type="button" variant="outline" onClick={() => history.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
