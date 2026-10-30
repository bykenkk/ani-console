import { Button, Empty } from "@arco-design/web-react";
import { getInstance, getInstanceConfiguration, getInstanceRuntime } from "@/api/instances";
import { useQuery } from "@tanstack/react-query";
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
import InstanceOperationObserver from "@/components/instances/InstanceOperationObserver";

type ContainerDetailPageProps = {
  instanceId: string;
  tab?: string;
  onTabChange: (tab: string) => void;
};

export default function ContainerDetailPage({
  instanceId,
  tab,
  onTabChange,
}: ContainerDetailPageProps) {
  const goBack = useBackOrFallback("container-instance");
  const current = useQuery({
    queryKey: ["governance-instance", instanceId],
    queryFn: ({ signal }) => getInstance(instanceId, signal),
    refetchInterval: (query) => (query.state.data?.activeOperationId ? 4000 : false),
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
  const primaryAction = actions.find((action) => action.key === "terminal");
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
        headerItems={[
          { label: "镜像", value: record.imageId || "-" },
          {
            label: "CPU / 内存",
            value: [record.cpu || "-", record.memory || "-"].join(" / "),
          },
          // TODO(container-private-ip): 当前契约未返回私网 IP，待正式字段补齐后接入，不以 Pod IP 替代。
          { label: "私网 IP", value: "-" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              type="primary"
              disabled={!primaryAction || primaryAction.disabled?.(record)}
              loading={primaryAction?.loading?.(record)}
              onClick={() => primaryAction?.onClick(record)}
            >
              远程终端
            </Button>
            <ResourceActionMenu
              record={record}
              actions={actions.filter((action) => action.key !== "terminal")}
            />
          </div>
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
                loading={configuration.isFetching}
              />
            ),
          },
          {
            key: "storage",
            label: "数据卷",
            content: (
              <InstanceStorage
                instance={record}
                configuration={configuration.data}
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
                loading={configuration.isFetching}
              />
            ),
          },
          {
            key: "monitoring",
            label: "资源监控",
            content: <InstanceMetrics instanceId={instanceId} computeType={record.compute_type} />,
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
                operationId={
                  record.activeOperationId || record.lastOperationId || record.createOperationId
                }
              />
            ),
          },
        ]}
        activeTabKey={tab}
        onTabChange={onTabChange}
        onBack={goBack}
      />
      <InstanceOperationObserver
        key={instanceId}
        instanceId={instanceId}
        operationId={record.activeOperationId}
      />
      {dialogNode}
    </>
  );
}
