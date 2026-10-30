import { useState } from "react";
import type { StorageBucketRecord } from "@/api/storage/buckets";
import { storageBucketActions } from "@/components/objects/storageBucketActions";
import StorageBucketUploadModal from "@/components/objects/StorageBucketUploadModal";
import type { RowAction } from "@/components/common";

export function useStorageBucketActions(onUploaded?: () => void) {
  const [uploadBucket, setUploadBucket] = useState<StorageBucketRecord | null>(null);
  const actions: RowAction<StorageBucketRecord>[] = storageBucketActions.map((action) =>
    action.key === "upload"
      ? {
          key: "upload",
          label: "上传",
          onClick: setUploadBucket,
        }
      : action,
  );
  const dialogNode = uploadBucket ? (
    <StorageBucketUploadModal
      bucket={uploadBucket}
      onCancel={() => setUploadBucket(null)}
      onUploaded={onUploaded}
    />
  ) : null;
  return { actions, dialogNode };
}
