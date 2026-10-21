// The public list has no model_version_id filter. Resolve only the current
// service page's versions and keep the existing page-by-page behavior.
import { useQueries, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { listInferenceServices, type InferenceService } from "@/api/inference";
import { getModelVersion, type Model } from "@/api/models";
import { DataTable, ResourceNameId, StatusBadge } from "@/components/common";
import type { ListPagination } from "@/components/common/DataTable";
import { formatDateTime } from "@/lib/format";
import { withId } from "@/lib/id";

type ModelRelatedResourcesProps = { model: Model };

export default function ModelRelatedResources({ model }: ModelRelatedResourcesProps) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const params = { page, pageSize };
  const relatedServices = useQuery({
    meta: {
      errorNotification: {
        id: withId("model-services", model.id),
        action: "关联推理服务加载",
        fallback: "请求失败，请稍后重试",
      },
    },
    queryKey: ["governance-inference-services", "model-related", model.id, params],
    queryFn: ({ signal }) => listInferenceServices(params, signal),
  });
  const versionIds = new Set((model.versions ?? []).map((version) => version.id));
  // Resolve only this service page's versions; never traverse model/version pages.
  const unresolvedIds = [
    ...new Set(
      (relatedServices.data?.items ?? [])
        .map((service) => service.model_version_id)
        .filter((id) => id && !versionIds.has(id)),
    ),
  ];
  const versions = useQueries({
    queries: unresolvedIds.map((id) => ({
      queryKey: ["governance-model-version", id],
      queryFn: ({ signal }: { signal: AbortSignal }) => getModelVersion(id, signal),
      meta: {
        errorNotification: {
          id: withId("inference-version", id),
          action: "关联模型版本加载",
        },
      },
    })),
  });
  for (const version of versions) {
    if (version.data?.model.id === model.id) versionIds.add(version.data.version.id);
  }
  const services = (relatedServices.data?.items ?? []).filter((service) =>
    versionIds.has(service.model_version_id),
  );
  const total = Number(relatedServices.data?.total ?? 0);
  // FIXME(api-contract): 当前页码分页尚未与后端索引对齐。
  // TODO(api-contract): 对应后端版本就绪后联调列表、筛选及 total，不回退旧分页。
  const pagination: ListPagination = {
    mode: "total",
    page,
    pageSize,
    disabled: relatedServices.isFetching || versions.some((query) => query.isFetching),
    total,
    onPageChange: setPage,
    onPageSizeChange: (size) => {
      setPageSize(size);
      setPage(1);
    },
  };

  return (
    <div>
      <p className="mb-3 text-(--color-text-3)">
        按推理服务分页，仅展示当前页中关联此模型的服务；当前页为空时可继续翻页查看。
      </p>
      <DataTable<InferenceService>
        header={{ title: "关联推理服务" }}
        columns={[
          {
            title: "推理服务",
            width: 200,
            fixed: "left",
            render: (_, service) => (
              <ResourceNameId name={service.name} id={service.id} type="inference-service" />
            ),
          },
          {
            title: "运行阶段",
            width: 120,
            render: (_, service) => <StatusBadge status={service.phase} />,
          },
          {
            title: "调用健康",
            width: 120,
            render: (_, service) => <StatusBadge status={service.health} />,
          },
          {
            title: "服务模型名",
            width: 200,
            dataIndex: "served_model_name",
            ellipsis: true,
          },
          {
            title: "副本",
            width: 120,
            dataIndex: "replicas",
          },
          {
            title: "观测时间",
            width: 180,
            render: (_, service) => formatDateTime(service.observed_at),
          },
        ]}
        data={services}
        loading={relatedServices.isFetching || versions.some((query) => query.isFetching)}
        pagination={pagination}
        tableLabel="关联推理服务列表"
      />
    </div>
  );
}
