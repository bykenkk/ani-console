import { useQuery } from "@tanstack/react-query";
import { Button } from "@arco-design/web-react";
import { IconCopy } from "@arco-design/web-react/icon";
import { listModelVersions, type ModelVersion } from "@/api/models";
import { DataTable, ResourceNameId, StatusBadge } from "@/components/common";
import { useListPagination } from "@/hooks/useListPagination";
import { copyToClipboard } from "@/lib/clipboard";
import { formatBytes, formatDateTime } from "@/lib/format";
import { withId } from "@/lib/id";

type ModelVersionsProps = {
  modelId: string;
};

const MODEL_FORMAT_LABELS: Record<string, string> = {
  safetensors: "Safetensors",
  gguf: "GGUF",
  pytorch: "PyTorch",
};

export default function ModelVersions({ modelId }: ModelVersionsProps) {
  const paging = useListPagination(modelId, 10);
  const { page, pageSize } = paging;
  const params = { page, pageSize };
  // TODO(model-contract): 联调当前模型版本列表的分页、空列表和版本大小展示。
  const versions = useQuery({
    queryKey: ["governance-model-versions", modelId, params],
    queryFn: ({ signal }) => listModelVersions(modelId, params, signal),
    meta: {
      errorNotification: {
        id: withId("model-versions", modelId),
        action: "模型版本加载",
      },
    },
  });

  return (
    <DataTable<ModelVersion>
      columns={[
        {
          key: "name",
          title: "版本 / ID",
          width: 200,
          fixed: "left",
          render: (_, version) => <ResourceNameId name={version.version} id={version.id} />,
        },
        {
          title: "状态",
          width: 120,
          render: (_, version) => <StatusBadge status={version.status} />,
        },
        {
          title: "格式",
          width: 130,
          render: (_, version) =>
            MODEL_FORMAT_LABELS[version.format ?? ""] ?? version.format ?? "-",
        },
        {
          title: "加密",
          width: 80,
          render: (_, version) =>
            version.is_encrypted == null ? "-" : version.is_encrypted ? "是" : "否",
        },
        {
          title: "大小",
          width: 120,
          render: (_, version) =>
            formatBytes(version.size_bytes == null ? undefined : Number(version.size_bytes)),
        },
        {
          title: "校验值",
          width: 260,
          render: (_, version) =>
            version.checksum_sha256 ? (
              <span className="inline-flex w-57 max-w-full min-w-0 items-center gap-1">
                <span className="min-w-0 truncate font-mono" title={version.checksum_sha256}>
                  {version.checksum_sha256}
                </span>
                <Button
                  title="复制校验值"
                  aria-label="复制校验值"
                  className="shrink-0"
                  type="text"
                  size="mini"
                  icon={<IconCopy />}
                  onClick={() => copyToClipboard(version.checksum_sha256!, "校验值")}
                />
              </span>
            ) : (
              "-"
            ),
        },
        {
          title: "创建时间",
          width: 180,
          render: (_, version) => formatDateTime(version.created_at),
        },
      ]}
      data={versions.data?.items ?? []}
      loading={versions.isFetching}
      pagination={{
        mode: "total",
        page,
        pageSize,
        total: Number(versions.data?.total ?? 0),
        disabled: versions.isFetching,
        onPageChange: paging.setPage,
        onPageSizeChange: paging.setPageSize,
      }}
      tableLabel="模型版本列表"
    />
  );
}
