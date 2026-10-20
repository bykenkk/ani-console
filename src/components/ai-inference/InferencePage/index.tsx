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

export default function InferencePage() {
  const { actions } = useInferenceActions(() => setPage(1));
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
  // FIXME(api-contract): 用户确认保留原推理分支页码分页，尚未与当前后端索引对齐。
  // TODO(api-contract): 对应后端版本就绪后联调列表、筛选及 total，不回退旧分页。
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
      render: (_, item) => (
        <ResourceNameId name={item.name} id={item.id} type="inference-service" />
      ),
    },
    {
      title: "运行阶段",
      render: (_, item) => <StatusBadge status={item.phase} />,
    },
    {
      title: "调用健康",
      render: (_, item) => <StatusBadge status={item.health} />,
    },
    { title: "服务模型名", dataIndex: "served_model_name", ellipsis: true },
    { title: "模型版本", dataIndex: "model_version_id", ellipsis: true },
    { title: "启动命令", dataIndex: "command", ellipsis: true },
    { title: "副本", dataIndex: "replicas", width: 80 },
    {
      title: "GPU 规格",
      render: (_, item) =>
        item.gpu ? `${item.gpu.profile_id} · v${item.gpu.profile_version}` : "CPU",
      ellipsis: true,
    },
    {
      title: "观测时间",
      render: (_, item) => formatDateTime(item.observed_at),
      width: 170,
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
    </>
  );
}
