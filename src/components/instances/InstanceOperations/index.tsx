import { useQuery } from "@tanstack/react-query";
import { getInstanceOperation } from "@/api/instances";
import { DataTable, StatusBadge } from "@/components/common";
import { withId } from "@/lib/id";

type InstanceOperationsProps = { operationId?: string };
const ACTION_LABELS: Record<string, string> = {
  CREATE: "创建",
  START: "启动",
  STOP: "停止",
  DELETE: "删除",
  create: "创建",
  start: "启动",
  stop: "停止",
  delete: "删除",
  restart: "重启",
  "attach-pvc": "挂载云盘",
  "detach-pvc": "卸载云盘",
};

export default function InstanceOperations({ operationId }: InstanceOperationsProps) {
  const query = useQuery({
    queryKey: ["governance-instance-operation", operationId],
    enabled: Boolean(operationId),
    queryFn: ({ signal }) => getInstanceOperation(operationId!, signal),
    refetchInterval: (query) =>
      query.state.data &&
      ["restart", "attach-pvc", "detach-pvc"].includes(query.state.data.action) &&
      !["completed", "failed", "superseded"].includes(query.state.data.state)
        ? 4000
        : false,
    meta: {
      errorNotification: { id: withId("instance-operation", operationId), action: "操作状态加载" },
    },
  });
  // TODO(instance-operation-history): 当前仅能查询最近操作，无操作时间及完整历史；云主机、沙箱暂无新操作契约，待补齐并联调后接入。
  return (
    <DataTable
      data={query.data ? [query.data] : []}
      loading={query.isFetching}
      rowKey="id"
      pagination={false}
      columns={[
        { title: "操作时间", width: 180, render: () => "-" },
        {
          title: "操作",
          width: 140,
          render: (_, row) => ACTION_LABELS[row.action] ?? row.action,
        },
        {
          title: "状态",
          width: 120,
          render: (_, row) => (
            <StatusBadge
              status={row.state}
              reason={row.failure_reason || row.reason}
              tone={
                row.state === "completed"
                  ? "success"
                  : row.state === "blocked"
                    ? "warning"
                    : undefined
              }
              loading={row.state === "blocked" ? true : undefined}
            />
          ),
        },
      ]}
    />
  );
}
