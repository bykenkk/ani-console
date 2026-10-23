import { Button, Input, Select, Space } from "@arco-design/web-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { listInferenceEvents, type InferenceRuntimeEvent } from "@/api/inference";
import { DataTable } from "@/components/common";
import { useListPagination } from "@/hooks/useListPagination";
import { getPreviousHoursDateTimeRange } from "@/lib/date";
import { formatDateTime } from "@/lib/format";
import { withId } from "@/lib/id";

type InferenceEventsProps = { serviceId: string };

export default function InferenceEvents({ serviceId }: InferenceEventsProps) {
  const [type, setType] = useState("");
  const [hours, setHours] = useState(0);
  const [since, setSince] = useState<string>();
  const paging = useListPagination(JSON.stringify([serviceId, type, since]), 10);
  const { page, pageSize } = paging;
  const params = { page, pageSize, type: type || undefined, since };
  const events = useQuery({
    queryKey: ["governance-inference-events", serviceId, params],
    queryFn: ({ signal }) => listInferenceEvents(serviceId, params, signal),
    meta: {
      errorNotification: { id: withId("inference-events", serviceId), action: "推理事件加载" },
    },
  });
  return (
    <DataTable<InferenceRuntimeEvent>
      header={{
        title: "服务事件",
        extra: (
          <Space>
            <Input.Search
              aria-label="事件类型"
              placeholder="事件类型"
              allowClear
              onSearch={(value) => setType(value.trim())}
              onClear={() => setType("")}
              className="w-40"
            />
            <Select
              aria-label="事件时间范围"
              value={hours}
              className="w-32"
              options={[
                { value: 0, label: "全部时间" },
                { value: 1, label: "最近 1 小时" },
                { value: 24, label: "最近 24 小时" },
              ]}
              onChange={(value: number) => {
                setHours(value);
                setSince(value ? getPreviousHoursDateTimeRange(value).start : undefined);
              }}
            />
            <Button loading={events.isFetching} onClick={() => events.refetch()}>
              刷新
            </Button>
          </Space>
        ),
      }}
      data={events.data?.items ?? []}
      loading={events.isFetching}
      columns={[
        { title: "类型", dataIndex: "type", width: 120 },
        { title: "发生时间", width: 180, render: (_, event) => formatDateTime(event.timestamp) },
        { title: "原因", dataIndex: "reason", width: 180, ellipsis: true },
        { title: "描述", dataIndex: "message", width: 400, ellipsis: true },
        { title: "实例", dataIndex: "instance", width: 200, ellipsis: true },
        { title: "次数", dataIndex: "count", width: 100 },
      ]}
      pagination={{
        mode: "total",
        page,
        pageSize,
        total: Number(events.data?.total ?? 0),
        disabled: events.isFetching,
        onPageChange: paging.setPage,
        onPageSizeChange: paging.setPageSize,
      }}
      tableLabel="推理服务事件列表"
    />
  );
}
