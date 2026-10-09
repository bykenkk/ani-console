import { useCursorPaginatedQuery } from "@/hooks/useCursorPaginatedQuery";
import { withId } from "@/lib/id";
import { listInstanceEvents, type InstanceEvent } from "@/api/instances";
import { Tag } from "@arco-design/web-react";
import { DataTable } from "@/components/common";
import { formatDateTime } from "@/lib/format";

export default function InstanceEvents({ instanceId }: { instanceId: string }) {
  const {
    query: events,
    items: pageItems,
    pagination,
  } = useCursorPaginatedQuery({
    errorNotification: {
      id: withId("instance-events", instanceId),
      action: "事件加载",
      fallback: "请求失败，请稍后重试",
    },
    queryKey: ["instance-events", instanceId],
    queryFn: (params) => listInstanceEvents(instanceId, params),
  });
  return (
    <DataTable<InstanceEvent>
      data={pageItems}
      loading={events.isLoading}
      pagination={pagination}
      columns={[
        {
          title: "类型",
          width: 100,
          render: (_, event) => (
            <Tag color={event.type === "Warning" ? "orangered" : "green"}>{event.type}</Tag>
          ),
        },
        { title: "原因", dataIndex: "reason", width: 180 },
        { title: "消息", dataIndex: "message" },
        { title: "次数", dataIndex: "count", width: 80 },
        {
          title: "发生时间",
          width: 180,
          render: (_, event) => formatDateTime(event.occurred_at),
        },
      ]}
    />
  );
}
