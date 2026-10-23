import { Button, Descriptions, Empty, Space } from "@arco-design/web-react";
import { useQuery } from "@tanstack/react-query";
import { getInferenceRuntime, type InferenceRuntimeInstance } from "@/api/inference";
import { DataTable, StatusBadge } from "@/components/common";
import { formatDateTime } from "@/lib/format";
import { withId } from "@/lib/id";

type InferenceMonitoringProps = { serviceId: string };

export default function InferenceMonitoring({ serviceId }: InferenceMonitoringProps) {
  const runtime = useQuery({
    queryKey: ["governance-inference-runtime", serviceId],
    queryFn: ({ signal }) => getInferenceRuntime(serviceId, signal),
    meta: {
      errorNotification: { id: withId("inference-runtime", serviceId), action: "推理运行诊断加载" },
    },
  });
  const item = runtime.data;
  return (
    <div className="flex flex-col gap-4">
      <Space>
        <Button loading={runtime.isFetching} onClick={() => runtime.refetch()}>
          刷新
        </Button>
      </Space>
      <Descriptions
        title="运行诊断"
        column={1}
        data={[
          {
            label: "调用健康",
            value: <StatusBadge status={item?.invocation_health} reason={item?.health_reason} />,
          },
          { label: "健康原因", value: item?.health_reason || "-" },
          { label: "健康观测时间", value: formatDateTime(item?.health_observed_at) },
          { label: "运行观测时间", value: formatDateTime(item?.runtime_observed_at) },
          { label: "诊断观测时间", value: formatDateTime(item?.observed_at) },
        ]}
      />
      <DataTable<InferenceRuntimeInstance>
        header={{ title: "运行实例" }}
        data={item?.instances ?? []}
        loading={runtime.isFetching}
        rowKey={(instance) => instance.uid || instance.name}
        pagination={false}
        columns={[
          { title: "名称", dataIndex: "name", width: 200, ellipsis: true },
          { title: "实例 UID", dataIndex: "uid", width: 240, ellipsis: true },
          {
            title: "运行阶段",
            width: 120,
            render: (_, instance) => <StatusBadge status={instance.phase} />,
          },
          {
            title: "容器",
            width: 240,
            ellipsis: true,
            render: (_, instance) => instance.containers?.join(", ") || "-",
          },
        ]}
        tableLabel="推理运行实例列表"
      />
      {/* FIXME(inference-metrics): 当前只有运行诊断，缺少请求量、成功率、延迟和资源使用指标接口，补齐后接入图表。 */}
      <Empty description="暂无监控指标" />
    </div>
  );
}
