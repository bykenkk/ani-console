import { Empty } from "@arco-design/web-react";
import * as legacy from "@/api/instances/legacy";
import { getInstance, getInstanceRuntime } from "@/api/instances";
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
import { getInstanceNetworkValue } from "@/lib/instances";
import { withId } from "@/lib/id";
import InstanceLogs from "@/components/instances/InstanceLogs";
import InstanceVersions from "@/components/instances/InstanceVersions";
import InstanceConfiguration from "@/components/instances/InstanceConfiguration";
import InstanceEvents from "@/components/instances/InstanceEvents";
import InstanceMetrics from "@/components/instances/InstanceMetrics";
import InstanceNetwork from "@/components/instances/InstanceNetwork";
import InstanceOperations from "@/components/instances/InstanceOperations";
import InstanceStorage from "@/components/instances/InstanceStorage";

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
  const qc = useQueryClient();
  const current = useQuery({
    queryKey: ["governance-instance", instanceId],
    queryFn: ({ signal }) => getInstance(instanceId, signal),
    meta: {
      errorNotification: {
        id: withId("instance", instanceId),
        action: "实例详情加载",
        fallback: "请求失败，请稍后重试",
      },
    },
  });
  const runtime = useQuery({
    queryKey: ["governance-instance-runtime", instanceId],
    queryFn: ({ signal }) => getInstanceRuntime(instanceId, signal),
    meta: {
      errorNotification: {
        id: withId("instance-runtime", instanceId),
        action: "运行状态加载",
        fallback: "请求失败，请稍后重试",
      },
    },
  });
  // FIXME(governance-instance-detail): 旧网络、存储、配置、发布、保护及关联字段未对齐，保留原组件、入口和调用。
  // TODO(governance-instance-detail): 逐项补齐后迁移，Pod IP 不等于原私网 IP；旧 kind 不能直接替换为 compute_type。
  const oldQuery = useQuery({
    queryKey: ["legacy-instance", instanceId],
    queryFn: () => legacy.getInstance(instanceId),
    meta: {
      errorNotification: {
        id: withId("instance-configuration", instanceId),
        action: "实例配置加载",
        fallback: "请求失败，请稍后重试",
      },
    },
  });
  const refreshInstance = () => {
    current.refetch();
    runtime.refetch();
    oldQuery.refetch();
    qc.invalidateQueries({ queryKey: ["governance-instances"] });
  };
  const { actions, legacyActions, dialogNode } = useContainerActions(() => {}, goBack);
  const detail = oldQuery.data;
  const rollbackAction = legacyActions.find((action) => action.key === "rollback");
  if (!current.data) return <DetailPagePlaceholder loading={current.isLoading} />;
  const record = current.data;
  if (record.instance_kind !== "container" || record.compute_type !== "cpu")
    return <Empty description="当前资源不是普通容器" />;
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
              // FIXME(governance-instance-basic): 更新时间、终止保护未对齐，保留原字段位置和旧详情来源。
              // TODO(governance-instance-basic): 后端补齐后替换；ID、节点、创建时间继续使用新契约。
              {
                label: "更新时间",
                value: detail?.updated_at ? formatDateTime(detail.updated_at) : "-",
              },
              {
                label: "终止保护",
                value:
                  detail?.termination_protection == null
                    ? "-"
                    : detail.termination_protection
                      ? "已开启"
                      : "未开启",
              },
            ],
          },
          {
            key: "resource",
            title: "资源状态",
            defaultCollapsed: true,
            fields: [
              {
                label: "副本",
                value:
                  String(runtime.data?.statefulSet?.readyReplicas ?? "-") +
                  "/" +
                  String(runtime.data?.statefulSet?.desiredReplicas ?? "-"),
              },
              // FIXME(governance-instance-release-network): 发布状态、访问地址及 VPC/子网仍依赖旧详情，不能用 runtime 副本或 Pod IP 替代。
              // TODO(governance-instance-release-network): 等发布及网络契约对齐后逐项迁移，保留原资源状态区块和旧调用。
              { label: "发布状态", value: detail?.container?.rollout_status ?? "-" },
              { label: "访问地址", value: detail?.endpoint ?? "-" },
              { label: "VPC", value: detail ? getInstanceNetworkValue(detail, "vpc_id") : "-" },
              { label: "子网", value: detail ? getInstanceNetworkValue(detail, "subnet_id") : "-" },
            ],
          },
        ]}
        tabs={[
          {
            key: "release",
            label: "版本",
            content: (
              <InstanceVersions
                instance={detail}
                currentImage={record}
                loading={oldQuery.isLoading}
                onChanged={refreshInstance}
                updateImage={legacyActions.find((action) => action.key === "update_image")}
                rollbackDisabled={
                  !detail || !rollbackAction || Boolean(rollbackAction.disabled?.(detail))
                }
              />
            ),
          },
          {
            key: "configuration",
            label: "配置",
            content: (
              <InstanceConfiguration
                instance={detail}
                runtime={runtime.data}
                loading={oldQuery.isLoading}
                onChanged={refreshInstance}
              />
            ),
          },
          {
            key: "storage",
            label: "数据卷",
            content: (
              <InstanceStorage
                instance={detail}
                runtime={runtime.data}
                loading={oldQuery.isLoading}
                mountVolume={legacyActions.find((action) => action.key === "attach_volume")}
                mountFilesystem={legacyActions.find((action) => action.key === "attach_filesystem")}
              />
            ),
          },
          {
            key: "network",
            label: "网络",
            content: (
              <InstanceNetwork
                instance={detail}
                runtime={runtime.data}
                loading={oldQuery.isLoading}
              />
            ),
          },
          {
            key: "monitoring",
            label: "资源监控",
            content: <InstanceMetrics instanceId={instanceId} instanceKind="container" />,
          },
          {
            key: "logs",
            label: "日志",
            content: (
              <InstanceLogs instanceId={instanceId} active={true} instanceKind="container" />
            ),
          },
          {
            key: "events",
            label: "事件",
            content: <InstanceEvents instanceId={instanceId} instanceKind="container" />,
          },
          {
            key: "operations",
            label: "操作记录",
            content: (
              <InstanceOperations
                instanceId={instanceId}
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
