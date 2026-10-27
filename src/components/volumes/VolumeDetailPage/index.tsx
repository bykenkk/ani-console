import { Empty } from "@arco-design/web-react";
import { useQuery } from "@tanstack/react-query";
import { getVolume } from "@/api/storage/volumes";
import { useStorageVolumeActions } from "@/hooks/useStorageVolumeActions";
import { useBackOrFallback } from "@/hooks/useBackOrFallback";
import { withId } from "@/lib/id";
import { formatBytes } from "@/lib/format";
import { navigationBreadcrumbsForPath } from "@/layouts/AppLayout/navigation";
import {
  AliIcon,
  DetailPageFrame,
  DetailPagePlaceholder,
  ResourceId,
  StatusBadge,
} from "@/components/common";
import ResourceActionMenu from "@/components/common/ResourceActionMenu";
import VolumeConsumers from "./VolumeConsumers";
import VolumeObservations from "./VolumeObservations";

type VolumeDetailPageProps = { volumeId: string; tab?: string; onTabChange: (tab: string) => void };
export default function VolumeDetailPage({ volumeId, tab, onTabChange }: VolumeDetailPageProps) {
  const goBack = useBackOrFallback("volume");
  const detail = useQuery({
    queryKey: ["storage", "volume", volumeId],
    queryFn: ({ signal }) => getVolume(volumeId, signal),
    meta: { errorNotification: { id: withId("storage-volume", volumeId), action: "块存储卷加载" } },
  });
  const { actions, dialogNode } = useStorageVolumeActions(goBack);
  if (!detail.data) return <DetailPagePlaceholder loading={detail.isLoading} />;
  const { volume, consumers, conditions, events } = detail.data;
  if (!volume) return <DetailPagePlaceholder loading={false} />;
  const consumerNames = consumers.map((item) => item.name).join("、");
  return (
    <>
      <DetailPageFrame
        breadcrumbs={[...navigationBreadcrumbsForPath("/volumes"), { label: volume.display_name }]}
        title={volume.display_name || volume.pvc_name}
        status={<StatusBadge status={volume.deleting ? "deleting" : volume.phase} />}
        icon={<AliIcon name="kuaicunchu" size={28} />}
        headerItems={[{ label: "容量 (GB)", value: volume.requested_capacity_gb }]}
        actions={<ResourceActionMenu record={volume} actions={actions} />}
        cards={[
          {
            key: "basic",
            title: "基本信息",
            fields: [
              { label: "ID", value: <ResourceId value={volume.pvc_name} /> },
              { label: "UID", value: <ResourceId value={volume.uid} /> },
              { label: "用途", value: volume.volume_mode === "Block" ? "块设备" : "文件系统" },
              {
                label: "容量 / 类型",
                value: `${volume.requested_capacity_gb} GB · ${volume.storage_class_name}`,
              },
              {
                label: "观测容量",
                value: volume.observed_capacity_known
                  ? formatBytes(Number(volume.observed_capacity_bytes))
                  : "未知",
              },
              {
                label: "原始容量",
                value: volume.observed_capacity_known ? volume.observed_capacity_quantity : "未知",
              },
              { label: "访问模式", value: volume.access_modes.join(" / ") },
              {
                label: "回收策略",
                value: volume.reclaim_policy_known ? volume.reclaim_policy : "未知",
              },
              // TODO(storage-migration): 新卷没有以下旧扩展字段；保留位置，待正式契约补齐，不用旧详情拼接。
              { label: "可用区 / IOPS", value: "-" },
              { label: "加密", value: "-" },
              { label: "自动快照", value: "-" },
              { label: "来源快照", value: "-" },
              { label: "挂载实例", value: consumerNames || "-" },
              { label: "OS 初始化", value: "-" },
              { label: "约束", value: "使用中不可删 · 扩容不可缩 · 用途不可修改" },
              { label: "创建时间", value: "-" },
            ],
          },
          {
            key: "related-summary",
            title: "关联摘要",
            fields: [{ label: "使用方", value: consumerNames || "-" }],
          },
        ]}
        tabs={[
          { key: "related", label: "关联资源", content: <VolumeConsumers consumers={consumers} /> },
          // TODO(storage-migration): 保留 VolumeSnapshots、VolumeAutoSnapshot、VolumeMountHistory 的旧实现；新 PVC 禁止调用旧接口。
          { key: "snapshots", label: "快照", content: <Empty description="快照暂未接入" /> },
          {
            key: "auto-snapshot",
            label: "自动快照",
            content: <Empty description="自动快照暂未接入" />,
          },
          {
            key: "mount-history",
            label: "挂载历史",
            content: <Empty description="挂载历史暂未接入" />,
          },
          {
            key: "events",
            label: "事件",
            content: <VolumeObservations conditions={conditions} events={events} />,
          },
        ]}
        activeTabKey={tab}
        onTabChange={onTabChange}
        onBack={goBack}
      />
      {dialogNode}
    </>
  );
}
