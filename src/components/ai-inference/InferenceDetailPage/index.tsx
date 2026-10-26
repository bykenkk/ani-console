// TODO(inference-contract): Governance 已注册详情及删除路由；待部署后联调详情、删除返回与关联资源。
// FIXME(inference-health): health 完整枚举、unknown 成因及探测更新机制仍待 owner 确认；保留后端原值，不由运行阶段推算。
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
import InferenceRuntimeLogs from "./InferenceRuntimeLogs";
import UpdateInferenceModal from "../UpdateInferenceModal";
import InferencePolicies from "./InferencePolicies";
import InferenceInvocationAddress from "./InferenceInvocationAddress";

type InferenceDetailPageProps = {
  serviceId: string;
  tab?: string;
  onTabChange: (tab: string) => void;
};

export default function InferenceDetailPage({
  serviceId,
  tab,
  onTabChange,
}: InferenceDetailPageProps) {
  const goBack = useBackOrFallback("inference-service");
  const { actions, editing, closeEditor, onUpdated } = useInferenceActions(goBack);
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
            content: <InferencePolicies key={item.id} serviceId={item.id} />,
          },
          {
            key: "invocation-test",
            label: "调用测试",
            content: <InferenceInvocationAddress serviceId={item.id} />,
          },
          {
            key: "monitoring",
            label: "监控",
            content: <InferenceMonitoring serviceId={item.id} />,
          },
          {
            key: "logs",
            label: "日志",
            content: <InferenceRuntimeLogs key={item.id} serviceId={item.id} />,
          },
          { key: "events", label: "事件", content: <InferenceEvents serviceId={item.id} /> },
        ]}
        activeTabKey={tab}
        onTabChange={onTabChange}
        onBack={goBack}
      />
      {editing && (
        <UpdateInferenceModal
          serviceId={editing.id}
          onCancel={closeEditor}
          onSubmitted={onUpdated}
        />
      )}
    </>
  );
}
