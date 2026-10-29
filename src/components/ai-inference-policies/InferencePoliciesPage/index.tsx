import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { listInferencePolicies, type InferencePolicy } from "@/api/inference-policies";
import { ListPageFrame, ListDataTable, ResourceNameId, type ListColumn } from "@/components/common";
import { useListPagination } from "@/hooks/useListPagination";
import { showMessage } from "@/lib/feedback";
import SaveInferencePolicyModal from "../SaveInferencePolicyModal";
import DeleteInferencePolicyModal from "../DeleteInferencePolicyModal";

const columns: ListColumn<InferencePolicy>[] = [
  {
    title: "名称 / ID",
    width: 200,
    fixed: "left",
    render: (_, item) => <ResourceNameId name={item.name} id={item.id} type="inference-policy" />,
  },
  {
    title: "授权模型",
    width: 300,
    ellipsis: true,
    render: (_, item) => item.allowed_model_names.join("、") || "拒绝全部模型",
  },
  { title: "QPS", width: 140, render: (_, item) => item.requests_per_second || "不限" },
  { title: "RPM", width: 140, render: (_, item) => item.requests_per_minute || "不限" },
  { title: "RPH", width: 140, render: (_, item) => item.requests_per_hour || "不限" },
];

export default function InferencePoliciesPage() {
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<InferencePolicy>();
  const [deleting, setDeleting] = useState<InferencePolicy>();
  const { page, pageSize, setPage, setPageSize } = useListPagination("inference-policies", 20);
  const policies = useQuery({
    queryKey: ["governance-inference-policies", { page, pageSize }],
    queryFn: ({ signal }) => listInferencePolicies({ page, pageSize }, signal),
    meta: { errorNotification: { id: "inference-policies", action: "访问策略列表加载" } },
  });
  return (
    <>
      <ListPageFrame
        header={{
          title: "限流与访问策略",
          iconClassName: "icon-anquanzu",
          subtitle: "配置模型授权及请求上限，绑定此策略的 API Key 分别计数",
          actions: [
            {
              key: "create",
              label: "创建访问策略",
              iconClassName: "icon-add-1",
              variant: "primary",
              onClick: () => setCreating(true),
            },
          ],
        }}
        toolbar={{
          refresh: {
            onClick: () => policies.refetch(),
            spinning: policies.isFetching,
            disabled: policies.isFetching,
          },
        }}
      >
        <ListDataTable
          tableLabel="访问策略列表"
          data={policies.data?.items ?? []}
          columns={columns}
          loading={policies.isFetching}
          emptyText="暂无访问策略"
          rowActions={[
            {
              key: "detail",
              label: "查看详情",
              onClick: (item) =>
                navigate({ to: "/ai-inference-policies/$policyId", params: { policyId: item.id } }),
            },
            { key: "edit", label: "编辑", onClick: setEditing },
            { key: "delete", label: "删除", intent: "danger", onClick: setDeleting },
          ]}
          pagination={{
            page,
            pageSize,
            total: Number(policies.data?.total ?? "0"),
            disabled: policies.isFetching,
            pageSizeOptions: [10, 20, 50, 100],
            onPageSizeChange: setPageSize,
            onPageChange: (nextPage) => {
              if (nextPage < 1 || nextPage > 100) {
                showMessage({
                  type: "warning",
                  content: "仅支持第 1～100 页，可增加每页条数查看更多记录",
                });
                return;
              }
              setPage(nextPage);
            },
          }}
        />
      </ListPageFrame>
      {(creating || editing) && (
        <SaveInferencePolicyModal
          policy={editing}
          onCancel={() => {
            setCreating(false);
            setEditing(undefined);
          }}
          onSaved={() => {
            if (creating) setPage(1);
            setCreating(false);
            setEditing(undefined);
          }}
        />
      )}
      {deleting && (
        <DeleteInferencePolicyModal
          policy={deleting}
          onCancel={() => setDeleting(undefined)}
          onDeleted={() => setDeleting(undefined)}
        />
      )}
    </>
  );
}
