// TODO(instance-detail-migration): 云主机、沙箱先统一使用实例公共组件；对应字段、契约及运行时联调验证完成后移除此标记。
import { Button } from "@arco-design/web-react";
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
};

export default function InstanceOperations({ operationId }: InstanceOperationsProps) {
  const query = useQuery({
    queryKey: ["governance-instance-operation", operationId],
    enabled: Boolean(operationId),
    queryFn: ({ signal }) => getInstanceOperation(operationId!, signal),
    meta: {
      errorNotification: { id: withId("instance-operation", operationId), action: "操作状态加载" },
    },
  });
  return (
    <div className="flex flex-col gap-6">
      <DataTable
        header={{
          title: "最近操作",
          extra: (
            <Button
              disabled={!operationId}
              loading={query.isFetching}
              onClick={() => query.refetch()}
            >
              刷新
            </Button>
          ),
        }}
        data={query.data ? [query.data] : []}
        loading={query.isFetching}
        rowKey="id"
        pagination={false}
        columns={[
          { title: "操作 ID", width: 280, dataIndex: "id", ellipsis: true },
          {
            title: "操作",
            width: 200,
            render: (_, row) => ACTION_LABELS[row.action] ?? row.action,
          },
          {
            title: "状态",
            width: 120,
            render: (_, row) => <StatusBadge status={row.state} reason={row.reason} />,
          },
        ]}
      />
      {/* FIXME(instance-operation-history): 当前仅支持单次操作查询，没有操作历史列表契约。 */}
      {/* TODO(instance-operation-history): 后端提供历史列表后接入，不用最近操作伪造完整历史。 */}
      <DataTable<{ id: string; action: string; state: string }>
        header={{ title: "操作记录" }}
        data={[]}
        pagination={false}
        rowKey="id"
        columns={[
          { title: "操作时间", width: 180, render: () => "-" },
          { title: "操作", width: 200, dataIndex: "action" },
          { title: "状态", width: 120, dataIndex: "state" },
        ]}
      />
    </div>
  );
}
