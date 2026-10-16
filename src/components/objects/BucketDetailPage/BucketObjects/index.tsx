import { useCursorPaginatedQuery } from "@/hooks/useCursorPaginatedQuery";
import { useBucketUpload } from "@/hooks/useBucketUpload";
import { useObjectActions } from "@/hooks/useObjectActions";
import { listBucketObjects, type StorageBucketRecord } from "@/api/storage/buckets";
import ObjectBrowser from "@/components/objects/ObjectBrowser";
import { withId } from "@/lib/id";
import { Button, Upload } from "@arco-design/web-react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import BucketFolderCreateModal from "@/components/objects/BucketFolderCreateModal";

export default function BucketObjects({
  bucketId,
  bucket,
}: {
  bucketId: string;
  bucket: StorageBucketRecord;
}) {
  const qc = useQueryClient();
  const [folderVisible, setFolderVisible] = useState(false);
  const [prefix, setPrefix] = useState("/");

  const {
    query: objects,
    items: entries,
    pagination,
  } = useCursorPaginatedQuery({
    queryKey: ["bucket-objects", bucketId, prefix],
    queryFn: (params) => listBucketObjects(bucketId, { ...params, prefix }),
    errorNotification: {
      id: withId("bucket-objects", bucketId, prefix),
      action: "对象列表加载",
      fallback: "请求失败，请稍后重试",
    },
  });
  const { actions } = useObjectActions(bucketId);
  const upload = useBucketUpload(bucketId, prefix);
  const dialogNode = folderVisible ? (
    <BucketFolderCreateModal
      bucketId={bucketId}
      prefix={prefix}
      onCancel={() => setFolderVisible(false)}
      onCreated={() => {
        qc.invalidateQueries({ queryKey: ["bucket", bucketId] });
        qc.invalidateQueries({ queryKey: ["bucket-objects", bucketId] });
        qc.invalidateQueries({ queryKey: ["buckets"] });
      }}
    />
  ) : null;
  const openFolder = () => setFolderVisible(true);
  const aclLabel = bucket.acl === "tenant_read" ? "租户内读" : "私有";
  return (
    <>
      <ObjectBrowser
        bucketName={bucket.name}
        prefix={prefix}
        entries={entries}
        pagination={pagination}
        aclLabel={aclLabel}
        loading={objects.isLoading}
        actions={actions}
        primaryAction={
          <Upload
            showUploadList={false}
            customRequest={(option) => upload.mutate(option.file as File)}
          >
            <Button type="primary" loading={upload.isPending}>
              上传对象
            </Button>
          </Upload>
        }
        onNavigate={(target) => {
          setPrefix(target);
        }}
        onCreateFolder={openFolder}
      />
      {dialogNode}
    </>
  );
}
