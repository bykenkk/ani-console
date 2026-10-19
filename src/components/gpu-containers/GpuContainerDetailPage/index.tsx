import * as legacy from "@/api/instances/legacy";
import { getInstance, getInstanceRuntime } from "@/api/instances";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Empty, Tooltip } from "@arco-design/web-react";
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
export default function GpuContainerDetailPage({
  instanceId,
  tab,
  onTabChange,
}: {
  instanceId: string;
  tab?: string;
  onTabChange: (tab: string) => void;
}) {
  const goBack = useBackOrFallback("gpu-instance");
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
  const { actions, legacyActions, dialogNode } = useGpuContainerActions(() => {}, goBack);
  const instance = oldQuery.data;
  const rollbackAction = legacyActions.find((action) => action.key === "rollback");
  if (!current.data) return <DetailPagePlaceholder loading={current.isLoading} />;
  const record = current.data;
  if (record.instance_kind !== "container" || record.compute_type !== "gpu")
    return <Empty description="当前资源不是 GPU 容器" />;
  // FIXME(governance-instance-release-network): 发布修订、身份、网络和存储关联仍读取旧详情，原基本信息与关联摘要区块固定保留。
  // TODO(governance-instance-release-network): 等等价契约补齐后逐项迁移；镜像关联 ID 已用新详情，不以资源 version 替代发布修订。
  const rolloutLabels: Record<string, string> = {
    pending: "待发布",
    progressing: "发布中",
    healthy: "健康",
    degraded: "异常",
    rolled_back: "已回滚",
  };
  const workloadIdentity = instance?.workload_identity;
  const workloadIdentityLabel = workloadIdentity?.active
    ? [workloadIdentity.key_prefix, ...(workloadIdentity.scopes ?? [])]
        .filter(Boolean)
        .join(" · ") || "-"
    : "-";
  const securityGroups = instance?.network?.security_groups ?? [];
  const loadBalancerRefs = instance?.network?.load_balancer_refs ?? [];
  const relatedItems: Array<{
    key: string;
    kind: string;
    name: string;
    id?: string;
  }> = [];
  const relatedKeys = new Set<string>();
  const addRelated = (item: (typeof relatedItems)[number]) => {
    if (relatedKeys.has(item.key)) return;
    relatedKeys.add(item.key);
    relatedItems.push(item);
  };
  if (instance?.network?.vpc_id ?? instance?.vpc_id) {
    const id = String(instance?.network?.vpc_id ?? instance?.vpc_id);
    addRelated({
      key: `vpc/${id}`,
      kind: "VPC",
      name: instance?.network?.vpc_name ?? id,
      id,
    });
  }
  if (instance?.network?.subnet_id ?? instance?.subnet_id) {
    const id = String(instance?.network?.subnet_id ?? instance?.subnet_id);
    addRelated({
      key: `subnet/${id}`,
      kind: "子网",
      name: instance?.network?.subnet_name ?? id,
      id,
    });
  }
  securityGroups.forEach((group) =>
    addRelated({
      key: `security-group/${group.id}`,
      kind: "安全组",
      name: group.name ?? group.id,
      id: group.id,
    }),
  );
  (instance?.volumes ?? []).forEach((volume) => {
    const id = volume.source_ref?.replace(/^volume\//, "");
    addRelated({
      key: volume.source_ref ?? `volume/${volume.name}`,
      kind: "云盘",
      name: volume.name,
      id,
    });
  });
  (instance?.storage_attachments ?? []).forEach((attachment) => {
    const isFilesystem = attachment.resource_type === "filesystem";
    addRelated({
      key: `${attachment.resource_type}/${attachment.resource_id}`,
      kind: isFilesystem ? "文件存储" : attachment.resource_type,
      name: attachment.resource_name ?? attachment.resource_id,
      id: attachment.resource_id,
    });
  });
  const imageId = record.imageId;
  if (imageId) {
    addRelated({ key: "image/" + imageId, kind: "镜像", name: imageId, id: imageId });
  }
  (instance?.resource_refs ?? [])
    .filter((reference) => /secret|key|credential/i.test(reference))
    .forEach((reference) =>
      addRelated({
        key: reference,
        kind: "密钥",
        name: reference,
      }),
    );
  loadBalancerRefs.forEach((reference) =>
    addRelated({
      key: `load-balancer/${reference}`,
      kind: "负载均衡",
      name: reference,
      id: reference,
    }),
  );

  // FIXME(governance-instance-image): 新详情仅有镜像 ID/摘要；旧名称只在镜像 ID 一致时用于原镜像展示。
  // TODO(governance-instance-image): 新镜像展示字段对齐后移除旧名称来源，不新增镜像请求。
  const image = instance?.image?.id === record.imageId ? instance.image : record.imageId;

  return (
    <>
      <DetailPageFrame
        breadcrumbs={[...navigationBreadcrumbsForPath("/gpu-containers"), { label: record.name }]}
        title={record.name}
        icon={<AliIcon name="icon-GPUrongqishili" size={28} />}
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
              // FIXME(governance-instance-basic): 终止保护、Provider 未对齐，保留旧来源；其余已对齐基本字段继续使用新契约。
              // TODO(governance-instance-basic): 后端补齐后替换，保持原字段位置和展示。
              {
                label: "终止保护",
                value:
                  instance?.termination_protection == null
                    ? "-"
                    : instance.termination_protection
                      ? "已开启"
                      : "未开启",
              },
              {
                label: "规格",
                value: record.gpu_summary
                  ? record.gpu_summary.devices_per_instance + "×" + record.gpu_summary.model_key
                  : "-",
              },
              { label: "镜像", value: <ImageNameText image={image} /> },
              { label: "Provider", value: instance?.provider ?? "-" },
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
              {
                label: "修订 / 发布",
                value: instance?.container
                  ? [
                      instance.container.revision,
                      instance.container.rollout_status
                        ? (rolloutLabels[instance.container.rollout_status] ??
                          instance.container.rollout_status)
                        : null,
                    ]
                      .filter(Boolean)
                      .join(" · ") || "-"
                  : "-",
              },
              { label: "Workload Identity", value: workloadIdentityLabel },
              {
                label: "负载均衡",
                value: loadBalancerRefs.length ? loadBalancerRefs.join("、") : "-",
              },
              {
                label: "调用地址",
                value: instance?.endpoint ? (
                  <a
                    href={instance.endpoint}
                    target="_blank"
                    rel="noreferrer"
                    className="break-all text-[rgb(var(--link-6))]"
                  >
                    {instance.endpoint}
                  </a>
                ) : (
                  "-"
                ),
              },
              {
                label: "安全组",
                value: securityGroups.length
                  ? securityGroups.map((group) => group.name ?? group.id).join("、")
                  : "-",
              },
              { label: "创建时间", value: formatDateTime(record.createdAt) },
              {
                label: "关联对象",
                value: instance ? (
                  <span>
                    <strong>{relatedItems.length}</strong> 个
                  </span>
                ) : (
                  "-"
                ),
              },
            ],
          },
          {
            key: "related-summary",
            title: "关联摘要",
            fields: relatedItems.length
              ? relatedItems.map((item) => {
                  const summary =
                    item.name + (item.id && item.id !== item.name ? " · " + item.id : "");
                  return {
                    label: item.kind,
                    value: (
                      <Tooltip content={summary}>
                        <span className="block min-w-0 truncate">{summary}</span>
                      </Tooltip>
                    ),
                  };
                })
              : [{ label: "暂无关联对象", value: "-" }],
          },
        ]}
        tabs={[
          {
            key: "release",
            label: "版本",
            content: (
              <InstanceVersions
                instance={instance}
                currentImage={record}
                loading={oldQuery.isLoading}
                onChanged={refreshInstance}
                updateImage={legacyActions.find((action) => action.key === "update_image")}
                rollbackDisabled={
                  !instance || !rollbackAction || Boolean(rollbackAction.disabled?.(instance))
                }
              />
            ),
          },
          {
            key: "configuration",
            label: "配置",
            content: (
              <InstanceConfiguration
                instance={instance}
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
                instance={instance}
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
                instance={instance}
                runtime={runtime.data}
                loading={oldQuery.isLoading}
              />
            ),
          },
          {
            key: "monitoring",
            label: "资源监控",
            content: <InstanceMetrics instanceId={instanceId} instanceKind="gpu_container" />,
          },
          {
            key: "gpu-metrics",
            label: "GPU 指标",
            content: (
              <InstanceMetrics
                instanceId={instanceId}
                instanceKind="gpu_container"
                gpuOnly
                gpuModel={record.gpu_summary?.model_key}
                gpuCount={record.gpu_summary?.devices_per_instance}
              />
            ),
          },
          {
            key: "logs",
            label: "日志",
            content: <InstanceLogs instanceId={instanceId} active instanceKind="gpu_container" />,
          },
          {
            key: "events",
            label: "事件",
            content: <InstanceEvents instanceId={instanceId} instanceKind="gpu_container" />,
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
