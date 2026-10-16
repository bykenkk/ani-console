// FIXME(governance-migration): 推荐配置仍隐藏，操作记录仍为空态；当前接入未覆盖这些详情能力。
// TODO(governance-migration): 确认推荐配置和模型操作记录的权威接口后接入，不能将空态当作已完成查询。
import { useModelActions } from "@/hooks/useModelActions";
import ResourceActionMenu from "@/components/common/ResourceActionMenu";

import { withId } from "@/lib/id";

import { useQuery } from "@tanstack/react-query";
import { useBackOrFallback } from "@/hooks/useBackOrFallback";

import { getModel } from "@/api/models";

import { navigationBreadcrumbsForPath } from "@/layouts/AppLayout/navigation";
import {
  AliIcon,
  DetailPageFrame,
  DetailPagePlaceholder,
  ResourceId,
  StatusBadge,
  type DetailCard,
} from "@/components/common";
import { formatBytes, formatDateTime } from "@/lib/format";
import {
  formatModelCapabilities,
  getLatestModelVersion,
  MODEL_SOURCE_LABELS,
} from "@/lib/ai-models";
import ModelRelatedResources from "./ModelRelatedResources";
import ModelOperationHistory from "./ModelOperationHistory";
// import { ModelRecommendedConfiguration } from "./ModelRecommendedConfiguration";

export default function ModelDetailPage({
  modelId,
  tab,
  onTabChange,
}: {
  modelId: string;
  tab?: string;
  onTabChange: (tab: string) => void;
}) {
  const goBack = useBackOrFallback("model");

  const model = useQuery({
    meta: {
      errorNotification: {
        id: withId("model", modelId),
        action: "模型详情加载",
        fallback: "请求失败，请稍后重试",
      },
    },
    queryKey: ["governance-model", modelId],
    queryFn: ({ signal }) => getModel(modelId, signal),
  });
  const { actions, dialogNode } = useModelActions();

  if (!model.data) {
    return <DetailPagePlaceholder loading={model.isLoading} />;
  }

  const item = model.data;
  const latestVersion = getLatestModelVersion(item);

  const detailCards: DetailCard[] = [
    {
      key: "basic",
      title: "基本信息",
      fields: [
        { label: "ID", value: <ResourceId value={item.id} /> },
        { label: "来源", value: MODEL_SOURCE_LABELS[item.source ?? ""] ?? item.source ?? "-" },
        {
          label: "任务",
          value: formatModelCapabilities(item.capabilities),
        },
        { label: "描述", value: item.description || "-" },
      ],
    },
    {
      key: "catalog",
      title: "版本信息",
      fields: [
        { label: "最新版本", value: latestVersion?.version ?? "-" },
        {
          label: "版本数",
          value: String(item.versions?.length ?? 0) + " 个",
        },
        {
          label: "模型大小",
          value: formatBytes(
            item.total_size_bytes == null ? undefined : Number(item.total_size_bytes),
          ),
        },
        { label: "创建时间", value: formatDateTime(item.created_at) },
        { label: "更新时间", value: formatDateTime(item.updated_at) },
      ],
    },
  ];

  return (
    <>
      <DetailPageFrame
        breadcrumbs={[...navigationBreadcrumbsForPath("/ai-models"), { label: item.name }]}
        title={item.name}
        status={<StatusBadge status={item.status} />}
        icon={<AliIcon name="moxing" size={28} />}
        headerItems={[
          { label: "最新版本", value: latestVersion?.version ?? "-" },
          { label: "更新时间", value: formatDateTime(item.updated_at) },
        ]}
        actions={<ResourceActionMenu record={item} actions={actions} />}
        cards={detailCards}
        tabs={[
          {
            key: "related",
            label: "关联资源",
            content: <ModelRelatedResources model={item} />,
          },
          // 推荐配置暂时隐藏，后续开放时恢复此项及对应导入。
          // {
          //   key: "recommended-configuration",
          //   label: "推荐配置",
          //   content: <ModelRecommendedConfiguration />,
          // },
          {
            key: "operation-history",
            label: "操作记录",
            content: <ModelOperationHistory />,
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
