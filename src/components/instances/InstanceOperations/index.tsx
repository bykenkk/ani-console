import { listInstanceOperations, type InstanceOperation } from "@/api/instances/legacy";
import { Button } from "@arco-design/web-react";
import { useQuery } from "@tanstack/react-query";
import { getInstanceOperation } from "@/api/instances";
import { withId } from "@/lib/id";
import { DataTable, StatusBadge } from "@/components/common";
import { useCursorPaginatedQuery } from "@/hooks/useCursorPaginatedQuery";
import { formatDateTime } from "@/lib/format";

const OPERATION_LABELS: Record<string, string> = {
  create: "创建",
  start: "启动",
  stop: "停止",
  restart: "重启",
  scale: "扩缩容",
  update_image: "更新镜像",
  resize: "变配",
  rebuild: "重建",
  delete: "删除",
  snapshot: "快照",
  attach_volume: "挂载云盘",
  detach_volume: "卸载云盘",
  attach_filesystem: "挂载 NFS",
  detach_filesystem: "卸载 NFS",
  bind_secret: "绑定密钥",
  unbind_secret: "解绑密钥",
  change_security_groups: "更换安全组",
  set_termination_protection: "终止保护",
  rollback: "回滚发布",
  console_session: "终端会话",
};

export default function InstanceOperations({
  instanceId,
  operationId,
}: {
  instanceId: string;
  operationId?: string;
}) {
  const current = useQuery({
    queryKey: ["governance-instance-operation", operationId],
    enabled: Boolean(operationId),
    queryFn: ({ signal }) => getInstanceOperation(operationId!, signal),
    meta: {
      errorNotification: { id: withId("instance-operation", operationId), action: "操作状态加载" },
    },
  });
  // FIXME(governance-instance-operations): 新契约仅支持单次操作查询，不等价于原操作历史及详情。
  // TODO(governance-instance-operations): 原历史组件与调用保留，待历史查询能力就绪后迁移。

  const {
    query,
    items: pageItems,
    pagination,
  } = useCursorPaginatedQuery<InstanceOperation>({
    errorNotification: {
      id: withId("instance-operations", instanceId),
      action: "操作记录加载",
      fallback: "请求失败，请稍后重试",
    },
    queryKey: ["instance-operations", instanceId],
    initialPageSize: 10,
    queryFn: async ({ cursor, limit }) => {
      return listInstanceOperations(instanceId, { limit, cursor });
    },
  });
  return (
    <div className="flex flex-col gap-3">
      {operationId && (
        <DataTable
          data={current.data ? [current.data] : []}
          loading={current.isFetching}
          pagination={false}
          header={{
            title: "最近操作",
            extra: (
              <Button loading={current.isFetching} onClick={() => current.refetch()}>
                刷新
              </Button>
            ),
          }}
          columns={[
            { title: "操作 ID", dataIndex: "id" },
            { title: "操作", dataIndex: "action" },
            {
              title: "状态",
              render: (_, row) => <StatusBadge status={row.state} reason={row.reason} />,
            },
          ]}
        />
      )}
      <DataTable<InstanceOperation>
        data={pageItems}
        loading={query.isFetching}
        pagination={pagination}
        columns={[
          {
            title: "操作时间",
            width: 180,
            render: (_, operation) => formatDateTime(operation.created_at),
          },
          {
            title: "操作",
            width: 140,
            render: (_, operation) => OPERATION_LABELS[operation.operation] ?? operation.operation,
          },
          {
            title: "状态",
            width: 120,
            render: (_, operation) => (
              <StatusBadge
                status={operation.status}
                reason={operation.failure_reason}
                message={operation.failure_message}
              />
            ),
          },
        ]}
      />
    </div>
  );
}
