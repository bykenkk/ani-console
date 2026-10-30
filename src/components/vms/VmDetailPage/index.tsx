import { useQuery } from "@tanstack/react-query";
import { getVm } from "@/api/vms";
import {
  AliIcon,
  DetailPageFrame,
  DetailPagePlaceholder,
  ResourceId,
  ResourceNameId,
  StatusBadge,
} from "@/components/common";
import ResourceActionMenu from "@/components/common/ResourceActionMenu";
import InstanceLogs from "@/components/instances/InstanceLogs";
import InstanceMetrics from "@/components/instances/InstanceMetrics";
import InstanceStorage from "@/components/instances/InstanceStorage";
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
  const compute = [
    vm.cpuMillis ? `${Number(vm.cpuMillis) / 1000}C` : "-",
    vm.memoryMib ? `${Number(vm.memoryMib) / 1024} GiB` : "-",
  ].join(" / ");
  // TODO(vm-integration): 新详情、磁盘、介质及快照流程仍需在已部署且允许访问的环境联调。
  return (
    <>
      <DetailPageFrame
        breadcrumbs={[...navigationBreadcrumbsForPath("/vms"), { label: vm.name }]}
        title={vm.name}
        status={<StatusBadge status={vm.observedState} reason={vm.reason} loading={false} />}
        icon={<AliIcon name="yunzhuji" size={28} />}
        headerItems={[{ label: "CPU / 内存", value: compute }]}
        actions={
          <ResourceActionMenu
            record={vm}
            actions={actions.filter((action) => action.key !== "termination-protection")}
          />
        }
        cards={[
          {
            key: "basic",
            title: "基本信息",
            fields: [
              { label: "ID", value: <ResourceId value={vm.id} /> },
              { label: "CPU / 内存", value: compute },
              {
                label: "创建时规格",
                value: (
                  <ResourceNameId name={vm.presetName || "-"} id={vm.presetId} openable={false} />
                ),
              },
              { label: "系统盘", value: vm.systemDiskSizeGb ? `${vm.systemDiskSizeGb} GB` : "-" },
              {
                label: "创建时操作系统",
                value: [vm.osFamily, vm.osVersion].filter(Boolean).join(" ") || "-",
              },
              { label: "当前节点", value: vm.runtime?.nodeName || "-" },
              { label: "本次运行开始", value: formatDateTime(vm.runtime?.startedAt) },
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
              {
                label: "实际状态",
                value: <StatusBadge status={vm.observedState} reason={vm.reason} loading={false} />,
              },
              {
                label: "目标状态",
                value: <StatusBadge status={vm.desiredState} loading={false} />,
              },
              { label: "状态更新时间", value: formatDateTime(vm.observedAt) },
              ...(vm.closing
                ? [
                    {
                      label: "删除状态",
                      value: <StatusBadge status="deleting">删除中</StatusBadge>,
                    },
                  ]
                : []),
              { label: "DNS 服务器", value: vm.dns?.nameservers?.join(" · ") || "-" },
            ],
          },
          {
            key: "related-summary",
            title: "关联摘要",
            fields: [
              {
                label: "VPC",
                value: (
                  <ResourceNameId
                    name={vm.relations?.vpc?.name || "-"}
                    id={vm.relations?.vpc?.id}
                    type="vpc"
                  />
                ),
              },
              {
                label: "子网",
                value: (
                  <ResourceNameId
                    name={vm.relations?.subnet?.name || "-"}
                    id={vm.relations?.subnet?.id}
                    type="subnet"
                  />
                ),
              },
              {
                label: "安全组",
                value: vm.security_group_ids?.length ? (
                  <div className="flex flex-col gap-2">
                    {vm.security_group_ids.map((id) => (
                      <ResourceNameId
                        key={id}
                        name={
                          vm.relations?.securityGroups?.find((group) => group.id === id)?.name ||
                          "-"
                        }
                        id={id}
                        type="security-group"
                      />
                    ))}
                  </div>
                ) : (
                  "-"
                ),
              },
              { label: "文件存储", value: "-" },
              {
                label: "创建时系统来源",
                value: (
                  <ResourceNameId
                    name={vm.sourceMedia?.name || "-"}
                    id={vm.mediaKey}
                    openable={false}
                  />
                ),
              },
              { label: "密钥", value: "-" },
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
          {
            key: "storage",
            label: "存储挂载",
            content: <InstanceStorage diskContent={<VmDisks vm={vm} />} />,
          },
          { key: "network", label: "网络", content: <VmNetwork vm={vm} /> },
          { key: "configuration", label: "创建配置", content: <VmConfiguration vm={vm} /> },
          { key: "guest", label: "来宾信息", content: <VmGuestInfo vm={vm} /> },
          { key: "media", label: "光盘与启动", content: <VmMediaDevices vm={vm} /> },
          { key: "snapshots", label: "快照", content: <VmSnapshots vm={vm} /> },
          // TODO(vm-metrics): Gov 新版部署后联调 VM ID 的实例指标查询与 instance:read 权限。
          {
            key: "monitoring",
            label: "资源监控",
            content: <InstanceMetrics instanceId={vm.id} />,
          },
          {
            key: "logs",
            label: "日志",
            content: (
              <InstanceLogs
                instanceId={vm.id}
                resourceType="vm"
                active={tab === "logs"}
                onNotFound={goBack}
              />
            ),
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
