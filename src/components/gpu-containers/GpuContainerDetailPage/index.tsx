import { getInstance, getInstanceConfiguration, getInstanceRuntime } from "@/api/instances";
import { useQuery } from "@tanstack/react-query";
import { Button, Empty, Space, Tooltip } from "@arco-design/web-react";
import { useBackOrFallback } from "@/hooks/useBackOrFallback";
import {
  AliIcon,
  DetailPageFrame,
  DetailPagePlaceholder,
  ImageNameText,
  ResourceId,
  StatusBadge,
} from "@/components/common";
import ResourceActionMenu from "@/components/common/ResourceActionMenu";
import { useGpuContainerActions } from "@/hooks/useGpuContainerActions";
import { navigationBreadcrumbsForPath } from "@/layouts/AppLayout/navigation";
import { formatDateTime } from "@/lib/format";
import { withId } from "@/lib/id";
import InstanceLogs from "@/components/instances/InstanceLogs";
import InstanceVersions from "@/components/instances/InstanceVersions";
import InstanceConfiguration from "@/components/instances/InstanceConfiguration";
import InstanceEvents from "@/components/instances/InstanceEvents";
import InstanceMetrics from "@/components/instances/InstanceMetrics";
import InstanceNetwork from "@/components/instances/InstanceNetwork";
import InstanceOperations from "@/components/instances/InstanceOperations";
import InstanceStorage from "@/components/instances/InstanceStorage";

type GpuContainerDetailPageProps = {
  instanceId: string;
  tab?: string;
  onTabChange: (tab: string) => void;
};

export default function GpuContainerDetailPage({
  instanceId,
  tab,
  onTabChange,
}: GpuContainerDetailPageProps) {
  const goBack = useBackOrFallback("gpu-instance");
  const current = useQuery({
    queryKey: ["governance-instance", instanceId],
    queryFn: ({ signal }) => getInstance(instanceId, signal),
    meta: { errorNotification: { id: withId("instance", instanceId), action: "实例详情加载" } },
  });
  const isGpu = current.data?.instance_kind === "container" && current.data.compute_type === "gpu";
  const runtime = useQuery({
    queryKey: ["governance-instance-runtime", instanceId],
    enabled: isGpu,
    queryFn: ({ signal }) => getInstanceRuntime(instanceId, signal),
    meta: {
      errorNotification: { id: withId("instance-runtime", instanceId), action: "运行状态加载" },
    },
  });
  const configuration = useQuery({
    queryKey: ["governance-instance-configuration", instanceId],
    enabled: isGpu,
    gcTime: 0,
    queryFn: ({ signal }) => getInstanceConfiguration(instanceId, signal),
    meta: {
      errorNotification: {
        id: withId("instance-configuration", instanceId),
        action: "实例配置加载",
      },
    },
  });
  const { actions, dialogNode } = useGpuContainerActions(() => {}, goBack);
  const primaryAction = actions.find((action) => action.key === "terminal");
  if (!current.data) return <DetailPagePlaceholder loading={current.isLoading} />;
  const record = current.data;
  if (!isGpu) return <Empty description="当前资源不是 GPU 容器" />;
  // TODO(instance-detail-migration): GPU 配置、网络及卷引用需完成实际联调验证后移除此标记。
  const relatedItems: Array<{ kind: string; name: string }> = [];
  if (configuration.data?.network) {
    relatedItems.push(
      { kind: "VPC", name: configuration.data.network.vpc_id },
      { kind: "子网", name: configuration.data.network.subnet_id },
    );
  }
  for (const mount of configuration.data?.volume_mounts ?? [])
    relatedItems.push({ kind: "存储卷", name: mount.pvc_name });
  if (record.imageId) relatedItems.push({ kind: "镜像", name: record.imageId });
  return (
    <>
      <DetailPageFrame
        breadcrumbs={[...navigationBreadcrumbsForPath("/gpu-containers"), { label: record.name }]}
        title={record.name}
        icon={<AliIcon name="icon-GPUrongqishili" size={28} />}
        status={<StatusBadge status={record.observedState} reason={record.reason} />}
        headerItems={[
          {
            label: "GPU",
            value: record.gpu_summary
              ? `${record.gpu_summary.model_key} × ${record.gpu_summary.devices_per_instance}`
              : "-",
          },
        ]}
        actions={
          <Space>
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
          </Space>
        }
        cards={[
          {
            key: "basic",
            title: "基本信息",
            fields: [
              { label: "ID", value: <ResourceId value={record.id} /> },
              // FIXME(instance-basic): 当前实例合同未提供保护、Provider、发布、身份、安全组、负载均衡和调用地址，保留字段空态。
              // TODO(instance-basic): 上述正式字段对齐并联调验证后逐项接入，不补查其他系统实例。
              { label: "终止保护", value: "-" },
              { label: "镜像", value: <ImageNameText image={record.imageId} /> },
              { label: "Provider", value: "-" },
              { label: "节点", value: runtime.data?.pod?.nodeName ?? "-" },
              {
                label: "CPU / 内存",
                value: [record.cpu, record.memory].filter(Boolean).join(" / ") || "-",
              },
              {
                label: "GPU",
                value: record.gpu_summary
                  ? record.gpu_summary.model_key + " × " + record.gpu_summary.devices_per_instance
                  : "-",
              },
              {
                label: "副本",
                value:
                  String(runtime.data?.statefulSet?.readyReplicas ?? "-") +
                  " / " +
                  String(runtime.data?.statefulSet?.desiredReplicas ?? "-"),
              },
              { label: "修订 / 发布", value: "-" },
              { label: "Workload Identity", value: "-" },
              { label: "负载均衡", value: "-" },
              { label: "调用地址", value: "-" },
              { label: "安全组", value: "-" },
              { label: "创建时间", value: formatDateTime(record.createdAt) },
              {
                label: "关联对象",
                value: (
                  <span>
                    <strong>{relatedItems.length}</strong> 个
                  </span>
                ),
              },
            ],
          },
          {
            key: "related-summary",
            title: "关联摘要",
            fields: relatedItems.length
              ? relatedItems.map((item) => ({
                  label: item.kind,
                  value: (
                    <Tooltip content={item.name}>
                      <span className="block min-w-0 truncate">{item.name}</span>
                    </Tooltip>
                  ),
                }))
              : [{ label: "暂无关联对象", value: "-" }],
          },
        ]}
        tabs={[
          { key: "release", label: "版本", content: <InstanceVersions currentImage={record} /> },
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
            key: "gpu-metrics",
            label: "GPU 指标",
            content: (
              <InstanceMetrics
                gpuOnly
                instanceId={instanceId}
                computeType={record.compute_type}
                gpuModel={record.gpu_summary?.model_key}
                gpuCount={record.gpu_summary?.devices_per_instance}
              />
            ),
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
