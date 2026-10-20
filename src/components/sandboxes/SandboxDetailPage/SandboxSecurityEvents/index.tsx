import { listInstanceSecurityEvents, type InstanceSecurityEvent } from "@/api/instances/legacy";
import { useCursorPaginatedQuery } from "@/hooks/useCursorPaginatedQuery";
import { withId } from "@/lib/id";
import { Select, Space, Tag } from "@arco-design/web-react";
import { useState } from "react";
import { DataTable } from "@/components/common";
import { formatDateTime } from "@/lib/format";

type SecurityEvent = InstanceSecurityEvent;
type Severity = "all" | "info" | "warning" | "critical";

export default function SandboxSecurityEvents({ instanceId }: { instanceId: string }) {
  const [severity, setSeverity] = useState<Severity>("all");
  const {
    query,
    items: pageItems,
    pagination,
  } = useCursorPaginatedQuery({
    errorNotification: {
      id: withId("sandbox-security", instanceId, severity),
      action: "安全事件加载",
      fallback: "请求失败，请稍后重试",
    },
    queryKey: ["sandbox-security-events", instanceId, severity],
    queryFn: (params) =>
      listInstanceSecurityEvents(instanceId, {
        ...params,
        severity: severity === "all" ? undefined : severity,
      }),
  });
  return (
    <Space direction="vertical" size={24} className="w-full">
      <section>
        <div className="mb-3 flex items-center justify-end gap-3">
          <Space>
            <span className="text-app-text-secondary">级别</span>
            <Select
              className="w-40"
              value={severity}
              onChange={setSeverity}
              options={[
                { label: "全部", value: "all" },
                { label: "信息", value: "info" },
                { label: "警告", value: "warning" },
                { label: "严重", value: "critical" },
              ]}
            />
          </Space>
        </div>
        <DataTable<SecurityEvent>
          tableLabel="安全事件"
          data={pageItems}
          loading={query.isLoading || query.isFetching}
          pagination={pagination}
          columns={[
            {
              title: "级别",
              width: 100,
              render: (_, item) => <Tag color={severityColor(item.severity)}>{item.severity}</Tag>,
            },
            { title: "类型", dataIndex: "event_type", width: 180 },
            { title: "说明", dataIndex: "message" },
            {
              title: "发生时间",
              width: 180,
              render: (_, item) => formatDateTime(item.occurred_at),
            },
          ]}
        />
      </section>
    </Space>
  );
}

function severityColor(severity: string) {
  if (severity === "critical") return "red";
  if (severity === "warning") return "orange";
  return "blue";
}
