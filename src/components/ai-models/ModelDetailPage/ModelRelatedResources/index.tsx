// FIXME(governance-migration): 新推理列表没有 model_version_id 筛选，只能在当前服务页关联模型，空页不代表没有关联资源。
// TODO(governance-migration): 后端提供模型关联服务筛选后改为服务端筛选分页，移除逐版本查询及当前页过滤。
import { useQueries, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { listInferenceServices, type InferenceService } from "@/api/inference";
import { getModelVersion, type Model } from "@/api/models";
import { DataTable, ResourceNameId, StatusBadge } from "@/components/common";
import type { ListPagination } from "@/components/common/DataTable";
import { formatDateTime } from "@/lib/format";
import { withId } from "@/lib/id";

export default function ModelRelatedResources({ model }: { model: Model }) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [tokens, setTokens] = useState<(string | undefined)[]>([undefined]);
  const params = { page_size: pageSize, page_token: tokens[page - 1] };
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
      (relatedServices.data?.services ?? [])
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
  const services = (relatedServices.data?.services ?? []).filter((service) =>
    versionIds.has(service.model_version_id),
  );
  const pagination: ListPagination = {
    mode: "cursor",
    page,
    pageSize,
    disabled: relatedServices.isFetching || versions.some((query) => query.isFetching),
    hasNextPage: Boolean(relatedServices.data?.next_page_token),
    onPageChange: (next) => {
      const token = relatedServices.data?.next_page_token;
      if (next === page + 1 && token) {
        setTokens([...tokens.slice(0, page), token]);
        setPage(next);
      } else if (next >= 1 && next < page) setPage(next);
    },
    onPageSizeChange: (size) => {
      setPageSize(size);
      setPage(1);
      setTokens([undefined]);
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
          { title: "调用健康", render: (_, service) => <StatusBadge status={service.health} /> },
          { title: "服务模型名", dataIndex: "served_model_name", ellipsis: true },
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
