import { useQuery } from "@tanstack/react-query";
import { getStorageObject } from "@/api/storage/objects";
import { useStorageObjectActions } from "@/hooks/useStorageObjectActions";
import { useBackOrFallback } from "@/hooks/useBackOrFallback";
import { AliIcon, DetailPageFrame, DetailPagePlaceholder, ResourceId } from "@/components/common";
import ResourceActionMenu from "@/components/common/ResourceActionMenu";
import { navigationBreadcrumbsForPath } from "@/layouts/AppLayout/navigation";
import { formatBytes, formatDateTime } from "@/lib/format";
import { withId } from "@/lib/id";

type ObjectDetailPageProps = { bucketId: string; objectId: string };

export default function ObjectDetailPage({ bucketId, objectId: objectKey }: ObjectDetailPageProps) {
  const goBack = useBackOrFallback("object", bucketId);
  // 路由 params 已解码；objectId 路由槽承载原始 key，不再次 decode/trim。
  const detail = useQuery({
    queryKey: ["storage", "object", bucketId, objectKey],
    queryFn: ({ signal }) => getStorageObject({ bucket_id: bucketId, key: objectKey }, signal),
    meta: {
      errorNotification: {
        id: withId("storage-object", bucketId, JSON.stringify(objectKey)),
        action: "对象加载",
      },
    },
  });
  const { actions } = useStorageObjectActions(bucketId);
  if (!detail.data) return <DetailPagePlaceholder loading={detail.isLoading} />;
  const object = detail.data;
  return (
    <DetailPageFrame
      breadcrumbs={[
        ...navigationBreadcrumbsForPath("/objects"),
        { label: bucketId, to: "/objects/$bucketId", params: { bucketId } },
        { label: object.key },
      ]}
      title={object.key}
      icon={<AliIcon name="file" size={28} />}
      headerItems={[{ label: "大小", value: formatBytes(Number(object.size)) }]}
      actions={<ResourceActionMenu record={object} actions={actions} />}
      // TODO(storage-migration): HEAD 未返回旧对象 ID、状态和创建时间，不伪造旧字段。
      cards={[
        {
          key: "basic",
          title: "基本信息",
          fields: [
            { label: "ID", value: "-" },
            { label: "Bucket", value: <ResourceId value={bucketId} /> },
            { label: "Key", value: object.key },
            { label: "大小", value: formatBytes(Number(object.size)) },
            { label: "类型", value: object.content_type || "-" },
            { label: "ETag", value: object.etag || "-" },
            { label: "创建时间", value: "-" },
            { label: "更新时间", value: formatDateTime(object.last_modified) },
          ],
        },
      ]}
      onBack={goBack}
    />
  );
}
