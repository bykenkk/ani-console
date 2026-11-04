import { useQuery } from "@tanstack/react-query";
import { Button } from "@arco-design/web-react";
import { getVm } from "@/api/vms";
import {
  AliIcon,
  DetailPageFrame,
  DetailPagePlaceholder,
  ResourceId,
  StatusBadge,
} from "@/components/common";
import ResourceActionMenu from "@/components/common/ResourceActionMenu";
import InstanceLogs from "@/components/instances/InstanceLogs";
import InstanceMetrics from "@/components/instances/InstanceMetrics";
import { useVMActions } from "@/hooks/useVMActions";
import { useBackOrFallback } from "@/hooks/useBackOrFallback";
import { navigationBreadcrumbsForPath } from "@/layouts/AppLayout/navigation";
import { withId } from "@/lib/id";
import { formatDateTime } from "@/lib/format";
// TODO(feature-visibility): 待云主机远程连接支持后恢复控制台打开方法导入。
// import { openInstanceVncWindow } from "@/lib/instances";
import VmSnapshots from "./VmSnapshots";
// TODO(feature-visibility): 待云主机远程连接支持后恢复此组件导入。
// import VmSshAccess from "./VmSshAccess";
import VmDisks from "./VmDisks";
import VmMediaDevices from "./VmMediaDevices";
import VmNetwork from "./VmNetwork";
import VmConfiguration from "./VmConfiguration";
import VmGuestInfo from "./VmGuestInfo";

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
  const consoleAction = actions.find((action) => action.key === "console");
  return (
    <>
      <DetailPageFrame
        breadcrumbs={[...navigationBreadcrumbsForPath("/vms"), { label: vm.name }]}
        title={vm.name}
        status={<StatusBadge status={vm.observedState} reason={vm.reason} loading={false} />}
        icon={<AliIcon name="yunzhuji" size={28} />}
        headerItems={[{ label: "规格", value: vm.presetName || "-" }]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              type="primary"
              disabled={!consoleAction || consoleAction.disabled?.(vm)}
              loading={consoleAction?.loading?.(vm)}
              onClick={() => consoleAction?.onClick(vm)}
            >
              打开控制台
            </Button>
            <ResourceActionMenu
              record={vm}
              actions={actions.filter(
                (action) => action.key !== "termination-protection" && action.key !== "console",
              )}
            />
          </div>
        }
        cards={[
          {
            key: "basic",
            title: "基本信息",
            fields: [
              { label: "ID", value: <ResourceId value={vm.id} /> },
              {
                label: "规格",
                value: <span title={vm.presetName}>{vm.presetName || "-"}</span>,
              },
              {
                label: "系统盘容量",
                value: vm.systemDiskSizeGb ? `${vm.systemDiskSizeGb} GB` : "-",
              },
              {
                label: "操作系统",
                value: vm.sourceMedia?.name || "-",
              },
              { label: "所在节点", value: vm.runtime?.nodeName || "-" },
              {
                label: "IP 地址",
                value:
                  vm.addresses
                    ?.map((item) => item.address)
                    .filter(Boolean)
                    .join(" · ") || "-",
              },
              {
                label: "创建方式",
                value:
                  vm.sourceKind === "DISK_IMAGE"
                    ? "系统镜像"
                    : vm.sourceKind === "INSTALL_ISO"
                      ? "安装光盘（ISO）"
                      : "-",
              },
              { label: "创建时间", value: formatDateTime(vm.createdAt) },
              { label: "启动时间", value: formatDateTime(vm.runtime?.startedAt) },
            ],
          },
          {
            key: "related-summary",
            title: "关联摘要",
            fields: [
              {
                label: "VPC",
                value: (
                  <span title={vm.relations?.vpc?.name}>{vm.relations?.vpc?.name || "-"}</span>
                ),
              },
              {
                label: "子网",
                value: (
                  <span title={vm.relations?.subnet?.name}>
                    {vm.relations?.subnet?.name || "-"}
                  </span>
                ),
              },
              {
                label: "安全组",
                value: vm.security_group_ids?.length ? (
                  <div className="flex flex-col gap-2">
                    {vm.security_group_ids.map((id) => {
                      const name = vm.relations?.securityGroups?.find(
                        (group) => group.id === id,
                      )?.name;
                      return (
                        <span key={id} title={name}>
                          {name || "-"}
                        </span>
                      );
                    })}
                  </div>
                ) : (
                  "-"
                ),
              },
              { label: "负载均衡", value: "-" },
            ],
          },
        ]}
        tabs={[
          // TODO(feature-visibility): 待云主机远程连接支持后恢复此 Tab 入口。
          // {
          //   key: "ssh",
          //   label: "远程连接",
          //   content: <VmSshAccess vm={vm} onOpenConsole={() => openInstanceVncWindow(vm.id)} />,
          // },
          { key: "guest", label: "系统信息", content: <VmGuestInfo vm={vm} /> },
          { key: "configuration", label: "初始化配置", content: <VmConfiguration vm={vm} /> },
          { key: "media", label: "启动与介质", content: <VmMediaDevices vm={vm} /> },
          {
            key: "storage",
            label: "存储挂载",
            content: <VmDisks vm={vm} />,
          },
          {
            key: "network",
            label: "网络",
            content: (
              <VmNetwork
                vm={vm}
                busy={
                  vm.closing ||
                  ["Starting", "Stopping", "Deleting", "Provisioning"].includes(vm.observedState)
                }
              />
            ),
          },
          { key: "snapshots", label: "快照", content: <VmSnapshots vm={vm} /> },
          {
            key: "monitoring",
            label: "资源监控",
            content: <InstanceMetrics instanceId={vm.id} />,
          },
          {
            key: "logs",
            label: "日志",
            fill: true,
            content: <InstanceLogs instanceId={vm.id} instanceType="vm" />,
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
