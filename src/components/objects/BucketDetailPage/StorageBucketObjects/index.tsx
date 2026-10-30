import { useEffect, useRef, useState } from "react";
import { Button } from "@arco-design/web-react";
import { listStorageObjects } from "@/api/storage/objects";
import { useCursorPaginatedQuery } from "@/hooks/useCursorPaginatedQuery";
import { useStorageObjectActions } from "@/hooks/useStorageObjectActions";
import ObjectBrowser, { type ObjectBrowserEntry } from "@/components/objects/ObjectBrowser";
import { withId } from "@/lib/id";
import StorageBucketUploadModal from "@/components/objects/StorageBucketUploadModal";

type StorageBucketObjectsProps = {
  bucketId: string;
  bucketName: string;
  refreshVersion: number;
};

export default function StorageBucketObjects({
  bucketId,
  bucketName,
  refreshVersion,
}: StorageBucketObjectsProps) {
  const [prefix, setPrefix] = useState("");
  const [uploadVisible, setUploadVisible] = useState(false);
  const lastRefreshVersion = useRef(refreshVersion);
  const { query, items, pagination, refresh } = useCursorPaginatedQuery<ObjectBrowserEntry>({
    queryKey: ["storage", "objects", bucketId, prefix],
    queryFn: async (params, signal) => {
      const page = await listStorageObjects(bucketId, { ...params, prefix }, signal);
      // 仅合并目录和文件供同一表格展示；不改写 key、不本地排序/过滤，也不补造 total。
      return {
        items: [
          ...page.common_prefixes.map((key) => ({
            kind: "prefix" as const,
            key,
            name: key.slice(prefix.length, -1) || "/",
          })),
          ...page.items.map((object) => ({
            kind: "object" as const,
            key: object.key,
            name: object.key.slice(prefix.length) || object.key,
            size_bytes: object.size,
            updated_at: object.last_modified,
            etag: object.etag,
          })),
        ],
        next_cursor: page.is_truncated ? page.next_cursor : undefined,
      };
    },
    errorNotification: {
      id: withId("storage-objects", bucketId, JSON.stringify(prefix)),
      action: "对象列表加载",
    },
  });
  const { actions } = useStorageObjectActions(bucketId, refresh);
  useEffect(() => {
    if (lastRefreshVersion.current !== refreshVersion) {
      lastRefreshVersion.current = refreshVersion;
      refresh();
    }
  }, [refreshVersion, refresh]);
  return (
    <>
      <ObjectBrowser
        prefix={prefix}
        rootPrefix=""
        entries={items}
        pagination={pagination}
        loading={query.isFetching}
        actions={actions}
        primaryAction={
          <Button type="primary" onClick={() => setUploadVisible(true)}>
            上传对象
          </Button>
        }
        onRefresh={refresh}
        onNavigate={setPrefix}
      />
      {uploadVisible ? (
        <StorageBucketUploadModal
          bucket={{ id: bucketId, name: bucketName }}
          prefix={prefix}
          onCancel={() => setUploadVisible(false)}
          onUploaded={refresh}
        />
      ) : null}
    </>
  );
}
