'use client';

import { useState, useEffect, useTransition } from 'react';
import {
  FileText,
  Image as ImageIcon,
  Database,
  Video,
  ExternalLink,
  File,
  Download,
  Trash2,
  Loader2,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  RESOURCE_TYPE_LABELS,
  RESOURCE_TYPE_BADGE_VARIANT,
} from '@future-folklore-platform/shared';
import type { ResourceType } from '@future-folklore-platform/shared';
import {
  getSignedUrl,
  deleteResource,
  getResourceAction,
} from '@/lib/actions/resources';
import type { ResourceDetail } from '@/lib/queries/resources';
import { VersionList } from '@/components/resources/version-list';
import { VersionUploadForm } from '@/components/resources/version-upload-form';

const TYPE_ICON_MAP: Record<string, React.ElementType> = {
  document: FileText,
  image: ImageIcon,
  dataset: Database,
  video: Video,
  link: ExternalLink,
  other: File,
};

interface ResourceDetailDialogProps {
  resourceId: string | null;
  isMember: boolean;
  onClose: () => void;
  onDeleted: () => void;
}

export function ResourceDetailDialog({
  resourceId,
  isMember,
  onClose,
  onDeleted,
}: ResourceDetailDialogProps) {
  const [resource, setResource] = useState<ResourceDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloadPending, startDownload] = useTransition();
  const [deletePending, startDelete] = useTransition();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!resourceId) {
      setResource(null);
      return;
    }

    setLoading(true);
    getResourceAction(resourceId).then((data) => {
      setResource(data);
      setLoading(false);
    });
  }, [resourceId]);

  const handleDownload = () => {
    if (!resource?.current_version) return;
    startDownload(async () => {
      const result = await getSignedUrl(resource.current_version!.storage_path);
      if (result.url) {
        window.open(result.url, '_blank');
      }
    });
  };

  const handleDelete = () => {
    if (!resource) return;
    startDelete(async () => {
      const result = await deleteResource(resource.id);
      if (result && 'error' in result && result.error) {
        setError(result.error);
      } else {
        onDeleted();
      }
    });
  };

  const handleVersionUploaded = () => {
    if (!resourceId) return;
    getResourceAction(resourceId).then(setResource);
  };

  const Icon = resource
    ? (TYPE_ICON_MAP[resource.resource_type] ?? File)
    : File;

  return (
    <Dialog open={!!resourceId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-ash" />
          </div>
        )}

        {!loading && resource && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2">
                <Icon className="h-5 w-5 text-ash-light" />
                <DialogTitle className="text-lg">{resource.title}</DialogTitle>
              </div>
              <DialogDescription>
                <Badge
                  variant={
                    RESOURCE_TYPE_BADGE_VARIANT[
                      resource.resource_type as ResourceType
                    ]
                  }
                >
                  {RESOURCE_TYPE_LABELS[resource.resource_type as ResourceType]}
                </Badge>
              </DialogDescription>
            </DialogHeader>

            {resource.description && (
              <p className="text-sm text-ash-light">{resource.description}</p>
            )}

            {resource.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {resource.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-[10px]">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            {resource.external_url && (
              <a
                href={resource.external_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm text-electric hover:underline"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                {resource.external_url}
              </a>
            )}

            <div className="flex items-center gap-2">
              {resource.current_version && (
                <Button
                  size="sm"
                  onClick={handleDownload}
                  disabled={downloadPending}
                >
                  {downloadPending ? (
                    <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Download className="mr-1 h-3.5 w-3.5" />
                  )}
                  Download Current
                </Button>
              )}
              {isMember && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDelete}
                  disabled={deletePending}
                  className="text-error hover:bg-error/10"
                >
                  {deletePending ? (
                    <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="mr-1 h-3.5 w-3.5" />
                  )}
                  Delete
                </Button>
              )}
            </div>

            {error && <p className="text-xs text-error">{error}</p>}

            <Separator />

            <div>
              <p className="mb-2 text-xs font-medium uppercase text-ash">
                Version History ({resource.resource_versions.length})
              </p>
              <VersionList versions={resource.resource_versions} />
            </div>

            {isMember && resource.resource_type !== 'link' && (
              <>
                <Separator />
                <div>
                  <p className="mb-2 text-xs font-medium uppercase text-ash">
                    Upload New Version
                  </p>
                  <VersionUploadForm
                    resourceId={resource.id}
                    onSuccess={handleVersionUploaded}
                  />
                </div>
              </>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
