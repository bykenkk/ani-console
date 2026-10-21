import { useQuery } from "@tanstack/react-query";
import { listInstanceEvents } from "@/api/instances";
import { Button, Space, Alert, Tag } from "@arco-design/web-react";
import { withId } from "@/lib/id";
import { DataTable } from "@/components/common";
import { formatDateTime } from "@/lib/format";

type InstanceEventsProps = { instanceId?: string };

export default function InstanceEvents({ instanceId }: InstanceEventsProps) {
  // TODO(instance-detail-migration): 云主机、沙箱事件契约和实例 ID 对齐并联调验证后，在调用方传入 ID，再移除对应标记。
  const current = useQuery({
    queryKey: ["governance-instance-events", instanceId],
    enabled: Boolean(instanceId),
    queryFn: ({ signal }) => listInstanceEvents(instanceId!, signal),
    meta: {
      errorNotification: {
        id: withId("instance-events", instanceId),
        action: "事件加载",
        fallback: "请求失败，请稍后重试",
      },
    },
  });
  // FIXME(governance-instance-events): 当前仅有事件快照，历史事件入口暂不可用。
  // TODO(governance-instance-events): 完整历史契约对齐并验证后启用历史入口。
  return (
    <div className="flex flex-col gap-3">
      <Space>
        <Button type="primary">当前事件</Button>
        <Button disabled title="历史事件暂未开放">
          历史事件
        </Button>
        <Button
          disabled={!instanceId}
          loading={current.isFetching}
          onClick={() => current.refetch()}
        >
          刷新
        </Button>
      </Space>
      {current.data?.truncated && <Alert type="info" content="当前事件较多，仅展示部分结果" />}
      <DataTable
        data={current.data?.events ?? []}
        rowKey={(event) =>
          [event.type, event.reason, event.message, event.lastOccurredAt].join("/")
        }
        pagination={false}
        loading={current.isFetching}
        columns={[
          {
            title: "类型",
            width: 100,
            render: (_, event) => (
              <Tag color={event.type === "Warning" ? "orangered" : "green"}>{event.type}</Tag>
            ),
          },
          { title: "原因", dataIndex: "reason", width: 180 },
          { title: "消息", width: 400, dataIndex: "message", ellipsis: true },
          { title: "次数", dataIndex: "count", width: 80 },
          {
            title: "发生时间",
            width: 180,
            render: (_, event) =>
              event.lastOccurredAt ? formatDateTime(event.lastOccurredAt) : "-",
          },
        ]}
      />
    </div>
  );
}
