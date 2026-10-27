import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Button, Tooltip } from "@arco-design/web-react";
import { listStorageObjects } from "@/api/storage/objects";
import { useCursorPaginatedQuery } from "@/hooks/useCursorPaginatedQuery";
import { useStorageObjectActions } from "@/hooks/useStorageObjectActions";
import ObjectBrowser, { type ObjectBrowserEntry } from "@/components/objects/ObjectBrowser";

type StorageBucketObjectsProps = { bucketId: string; bucketName: string };

export default function StorageBucketObjects({ bucketId, bucketName }: StorageBucketObjectsProps) {
  const [prefix, setPrefix] = useState("");
  const navigate = useNavigate();
  const { query, items, pagination } = useCursorPaginatedQuery<ObjectBrowserEntry>({
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
          })),
        ],
        next_cursor: page.is_truncated ? page.next_cursor : undefined,
      };
    },
    errorNotification: {
      id: JSON.stringify(["storage-objects", bucketId, prefix]),
      action: "对象列表加载",
    },
  });
  const { actions } = useStorageObjectActions(bucketId);
  return (
    <ObjectBrowser
      bucketName={bucketName}
      prefix={prefix}
      rootPrefix=""
      entries={items}
      pagination={pagination}
      aclLabel="-"
      loading={query.isFetching}
      actions={actions}
      readOnly
      // TODO(storage-migration): 上传和新建目录保留 BucketObjects 旧实现，待新契约补齐后恢复。
      primaryAction={
        <Tooltip content="暂未支持">
          <Button type="primary" disabled>
            上传对象
          </Button>
        </Tooltip>
      }
      onNavigate={setPrefix}
      onCreateFolder={() => {}}
      onOpenObject={(entry) => {
        // 点号独立作为路径段会被浏览器归一化；仅这两种 key 通过搜索参数原样传递。
        const dotKey = entry.key === "." || entry.key === "..";
        navigate({
          to: "/objects/$bucketId/$objectId",
          params: { bucketId, objectId: dotKey ? "object" : entry.key },
          search: { key: dotKey ? entry.key : undefined },
        });
      }}
    />
  );
}
