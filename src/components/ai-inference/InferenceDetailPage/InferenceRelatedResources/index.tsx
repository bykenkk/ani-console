import { useQuery } from "@tanstack/react-query";
import type { InferenceService } from "@/api/inference";
import { getModelVersion } from "@/api/models";
import { DataTable, ResourceNameId } from "@/components/common";
import { withId } from "@/lib/id";

type InferenceRelatedResourcesProps = { service: InferenceService };

export default function InferenceRelatedResources({ service }: InferenceRelatedResourcesProps) {
  const version = useQuery({
    queryKey: ["governance-model-version", service.model_version_id],
    enabled: Boolean(service.model_version_id),
    queryFn: ({ signal }) => getModelVersion(service.model_version_id, signal),
    meta: {
      errorNotification: {
        id: withId("inference-version", service.model_version_id),
        action: "关联模型加载",
      },
    },
  });
  return (
    <DataTable
      header={{ title: "关联模型" }}
      data={version.data ? [version.data] : []}
      rowKey={(item) => item.version.id}
      loading={version.isFetching}
      pagination={false}
      columns={[
        // FIXME(governance-migration): 模型页已迁移到 governance，此处仍保留迁移期的不可跳转展示。
        // TODO(governance-migration): 核对模型访问权限后恢复到 /ai-models/$modelId 的资源跳转。
        {
          title: "模型",
          width: 200,
          render: (_, item) => (
            <ResourceNameId name={item.model.name} id={item.model.id} openable={false} />
          ),
        },
        { title: "版本", width: 200, render: (_, item) => item.version.version },
        { title: "版本 ID", width: 280, render: (_, item) => item.version.id, ellipsis: true },
        { title: "状态", width: 120, render: (_, item) => item.version.status },
      ]}
      tableLabel="推理服务关联模型列表"
    />
  );
}
