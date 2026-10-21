// TODO(instance-detail-migration): 云主机、沙箱先统一使用实例公共组件；对应字段、契约及运行时联调验证完成后移除此标记。
import { Button, Card, Descriptions, Empty, Select, Space } from "@arco-design/web-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import type { EChartsOption } from "echarts";
import {
  getInstanceLatestMetrics,
  queryInstanceMetrics,
  type InstanceMetricSeries,
} from "@/api/instances";
import { CoreLineBarChart, StatusBadge } from "@/components/common";
import { getPreviousHoursDateTimeRange, formatTime } from "@/lib/date";
import { formatBytes } from "@/lib/format";
import { withId } from "@/lib/id";

type InstanceMetricsProps = {
  instanceId?: string;
  gpuOnly?: boolean;
  gpuModel?: string;
  gpuCount?: number;
};
const METRIC_LABELS = { "cpu.usage_cores": "CPU 使用量", "memory.working_set_bytes": "内存使用量" };
const STATUS_LABELS = { OK: "正常", PARTIAL: "部分数据缺失", NO_DATA: "无数据" };

function metricValue(series?: InstanceMetricSeries) {
  const value = series?.points[0]?.value;
  if (value == null) return "-";
  return series?.unit === "bytes" ? formatBytes(value) : `${Number(value.toFixed(3))} 核`;
}

function metricChart(series: InstanceMetricSeries): EChartsOption {
  return {
    tooltip: { trigger: "axis" },
    grid: { left: 65, right: 20, top: 35, bottom: 35 },
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: series.points.map((point) => formatTime(point.timestamp)),
    },
    yAxis: {
      type: "value",
      min: 0,
      name: series.unit === "bytes" ? "字节" : "核",
      axisLabel:
        series.unit === "bytes" ? { formatter: (value: number) => formatBytes(value) } : undefined,
    },
    series: [
      {
        type: "line",
        showSymbol: false,
        connectNulls: false,
        data: series.points.map((point) => point.value),
      },
    ],
  };
}

export default function InstanceMetrics({
  instanceId,
  gpuOnly = false,
  gpuModel,
  gpuCount,
}: InstanceMetricsProps) {
  const [hours, setHours] = useState(1);
  // TODO(instance-metrics): 联调核对时间边界、空数据、部分缺失及手动刷新；缺失点保留 null，不补零。
  const latest = useQuery({
    queryKey: ["governance-instance-metrics-latest", instanceId],
    enabled: Boolean(instanceId) && !gpuOnly,
    queryFn: ({ signal }) => getInstanceLatestMetrics(instanceId!, signal),
    meta: {
      errorNotification: {
        id: withId("instance-metrics-latest", instanceId),
        action: "监控指标加载",
      },
    },
  });
  const range = useQuery({
    queryKey: ["governance-instance-metrics-range", instanceId, hours],
    enabled: Boolean(instanceId) && !gpuOnly,
    queryFn: ({ signal }) =>
      queryInstanceMetrics(
        instanceId!,
        {
          ...getPreviousHoursDateTimeRange(hours),
          metric_codes: ["cpu.usage_cores", "memory.working_set_bytes"],
          step_seconds: 60,
        },
        signal,
      ),
    meta: {
      errorNotification: {
        id: withId("instance-metrics-range", instanceId),
        action: "监控趋势加载",
      },
    },
  });
  // TODO(instance-gpu-metrics): Governance 当前只提供 CPU/内存指标；GPU 专属指标契约对齐并联调通过后启用。
  if (gpuOnly)
    return (
      <Card title="GPU 指标">
        <Descriptions
          column={2}
          data={[
            { label: "GPU 型号", value: gpuModel || "-" },
            { label: "设备数量", value: gpuCount ?? "-" },
          ]}
        />
        <Empty description="暂无 GPU 监控数据" />
      </Card>
    );
  return (
    <Space direction="vertical" size={24} className="w-full">
      <div className="flex items-center gap-3">
        <Select
          aria-label="监控时间范围"
          value={hours}
          onChange={setHours}
          style={{ width: 150 }}
          options={[
            { value: 1, label: "最近 1 小时" },
            { value: 6, label: "最近 6 小时" },
            { value: 24, label: "最近 24 小时" },
          ]}
        />
        <Button
          disabled={!instanceId}
          loading={latest.isFetching || range.isFetching}
          onClick={() => Promise.all([latest.refetch(), range.refetch()])}
        >
          刷新
        </Button>
      </div>
      <Descriptions
        column={2}
        data={[
          {
            label: "CPU 使用量",
            value: metricValue(
              latest.data?.data.series.find((series) => series.metric_code === "cpu.usage_cores"),
            ),
          },
          {
            label: "内存使用量",
            value: metricValue(
              latest.data?.data.series.find(
                (series) => series.metric_code === "memory.working_set_bytes",
              ),
            ),
          },
        ]}
      />
      {(["cpu.usage_cores", "memory.working_set_bytes"] as const).map((code) => {
        const series = range.data?.data.series.find((item) => item.metric_code === code);
        return (
          <Card
            key={code}
            title={METRIC_LABELS[code]}
            extra={
              series && (
                <StatusBadge status={series.status}>{STATUS_LABELS[series.status]}</StatusBadge>
              )
            }
            loading={range.isLoading}
          >
            {series?.points.some((point) => point.value !== null) ? (
              <CoreLineBarChart option={metricChart(series)} style={{ height: 260 }} />
            ) : (
              <Empty description="暂无监控数据" />
            )}
          </Card>
        );
      })}
    </Space>
  );
}
