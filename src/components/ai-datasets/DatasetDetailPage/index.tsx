import { useQuery } from "@tanstack/react-query";
import { getDataset } from "@/api/modeldev";
import {
  AliIcon,
  DetailPageFrame,
  DetailPagePlaceholder,
  ResourceIdentity,
  StatusBadge,
  type DetailCard,
} from "@/components/common";
import ResourceActionMenu from "@/components/common/ResourceActionMenu";
import { useDatasetActions } from "@/hooks/useDatasetActions";
import { useBackOrFallback } from "@/hooks/useBackOrFallback";
import { navigationBreadcrumbsForPath } from "@/layouts/AppLayout/navigation";
import { DATASET_STATE_LABELS } from "@/lib/datasets";
import { formatDateTime } from "@/lib/format";
import { withId } from "@/lib/id";
import DatasetVersions from "./DatasetVersions";
import DatasetOperationHistory from "./DatasetOperationHistory";

type DatasetDetailPageProps = {
  datasetId: string;
  tab?: string;
  onTabChange: (tab: string) => void;
};

export default function DatasetDetailPage({ datasetId, tab, onTabChange }: DatasetDetailPageProps) {
  const dataset = useQuery({
    queryKey: ["dataset", datasetId],
    queryFn: ({ signal }) => getDataset(datasetId, signal),
    meta: {
      errorNotification: { id: withId("dataset", datasetId), action: "数据集详情加载" },
    },
  });
  const { actions, dialogNode } = useDatasetActions();
  const goBack = useBackOrFallback("dataset");
  if (!dataset.data) return <DetailPagePlaceholder loading={dataset.isLoading} />;
  const item = dataset.data;
  const cards: DetailCard[] = [
    {
      key: "basic",
      title: "基本信息",
      fields: [
        { label: "数据集 ID", value: <ResourceIdentity display="id" id={item.dataset_id} /> },
        {
          label: "数据集说明",
          value: item.description || "-",
          valueClassName: "whitespace-pre-wrap",
        },
        { label: "数据类型", value: item.modality === "TEXT" ? "文本" : item.modality },
        {
          label: "样本结构",
          value: item.schema_kind === "ALPACA" ? "Alpaca 指令格式" : item.schema_kind,
        },
        { label: "创建者", value: item.created_by },
        { label: "创建时间", value: formatDateTime(item.created_at) },
        { label: "更新时间", value: formatDateTime(item.updated_at) },
      ],
    },
  ];
  return (
    <>
      <DetailPageFrame
        breadcrumbs={[...navigationBreadcrumbsForPath("/ai-datasets"), { label: item.name }]}
        title={item.name}
        status={<StatusBadge status={item.state}>{DATASET_STATE_LABELS[item.state]}</StatusBadge>}
        icon={<AliIcon name="moxing" size={28} />}
        headerItems={[
          { label: "可用版本数", value: item.ready_version_count },
          { label: "更新时间", value: formatDateTime(item.updated_at) },
        ]}
        actions={<ResourceActionMenu record={item} actions={actions} />}
        cards={cards}
        tabs={[
          {
            key: "versions",
            label: "数据集版本",
            content: <DatasetVersions datasetId={datasetId} />,
          },
          {
            key: "operations",
            label: "操作历史",
            content: <DatasetOperationHistory datasetId={datasetId} />,
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
