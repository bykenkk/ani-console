import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listInferenceServices,
  type InferenceService,
  type InferenceAcceptance,
} from "@/api/inference";
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
import InferenceOperationModal from "../InferenceOperationModal";

export default function InferencePage() {
  const { actions, dialogNode } = useInferenceActions();
  const [creating, setCreating] = useState(false);
  const [acceptance, setAcceptance] = useState<InferenceAcceptance>();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [tokens, setTokens] = useState<(string | undefined)[]>([undefined]);
  const query = useQuery({
    queryKey: [
      "governance-inference-services",
      { page_size: pageSize, page_token: tokens[page - 1] },
    ],
    queryFn: ({ signal }) =>
      listInferenceServices({ page_size: pageSize, page_token: tokens[page - 1] }, signal),
    meta: { errorNotification: { id: "inference-services", action: "推理服务列表加载" } },
  });
  const items = query.data?.services ?? [];
  const pagination: ListPagination = {
    mode: "cursor",
    page,
    pageSize,
    disabled: query.isFetching,
    hasNextPage: Boolean(query.data?.next_page_token),
    onPageChange: (next) => {
      if (next === page + 1 && query.data?.next_page_token) {
        setTokens((current) => [...current.slice(0, page), query.data!.next_page_token]);
        setPage(next);
      } else if (next >= 1 && next < page) setPage(next);
    },
    onPageSizeChange: (size) => {
      setPageSize(size);
      setPage(1);
      setTokens([undefined]);
    },
  };
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["governance-inference-services"], refetchType: "none" });
    setPage(1);
    setTokens([undefined]);
    if (page === 1) query.refetch();
  };
  const columns: ListColumn<InferenceService>[] = [
    {
      title: "名称 / ID",
      render: (_, item) => (
        <ResourceNameId name={item.name} id={item.id} type="inference-service" />
      ),
    },
    { title: "运行阶段", render: (_, item) => <StatusBadge status={item.phase} /> },
    { title: "调用健康", render: (_, item) => <StatusBadge status={item.health} /> },
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
    { title: "观测时间", render: (_, item) => formatDateTime(item.observed_at), width: 170 },
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
      {creating && (
        <CreateInferenceModal onCancel={() => setCreating(false)} onCreated={setAcceptance} />
      )}
      {acceptance && (
        <InferenceOperationModal
          acceptance={acceptance}
          onCancel={() => setAcceptance(undefined)}
        />
      )}
      {dialogNode}
    </>
  );
}
