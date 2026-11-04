import { useQuery } from "@tanstack/react-query";
import { listInstanceEvents } from "@/api/instances";
import { Alert } from "@arco-design/web-react";
import { withId } from "@/lib/id";
import { ListDataTable } from "@/components/common";
import { formatDateTime } from "@/lib/format";

type InstanceEventsProps = { instanceId?: string };

export default function InstanceEvents({ instanceId }: InstanceEventsProps) {
  // TODO(instance-events): 云主机、沙箱的新事件契约尚未提供，保留模板空态，待接口补齐后接入。
  const current = useQuery({
    queryKey: ["instance-events", instanceId],
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
  // TODO(governance-instance-events): 当前仅返回事件快照，待完整历史契约补齐并联调后接入分页。
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden">
      {current.data?.truncated && (
        <Alert className="shrink-0" type="info" content="当前事件较多，仅展示部分结果" />
      )}
      <ListDataTable
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
            dataIndex: "type",
          },
          { title: "原因", dataIndex: "reason", width: 180 },
          { title: "事件内容", width: 400, dataIndex: "message", ellipsis: true },
          { title: "次数", dataIndex: "count", width: 80 },
          {
            title: "最近发生时间",
            width: 180,
            render: (_, event) =>
              event.lastOccurredAt ? formatDateTime(event.lastOccurredAt) : "-",
          },
        ]}
      />
    </div>
  );
}
