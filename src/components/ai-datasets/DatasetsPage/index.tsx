import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { listDatasets, type Dataset, type DatasetState } from "@/api/modeldev";
import {
  ListDataTable,
  ListPageFrame,
  ResourceIdentity,
  StatusBadge,
  type ListColumn,
} from "@/components/common";
import { useListPagination } from "@/hooks/useListPagination";
import { useDatasetActions } from "@/hooks/useDatasetActions";
import { DATASET_STATE_LABELS } from "@/lib/datasets";
import { formatDateTime } from "@/lib/format";
import CreateDatasetModal from "../CreateDatasetModal";

export default function DatasetsPage() {
  const [creating, setCreating] = useState(false);
  const [state, setState] = useState<DatasetState | "ALL">("ALL");
  const [name, setName] = useState("");
  const filters = { state, name: name.trim() || undefined };
  const paging = useListPagination(JSON.stringify(filters), 20);
  const params = { ...filters, page: paging.page, pageSize: paging.pageSize };
  const qc = useQueryClient();
  const datasets = useQuery({
    queryKey: ["datasets", params],
    queryFn: ({ signal }) => listDatasets(params, signal),
    meta: { errorNotification: { id: "datasets", action: "数据集列表加载" } },
  });
  const { actions, dialogNode } = useDatasetActions();
  const columns: ListColumn<Dataset>[] = [
    {
      title: "名称 / ID",
      width: 200,
      fixed: "left",
      render: (_, item) => (
        <ResourceIdentity name={item.name} id={item.dataset_id} type="dataset" />
      ),
    },
    {
      title: "状态",
      width: 120,
      render: (_, item) => (
        <StatusBadge status={item.state}>{DATASET_STATE_LABELS[item.state]}</StatusBadge>
      ),
    },
    { title: "描述", dataIndex: "description", width: 240, ellipsis: true },
    { title: "更新时间", width: 180, render: (_, item) => formatDateTime(item.updated_at) },
  ];
  return (
    <>
      <ListPageFrame
        header={{
          iconClassName: "icon-moxing",
          title: "数据集管理",
          subtitle: "管理数据集集合、已发布版本与样本预览",
          actions: [
            {
              key: "create",
              label: "创建数据集",
              iconClassName: "icon-add-1",
              variant: "primary",
              onClick: () => setCreating(true),
            },
          ],
        }}
        tabs={{
          value: state,
          onChange: setState,
          items: [
            { value: "ALL", label: "全部" },
            { value: "ACTIVE", label: "启用" },
            { value: "ARCHIVED", label: "已归档" },
          ],
        }}
        toolbar={{
          search: {
            fields: [{ value: "name", label: "名称" }],
            field: "name",
            value: name,
            onFieldChange: () => undefined,
            onChange: setName,
            placeholder: "按名称搜索",
          },
          refresh: {
            spinning: datasets.isFetching,
            onClick: () => {
              qc.invalidateQueries({ queryKey: ["datasets"] });
            },
          },
        }}
      >
        <ListDataTable<Dataset>
          rowKey="dataset_id"
          data={datasets.data?.items ?? []}
          columns={columns}
          rowActions={actions}
          loading={datasets.isFetching}
          tableLabel="数据集列表"
          pagination={{
            mode: "total",
            page: paging.page,
            pageSize: paging.pageSize,
            total: Number(datasets.data?.total ?? 0),
            disabled: datasets.isFetching,
            onPageChange: paging.setPage,
            onPageSizeChange: paging.setPageSize,
          }}
        />
      </ListPageFrame>
      {creating && <CreateDatasetModal onCancel={() => setCreating(false)} />}
      {dialogNode}
    </>
  );
}
