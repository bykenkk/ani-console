import { listInstanceEvents, type InstanceEvent } from "@/api/instances/legacy";
import * as legacy from "@/api/instances/legacy";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { listInstanceEvents as listCurrentEvents } from "@/api/instances";
import { Button, Space, Alert } from "@arco-design/web-react";
import { useCursorPaginatedQuery } from "@/hooks/useCursorPaginatedQuery";
import { withId } from "@/lib/id";
import { Tag } from "@arco-design/web-react";
import { DataTable } from "@/components/common";
import { formatDateTime } from "@/lib/format";

type InstanceEventsProps = {
  instanceId: string;
  instanceKind?: legacy.InstanceKind;
};

export default function InstanceEvents({ instanceId, instanceKind }: InstanceEventsProps) {
  const [history, setHistory] = useState(false);
  const migrated = instanceKind === "container" || instanceKind === "gpu_container";
  const current = useQuery({
    queryKey: ["governance-instance-events", instanceId],
    enabled: migrated && !history,
    queryFn: ({ signal }) => listCurrentEvents(instanceId, signal),
    meta: {
      errorNotification: {
        id: withId("instance-events", instanceId),
        action: "事件加载",
        fallback: "请求失败，请稍后重试",
      },
    },
  });
  // FIXME(governance-instance-events): 新契约仅返回当前 Pod 事件快照，历史分页继续原调用。
  // TODO(governance-instance-events): 保留历史事件入口，待完整历史契约可用后迁移。

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
    enabled: !migrated || history,
    queryFn: (params) => listInstanceEvents(instanceId, params),
  });
  return (
    <div className="flex flex-col gap-3">
      {migrated && (
        <Space>
          <Button type={!history ? "primary" : "secondary"} onClick={() => setHistory(false)}>
            当前事件
          </Button>
          <Button type={history ? "primary" : "secondary"} onClick={() => setHistory(true)}>
            历史事件
          </Button>
          <Button
            loading={history ? events.isFetching : current.isFetching}
            onClick={() => (history ? events.refetch() : current.refetch())}
          >
            刷新
          </Button>
        </Space>
      )}
      {migrated && !history && (
        <>
          {current.data?.truncated && <Alert type="info" content="当前事件较多，仅展示部分结果" />}
          <DataTable
            data={current.data?.events ?? []}
            rowKey={(event) =>
              [event.type, event.reason, event.message, event.lastOccurredAt].join("/")
            }
            pagination={false}
            loading={current.isFetching}
            columns={[
              { title: "类型", dataIndex: "type", width: 100 },
              { title: "原因", dataIndex: "reason", width: 180 },
              { title: "消息", dataIndex: "message" },
              { title: "次数", dataIndex: "count", width: 80 },
              {
                title: "发生时间",
                width: 180,
                render: (_, event) =>
                  event.lastOccurredAt ? formatDateTime(event.lastOccurredAt) : "-",
              },
            ]}
          />
        </>
      )}
      {(!migrated || history) && (
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
      )}
    </div>
  );
}
