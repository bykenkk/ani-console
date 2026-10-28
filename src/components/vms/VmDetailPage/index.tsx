import { useQuery } from "@tanstack/react-query";
import { getVm } from "@/api/vms";
import {
  AliIcon,
  DetailPageFrame,
  DetailPagePlaceholder,
  ResourceId,
  StatusBadge,
} from "@/components/common";
import ResourceActionMenu from "@/components/common/ResourceActionMenu";
import InstanceEvents from "@/components/instances/InstanceEvents";
import InstanceLogs from "@/components/instances/InstanceLogs";
import InstanceMetrics from "@/components/instances/InstanceMetrics";
import InstanceOperations from "@/components/instances/InstanceOperations";
import InstanceStorage from "@/components/instances/InstanceStorage";
import { useVMActions } from "@/hooks/useVMActions";
import { useBackOrFallback } from "@/hooks/useBackOrFallback";
import { navigationBreadcrumbsForPath } from "@/layouts/AppLayout/navigation";
import { formatDateTime } from "@/lib/format";
import { withId } from "@/lib/id";
import { openInstanceVncWindow } from "@/lib/instances";
import VmSnapshots from "./VmSnapshots";
import VmSshAccess from "./VmSshAccess";
import VmDisks from "./VmDisks";
import VmMediaDevices from "./VmMediaDevices";

type VmDetailPageProps = {
  instanceId: string;
  tab?: string;
  onTabChange: (tab: string) => void;
};

export default function VmDetailPage({ instanceId, tab, onTabChange }: VmDetailPageProps) {
  const goBack = useBackOrFallback("vm-instance");
  const detail = useQuery({
    queryKey: ["vms", instanceId],
    queryFn: ({ signal }) => getVm(instanceId, signal),
    meta: { errorNotification: { id: withId("vm", instanceId), action: "云主机详情加载" } },
  });
  const { actions, dialogNode } = useVMActions(detail.data ? [detail.data] : [], goBack);
  if (!detail.data) return <DetailPagePlaceholder loading={detail.isLoading} />;
  const vm = detail.data;
  const spec = `${Number(vm.cpuMillis) / 1000} CPU / ${vm.memoryMib} MiB`;
  // TODO(vm-detail-fields): 新详情缺少终止保护、节点、自动启动、安全组、创建时间及网络关联，保留原字段占位。
  // TODO(vm-integration): 新详情、磁盘、介质及快照流程仍需在已部署且允许访问的环境联调。
  return (
    <>
      <DetailPageFrame
        breadcrumbs={[...navigationBreadcrumbsForPath("/vms"), { label: vm.name }]}
        title={vm.name}
        status={<StatusBadge status={vm.observedState} reason={vm.reason} />}
        icon={<AliIcon name="yunzhuji" size={28} />}
        headerItems={[{ label: "CPU / 内存", value: spec }]}
        actions={<ResourceActionMenu record={vm} actions={actions} />}
        cards={[
          {
            key: "basic",
            title: "基本信息",
            fields: [
              { label: "ID", value: <ResourceId value={vm.id} /> },
              { label: "终止保护", value: "-" },
              { label: "规格", value: vm.presetId || "-" },
              { label: "镜像", value: "-" },
              { label: "系统介质", value: vm.mediaKey || "-" },
              {
                label: "操作系统",
                value: [vm.osFamily, vm.osVersion].filter(Boolean).join(" ") || "-",
              },
              { label: "节点", value: "-" },
              { label: "CPU / 内存", value: spec },
              { label: "私网 IP", value: "-" },
              {
                label: "观测地址",
                value:
                  vm.addresses?.map((item) => `${item.nicName}: ${item.address}`).join(" · ") ||
                  "-",
              },
              { label: "自动启动", value: "-" },
              { label: "安全组", value: "-" },
              { label: "创建时间", value: "-" },
              { label: "期望状态", value: vm.desiredState || "-" },
              { label: "观测状态", value: vm.observedState || "-" },
              { label: "原因", value: vm.reason || "-" },
              { label: "观测时间", value: formatDateTime(vm.observedAt) },
              { label: "系统盘容量 (GB)", value: vm.systemDiskSizeGb || "-" },
              {
                label: "启动设备",
                value:
                  vm.bootDevice === "SYSTEM_DISK"
                    ? "系统盘"
                    : vm.bootDevice === "INSTALL_MEDIA"
                      ? "安装介质"
                      : "-",
              },
              {
                label: "DNS 模式",
                value:
                  vm.dns?.mode === "PLATFORM_DEFAULT"
                    ? "平台默认"
                    : vm.dns?.mode === "CUSTOM"
                      ? "自定义"
                      : "-",
              },
              { label: "DNS 服务器", value: vm.dns?.nameservers?.join(" · ") || "-" },
            ],
          },
          {
            key: "related-summary",
            title: "关联摘要",
            fields: [
              { label: "VPC", value: "-" },
              { label: "子网", value: "-" },
              { label: "安全组", value: "-" },
              { label: "文件存储", value: "-" },
              { label: "镜像", value: "-" },
              { label: "密钥", value: "-" },
              { label: "负载均衡", value: "-" },
              ...(vm.disks ?? []).map((disk) => ({
                label: disk.role || "磁盘",
                value: `${disk.name || "-"} · ${disk.diskId}`,
              })),
            ],
          },
        ]}
        tabs={[
          {
            key: "ssh",
            label: "远程连接",
            content: <VmSshAccess vm={vm} onOpenConsole={() => openInstanceVncWindow(vm.id)} />,
          },
          {
            key: "storage",
            label: "存储挂载",
            content: <InstanceStorage diskContent={<VmDisks vm={vm} />} />,
          },
          { key: "media", label: "介质与启动", content: <VmMediaDevices vm={vm} /> },
          { key: "snapshots", label: "快照", content: <VmSnapshots vm={vm} /> },
          // TODO(vm-observability): VM 的监控、日志、事件契约未提供，沿用公共组件空态，不传 VM ID 到容器接口。
          { key: "monitoring", label: "资源监控", content: <InstanceMetrics /> },
          { key: "logs", label: "日志", content: <InstanceLogs active={tab === "logs"} /> },
          { key: "events", label: "事件", content: <InstanceEvents /> },
          // TODO(vm-operations): VM 操作查询及历史记录统一暂缓，保留原有入口。
          { key: "operations", label: "操作记录", content: <InstanceOperations /> },
        ]}
        activeTabKey={tab}
        onTabChange={onTabChange}
        onBack={goBack}
      />
      {dialogNode}
    </>
  );
}
