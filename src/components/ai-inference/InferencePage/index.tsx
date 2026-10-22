import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { listInferenceServices, type InferenceService } from "@/api/inference";
import { useInferenceActions } from "@/hooks/useInferenceActions";
import type { ListPagination } from "@/components/common/DataTable";
import {
  ResourceNameId,
  ListPageFrame,
  type ListColumn,
  ListDataTable,
  StatusBadge,
} from "@/components/common";
import { formatDateTime } from "@/lib/format";
import CreateInferenceModal from "../CreateInferenceModal";
import UpdateInferenceModal from "../UpdateInferenceModal";

export default function InferencePage() {
  const { actions, editing, closeEditor, onUpdated } = useInferenceActions(() => setPage(1));
  const [creating, setCreating] = useState(false);
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const query = useQuery({
    queryKey: ["governance-inference-services", { page, pageSize }],
    queryFn: ({ signal }) => listInferenceServices({ page, pageSize }, signal),
    meta: {
      errorNotification: {
        id: "inference-services",
        action: "推理服务列表加载",
      },
    },
  });
  const items = query.data?.items ?? [];
  const total = Number(query.data?.total ?? 0);
  // TODO(inference-contract): 已静态核对 page/pageSize 和 items/total；待部署后联调翻页、空页及权限过滤。
  const pagination: ListPagination = {
    mode: "total",
    page,
    pageSize,
    disabled: query.isFetching,
    total,
    onPageChange: setPage,
    onPageSizeChange: (size) => {
      setPageSize(size);
      setPage(1);
    },
  };
  const refresh = () => {
    qc.invalidateQueries({
      queryKey: ["governance-inference-services"],
      refetchType: "none",
    });
    setPage(1);
    if (page === 1) query.refetch();
  };
  const columns: ListColumn<InferenceService>[] = [
    {
      title: "名称 / ID",
      width: 200,
      fixed: "left",
      render: (_, item) => (
        <ResourceNameId name={item.name} id={item.id} type="inference-service" />
      ),
    },
    {
      title: "运行阶段",
      width: 120,
      ellipsis: true,
      render: (_, item) => <StatusBadge status={item.phase} />,
    },
    {
      title: "调用健康",
      width: 120,
      ellipsis: true,
      render: (_, item) => <StatusBadge status={item.health} />,
    },
    {
      title: "服务模型名",
      dataIndex: "served_model_name",
      width: 200,
      ellipsis: true,
    },
    {
      title: "模型版本",
      dataIndex: "model_version_id",
      width: 220,
      ellipsis: true,
    },
    {
      title: "启动命令",
      dataIndex: "command",
      width: 280,
      ellipsis: true,
    },
    {
      title: "副本",
      dataIndex: "replicas",
      width: 80,
      ellipsis: true,
    },
    {
      title: "观测时间",
      render: (_, item) => formatDateTime(item.observed_at),
      width: 180,
      ellipsis: true,
    },
  ];
  return (
    <>
      <ListPageFrame
        header={{
          title: "推理服务",
          subtitle: "部署模型并管理推理运行实例",
          iconClassName: "icon-tuili",
          actions: [
            {
              key: "deploy",
              label: "一键部署",
              iconClassName: "icon-add-1",
              variant: "primary",
              onClick: () => setCreating(true),
            },
          ],
        }}
        toolbar={{ refresh: { spinning: query.isFetching, onClick: refresh } }}
      >
        <ListDataTable
          data={items}
          columns={columns}
          rowActions={actions}
          loading={query.isFetching}
          pagination={pagination}
          tableLabel="推理服务列表"
        />
      </ListPageFrame>
      {creating && <CreateInferenceModal onCancel={() => setCreating(false)} />}
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
