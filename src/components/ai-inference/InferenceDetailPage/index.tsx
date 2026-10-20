// FIXME(inference-contract): 当前后端索引已移除详情路由；用户确认保留原推理分支详情及关联入口。
// TODO(inference-contract): 对应后端版本确认后联调详情、删除返回与关联资源。
// FIXME(governance-migration): governance 尚未提供此页所需的策略、调用地址/测试、监控、日志及事件契约，相关区域保留空态。
// TODO(governance-migration): 逐项接入新资源对应的公开能力；不得复用 legacy 日志/策略组件查询 governance 服务 ID。
import { Empty } from "@arco-design/web-react";
import { useQuery } from "@tanstack/react-query";
import { getInferenceService } from "@/api/inference";
import {
  AliIcon,
  DetailPageFrame,
  DetailPagePlaceholder,
  ImageNameText,
  StatusBadge,
} from "@/components/common";
import ResourceActionMenu from "@/components/common/ResourceActionMenu";
import { navigationBreadcrumbsForPath } from "@/layouts/AppLayout/navigation";
import { useBackOrFallback } from "@/hooks/useBackOrFallback";
import { useInferenceActions } from "@/hooks/useInferenceActions";
import { formatDateTime } from "@/lib/format";
import { withId } from "@/lib/id";
import InferenceRelatedResources from "./InferenceRelatedResources";
import InferenceEvents from "./InferenceEvents";
import InferenceMonitoring from "./InferenceMonitoring";

export default function InferenceDetailPage({
  serviceId,
  tab,
  onTabChange,
}: {
  serviceId: string;
  tab?: string;
  onTabChange: (tab: string) => void;
}) {
  const goBack = useBackOrFallback("inference-service");
  const { actions } = useInferenceActions(goBack);
  const service = useQuery({
    queryKey: ["governance-inference-service", serviceId],
    queryFn: ({ signal }) => getInferenceService(serviceId, signal),
    meta: {
      errorNotification: { id: withId("inference-service", serviceId), action: "推理服务详情加载" },
    },
  });
  if (!service.data) return <DetailPagePlaceholder loading={service.isLoading} />;
  const item = service.data;
  return (
    <>
      <DetailPageFrame
        breadcrumbs={[...navigationBreadcrumbsForPath("/ai-inference"), { label: item.name }]}
        title={item.name}
        status={<StatusBadge status={item.phase} />}
        icon={<AliIcon name="tuili" size={28} />}
        headerItems={[{ label: "资源 ID", value: item.id }]}
        actions={<ResourceActionMenu record={item} actions={actions} />}
        cards={[
          {
            key: "overview",
            title: "服务概览",
            fields: [
              { label: "服务模型名", value: item.served_model_name || "-" },
              { label: "期望状态", value: item.desired_state || "-" },
              { label: "运行阶段", value: <StatusBadge status={item.phase} /> },
              { label: "调用健康", value: <StatusBadge status={item.health} /> },
              { label: "发布阶段", value: <StatusBadge status={item.publication_phase} /> },
              {
                label: "期望 / 已应用版本",
                value: `${item.generation || "-"} / ${item.applied_generation || "-"}`,
              },
              { label: "观测时间", value: formatDateTime(item.observed_at) },
            ],
          },
          {
            key: "configuration",
            title: "运行配置",
            fields: [
              { label: "模型版本", value: item.model_version_id || "-" },
              { label: "运行镜像", value: <ImageNameText image={item.engine_image} /> },
              { label: "引擎类型", value: item.engine_type || "-" },
              { label: "启动命令", value: item.command || "-" },
              { label: "CPU / 内存", value: `${item.cpu || "-"} / ${item.memory || "-"}` },
              {
                label: "运行模式",
                value:
                  item.runtime_mode === "RUNTIME_MODE_LEADER_WORKER_SET"
                    ? "LeaderWorkerSet"
                    : item.runtime_mode === "RUNTIME_MODE_DEPLOYMENT"
                      ? "Deployment"
                      : item.runtime_mode || "-",
              },
              {
                label: "副本 / 每组 Worker",
                value: `${item.replicas ?? "-"} / ${item.worker_replicas ?? "-"}`,
              },
              {
                label: "GPU 规格",
                value: item.gpu ? `${item.gpu.profile_id} · v${item.gpu.profile_version}` : "CPU",
              },
              {
                label: "GPU 集群 / 资源池",
                value: item.gpu ? `${item.gpu.cluster_id} / ${item.gpu.pool_id}` : "-",
              },
            ],
          },
        ]}
        tabs={[
          {
            key: "related",
            label: "关联资源",
            content: <InferenceRelatedResources service={item} />,
          },
          {
            key: "policies",
            label: "策略",
            content: <Empty description="当前后端尚未开放推理访问策略" />,
          },
          {
            key: "invocation-test",
            label: "调用测试",
            content: <Empty description="当前后端尚未提供调用地址和调用测试接口" />,
          },
          { key: "monitoring", label: "监控", content: <InferenceMonitoring /> },
          { key: "logs", label: "日志", content: <Empty description="当前后端尚未开放推理日志" /> },
          { key: "events", label: "事件", content: <InferenceEvents /> },
        ]}
        activeTabKey={tab}
        onTabChange={onTabChange}
        onBack={goBack}
      />
    </>
  );
}
