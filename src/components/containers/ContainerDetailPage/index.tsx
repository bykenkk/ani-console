import { Empty } from "@arco-design/web-react";
import { getInstance, getInstanceConfiguration, getInstanceRuntime } from "@/api/instances";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useBackOrFallback } from "@/hooks/useBackOrFallback";
import {
  AliIcon,
  DetailPageFrame,
  DetailPagePlaceholder,
  ResourceId,
  StatusBadge,
} from "@/components/common";
import ResourceActionMenu from "@/components/common/ResourceActionMenu";
import { useContainerActions } from "@/hooks/useContainerActions";
import { navigationBreadcrumbsForPath } from "@/layouts/AppLayout/navigation";
import { formatDateTime } from "@/lib/format";
import { withId } from "@/lib/id";
import InstanceLogs from "@/components/instances/InstanceLogs";
import InstanceVersions from "@/components/instances/InstanceVersions";
import InstanceEvents from "@/components/instances/InstanceEvents";
import InstanceConfiguration from "@/components/instances/InstanceConfiguration";
import InstanceStorage from "@/components/instances/InstanceStorage";
import InstanceNetwork from "@/components/instances/InstanceNetwork";
import InstanceMetrics from "@/components/instances/InstanceMetrics";
import InstanceOperations from "@/components/instances/InstanceOperations";

type ContainerDetailPageProps = {
  instanceId: string;
  tab?: string;
  onTabChange: (tab: string) => void;
};
const completion = (value?: boolean) => (value === undefined ? "-" : value ? "已完成" : "未完成");
const PLACEMENT_LABELS = {
  NONE: "无偏好",
  COLOCATE_PREFERRED: "优先集中",
  SPREAD_PREFERRED: "优先分散",
};

export default function ContainerDetailPage({
  instanceId,
  tab,
  onTabChange,
}: ContainerDetailPageProps) {
  const goBack = useBackOrFallback("container-instance");
  const qc = useQueryClient();
  const current = useQuery({
    queryKey: ["governance-instance", instanceId],
    queryFn: ({ signal }) => getInstance(instanceId, signal),
    meta: { errorNotification: { id: withId("instance", instanceId), action: "实例详情加载" } },
  });
  const isContainer =
    current.data?.instance_kind === "container" && current.data.compute_type === "cpu";
  const runtime = useQuery({
    queryKey: ["governance-instance-runtime", instanceId],
    enabled: isContainer,
    queryFn: ({ signal }) => getInstanceRuntime(instanceId, signal),
    meta: {
      errorNotification: { id: withId("instance-runtime", instanceId), action: "运行状态加载" },
    },
  });
  const configuration = useQuery({
    queryKey: ["governance-instance-configuration", instanceId],
    enabled: isContainer,
    queryFn: ({ signal }) => getInstanceConfiguration(instanceId, signal),
    gcTime: 0,
    meta: {
      errorNotification: {
        id: withId("instance-configuration", instanceId),
        action: "实例配置加载",
      },
    },
  });
  const { actions, dialogNode } = useContainerActions(() => {}, goBack);
  const refreshInstance = async () => {
    await Promise.all([
      current.refetch(),
      runtime.refetch(),
      configuration.refetch(),
      qc.invalidateQueries({ queryKey: ["governance-instances"] }),
    ]);
  };
  if (!current.data) return <DetailPagePlaceholder loading={current.isLoading} />;
  const record = current.data;
  if (!isContainer) return <Empty description="当前资源不是普通容器" />;
  return (
    <>
      <DetailPageFrame
        breadcrumbs={[...navigationBreadcrumbsForPath("/containers"), { label: record.name }]}
        title={record.name}
        icon={<AliIcon name="icon-rongqishili" size={28} />}
        status={<StatusBadge status={record.observedState} reason={record.reason} />}
        headerItems={[{ label: "期望状态", value: record.desiredState }]}
        actions={
          <ResourceActionMenu
            record={record}
            actions={[...actions, { key: "refresh", label: "刷新", onClick: refreshInstance }]}
          />
        }
        cards={[
          {
            key: "basic",
            title: "基本信息",
            fields: [
              { label: "ID", value: <ResourceId value={record.id} /> },
              { label: "节点", value: runtime.data?.pod?.nodeName ?? "-" },
              { label: "创建时间", value: formatDateTime(record.createdAt) },
              // FIXME(container-basic): 当前详情无更新时间和终止保护，不能从其他实例契约补齐。
              // TODO(container-basic): 后端提供正式字段后接入，保留现有字段位置。
              { label: "更新时间", value: "-" },
              { label: "终止保护", value: "-" },
              {
                label: "实例预设",
                value: record.preset_name || record.preset_code || record.presetId,
              },
              { label: "CPU / 内存", value: `${record.cpu} / ${record.memory}` },
              { label: "工作空间容量", value: record.workspaceSize || "-" },
              {
                label: "调度偏好",
                value: record.scheduling?.pod_placement
                  ? PLACEMENT_LABELS[record.scheduling.pod_placement]
                  : "-",
              },
              { label: "优先级", value: record.scheduling?.priority_class_name || "-" },
            ],
          },
          {
            key: "resource",
            title: "资源状态",
            defaultCollapsed: true,
            fields: [
              {
                label: "副本",
                value: `${runtime.data?.statefulSet?.readyReplicas ?? "-"}/${runtime.data?.statefulSet?.desiredReplicas ?? "-"}`,
              },
              // FIXME(container-release): 当前无发布状态和访问地址，不能用 Pod 状态或 IP 替代。
              // TODO(container-release): 后端提供发布与地址契约后补齐。
              { label: "发布状态", value: "-" },
              { label: "访问地址", value: "-" },
              { label: "VPC", value: configuration.data?.network?.vpc_id ?? "-" },
              { label: "子网", value: configuration.data?.network?.subnet_id ?? "-" },
              {
                label: "网络状态",
                value: (
                  <StatusBadge status={record.networkState} reason={record.networkReason}>
                    {record.networkState === "not_requested" ? "未配置" : undefined}
                  </StatusBadge>
                ),
              },
              { label: "计算清理", value: completion(record.computeCleaned) },
              { label: "工作空间清理", value: completion(record.workspaceCleaned) },
              { label: "网络清理", value: completion(record.networkCleaned) },
              { label: "用户卷引用解除", value: completion(record.volumeReferencesReleased) },
              { label: "配额归还", value: completion(record.quotaReturned) },
            ],
          },
        ]}
        tabs={[
          {
            key: "release",
            label: "版本",
            content: <InstanceVersions currentImage={record} />,
          },
          {
            key: "configuration",
            label: "配置",
            content: (
              <InstanceConfiguration
                configuration={configuration.data}
                runtime={runtime.data}
                loading={configuration.isFetching}
              />
            ),
          },
          {
            key: "storage",
            label: "数据卷",
            content: (
              <InstanceStorage
                configuration={configuration.data}
                workspaceSize={record.workspaceSize}
                runtime={runtime.data}
                loading={configuration.isFetching}
              />
            ),
          },
          {
            key: "network",
            label: "网络",
            content: (
              <InstanceNetwork
                configuration={configuration.data}
                networkState={record.networkState}
                networkReason={record.networkReason}
                runtime={runtime.data}
                loading={configuration.isFetching}
              />
            ),
          },
          {
            key: "monitoring",
            label: "资源监控",
            content: <InstanceMetrics instanceId={instanceId} />,
          },
          {
            key: "logs",
            label: "日志",
            content: <InstanceLogs instanceId={instanceId} active />,
          },
          {
            key: "events",
            label: "事件",
            content: <InstanceEvents instanceId={instanceId} />,
          },
          {
            key: "operations",
            label: "操作记录",
            content: (
              <InstanceOperations
                operationId={record.lastOperationId || record.createOperationId}
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
