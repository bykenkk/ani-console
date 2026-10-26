import { useState } from "react";
import { Button, Card, Empty, Select, Space } from "@arco-design/web-react";
import { useQuery } from "@tanstack/react-query";
import type { EChartsOption } from "echarts";
import { getInferenceMetrics, type InferenceMetricSeries } from "@/api/inference";
import { CoreLineBarChart } from "@/components/common";
import { getPreviousHoursDateTimeRange, formatTime } from "@/lib/date";
import { formatBytes } from "@/lib/format";
import { withId } from "@/lib/id";

type InferenceMetricsProps = { serviceId: string };
const STEP_OPTIONS = [15, 30, 60, 300, 900, 3600];
const METRICS = [
  { name: "cpu", label: "CPU 使用量" },
  { name: "memory", label: "内存使用量" },
] as const;

function chartOption(series: InferenceMetricSeries): EChartsOption {
  return {
    tooltip: { trigger: "axis" },
    grid: { left: 70, right: 20, top: 35, bottom: 35 },
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

export default function InferenceMetrics({ serviceId }: InferenceMetricsProps) {
  const [hours, setHours] = useState(1);
  const [step, setStep] = useState(60);
  const query = useQuery({
    queryKey: ["governance-inference-metrics", serviceId, hours, step],
    queryFn: ({ signal }) =>
      getInferenceMetrics(serviceId, { ...getPreviousHoursDateTimeRange(hours), step }, signal),
    meta: {
      errorNotification: { id: withId("inference-metrics", serviceId), action: "推理资源指标加载" },
    },
  });
  return (
    <div className="flex flex-col gap-4">
      <Space wrap>
        <Select
          aria-label="指标时间范围"
          className="w-40"
          value={hours}
          options={[
            { value: 1, label: "最近 1 小时" },
            { value: 6, label: "最近 6 小时" },
            { value: 24, label: "最近 24 小时" },
          ]}
          onChange={(value: number) => {
            setHours(value);
            setStep((current) => Math.max(current, Math.ceil((value * 3600) / 1440 / 15) * 15));
          }}
        />
        <Select
          aria-label="采样间隔"
          className="w-40"
          value={step}
          options={STEP_OPTIONS.map((value) => ({
            value,
            label: `每 ${value} 秒`,
            disabled: (hours * 3600) / value > 1440,
          }))}
          onChange={setStep}
        />
        <Button loading={query.isFetching} onClick={() => query.refetch()}>
          刷新指标
        </Button>
      </Space>
      {METRICS.map((metric) => {
        const series = query.data?.series.find((item) => item.name === metric.name);
        return (
          <Card key={metric.name} title={metric.label} loading={query.isLoading}>
            {series?.points.length ? (
              <CoreLineBarChart option={chartOption(series)} style={{ height: 260 }} />
            ) : (
              <Empty description="暂无监控数据" />
            )}
          </Card>
        );
      })}
      {/* FIXME(inference-request-metrics): 当前仅有 CPU/内存指标；请求量、成功率和延迟仍缺少正式接口，待后端补齐后接入。 */}
    </div>
  );
}
