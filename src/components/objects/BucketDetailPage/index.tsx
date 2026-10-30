import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Empty, Tag } from "@arco-design/web-react";
import { getBucketStats, type StorageBucketListResponse } from "@/api/storage/buckets";
import { AliIcon, DetailPageFrame, ResourceId } from "@/components/common";
import ResourceActionMenu from "@/components/common/ResourceActionMenu";
import { useStorageBucketActions } from "@/hooks/useStorageBucketActions";
import { formatBytes, formatDateTime } from "@/lib/format";
import { withId } from "@/lib/id";
import { useBackOrFallback } from "@/hooks/useBackOrFallback";
import { navigationBreadcrumbsForPath } from "@/layouts/AppLayout/navigation";
import StorageBucketObjects from "./StorageBucketObjects";

type BucketDetailPageProps = {
  bucketId: string;
  tab?: string;
  onTabChange: (tab: string) => void;
};

export default function BucketDetailPage({ bucketId, tab, onTabChange }: BucketDetailPageProps) {
  const [objectsVersion, setObjectsVersion] = useState(0);
  const { actions, dialogNode } = useStorageBucketActions(() =>
    setObjectsVersion((value) => value + 1),
  );
  // TODO(storage-runtime): 统计和桶元数据尚未部署，发布后联调空桶、扫描截断及写后刷新。
  const stats = useQuery({
    queryKey: ["storage", "bucket-stats", bucketId],
    queryFn: ({ signal }) => getBucketStats(bucketId, signal),
    meta: {
      errorNotification: { id: withId("storage-bucket-stats", bucketId), action: "存储桶统计加载" },
    },
  });
  const objectCount = stats.data
    ? `${stats.data.truncated ? "≥" : ""}${stats.data.object_count}`
    : "-";
  const totalSize = stats.data
    ? `${stats.data.truncated ? "≥" : ""}${formatBytes(Number(stats.data.total_size))}`
    : "-";
  const goBack = useBackOrFallback("bucket");
  const queryClient = useQueryClient();
  // TODO(storage-migration): 暂无桶详情接口。仅复用已访问列表中的名称，深链直接使用逻辑 ID，不以某页缺失判定桶不存在。
  const cachedBucket = queryClient
    .getQueriesData<StorageBucketListResponse>({
      queryKey: ["storage", "buckets"],
    })
    .flatMap(([, page]) => page?.items ?? [])
    .find((bucket) => bucket.id === bucketId);
  const bucket = cachedBucket ?? { id: bucketId, name: bucketId };
  return (
    <>
      <DetailPageFrame
        breadcrumbs={[...navigationBreadcrumbsForPath("/objects"), { label: bucket.name }]}
        title={bucket.name}
        status={<Tag>-</Tag>}
        icon={<AliIcon name="duixiangcunchu1" size={28} />}
        headerItems={[{ label: "对象数", value: objectCount }]}
        actions={<ResourceActionMenu record={bucket} actions={actions} />}
        cards={[
          {
            key: "basic",
            title: "基本信息",
            fields: [
              { label: "存储桶ID", value: <ResourceId value={bucket.id} /> },
              { label: "存储桶名称", value: bucket.name },
              { label: "权限", value: cachedBucket?.acl || "-" },
              { label: "存储类型", value: cachedBucket?.storage_class || "-" },
              { label: "对象数", value: objectCount },
              { label: "总大小", value: totalSize },
              {
                label: "创建时间",
                value: cachedBucket?.created_at ? formatDateTime(cachedBucket.created_at) : "-",
              },
              { label: "更新时间", value: "-" },
            ],
          },
        ]}
        // TODO(storage-migration): BucketAclEditor、BucketLifecycle、BucketAccess 保留旧实现；新逻辑桶不调用旧接口。
        tabs={[
          {
            key: "objects",
            label: "文件",
            content: (
              <StorageBucketObjects
                key={bucketId}
                bucketId={bucketId}
                bucketName={bucket.name}
                refreshVersion={objectsVersion}
              />
            ),
          },
          {
            key: "permissions",
            label: "权限管理",
            content: <Empty description="权限管理暂未接入" />,
          },
          {
            key: "lifecycle",
            label: "生命周期",
            content: <Empty description="生命周期暂未接入" />,
          },
          { key: "access", label: "访问域名", content: <Empty description="访问域名暂未接入" /> },
        ]}
        activeTabKey={tab}
        onTabChange={onTabChange}
        onBack={goBack}
      />
      {dialogNode}
    </>
  );
}
