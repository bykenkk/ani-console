import { useState } from "react";
import { Button } from "@arco-design/web-react";
import { IconRefresh } from "@arco-design/web-react/icon";
import { useQuery } from "@tanstack/react-query";
import { listDatasetVersions, type DatasetVersion } from "@/api/modeldev";
import { DataTable, ResourceIdentity, StatusBadge } from "@/components/common";
import { useListPagination } from "@/hooks/useListPagination";
import { DATASET_VERSION_STATE_LABELS } from "@/lib/datasets";
import { formatDateTime } from "@/lib/format";
import { withId } from "@/lib/id";
import DatasetVersionDetailModal from "../../DatasetVersionDetailModal";

type DatasetVersionsProps = { datasetId: string };

export default function DatasetVersions({ datasetId }: DatasetVersionsProps) {
  const [selected, setSelected] = useState<DatasetVersion | null>(null);
  const paging = useListPagination(datasetId, 20);
  const params = { page: paging.page, pageSize: paging.pageSize };
  const versions = useQuery({
    queryKey: ["dataset-versions", datasetId, params],
    queryFn: ({ signal }) => listDatasetVersions(datasetId, params, signal),
    meta: {
      errorNotification: { id: withId("dataset-versions", datasetId), action: "数据集版本加载" },
    },
  });
  return (
    <>
      <DataTable<DatasetVersion>
        header={{
          title: "已发布版本",
          extra: (
            <Button
              icon={<IconRefresh />}
              aria-label="刷新版本列表"
              title="刷新版本列表"
              loading={versions.isFetching}
              onClick={() => versions.refetch()}
            />
          ),
        }}
        rowKey="input_version_id"
        data={versions.data?.items ?? []}
        loading={versions.isFetching}
        tableLabel="数据集版本列表"
        columns={[
          {
            title: "版本 / ID",
            width: 200,
            fixed: "left",
            render: (_, item) => (
              <ResourceIdentity name={item.version_number} id={item.input_version_id} />
            ),
          },
          {
            title: "状态",
            width: 120,
            render: (_, item) => (
              <StatusBadge status={item.input_version?.state}>
                {item.input_version
                  ? (DATASET_VERSION_STATE_LABELS[item.input_version.state] ??
                    item.input_version.state)
                  : "-"}
              </StatusBadge>
            ),
          },
          { title: "数据格式", dataIndex: "input_version.format", width: 100 },
          { title: "样本数量", dataIndex: "input_version.row_count", width: 130 },
          { title: "数据大小（B）", dataIndex: "input_version.size_bytes", width: 150 },
          {
            title: "数据源仓库",
            dataIndex: "source.selection.repo_id",
            width: 240,
            ellipsis: true,
          },
          {
            title: "数据文件路径",
            dataIndex: "source.selection.file_path",
            width: 240,
            ellipsis: true,
          },
          { title: "发布时间", width: 180, render: (_, item) => formatDateTime(item.published_at) },
        ]}
        rowActions={[{ key: "detail", label: "查看版本", onClick: setSelected }]}
        pagination={{
          mode: "total",
          page: paging.page,
          pageSize: paging.pageSize,
          total: Number(versions.data?.total ?? 0),
          disabled: versions.isFetching,
          onPageChange: paging.setPage,
          onPageSizeChange: paging.setPageSize,
        }}
      />
      {selected && (
        <DatasetVersionDetailModal version={selected} onCancel={() => setSelected(null)} />
      )}
    </>
  );
}
