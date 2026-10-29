import { useQuery } from "@tanstack/react-query";
import type { EChartsOption } from "echarts";
import {
  getInstanceLatestMetrics,
  queryInstanceMetrics,
  type InstanceMetricCode,
  type InstanceMetricSeries,
} from "@/api/instances";
import { getPreviousHoursDateTimeRange, formatTime } from "@/lib/date";
import { formatBytes } from "@/lib/format";
import { withId } from "@/lib/id";

const BASE_METRIC_CODES: InstanceMetricCode[] = ["cpu.usage_cores", "memory.working_set_bytes"];
const METRIC_CODES: InstanceMetricCode[] = [
  ...BASE_METRIC_CODES,
  "network.receive_bytes_per_second",
  "network.transmit_bytes_per_second",
];
const GPU_METRIC_CODES: InstanceMetricCode[] = [
  "gpu.utilization_percent",
  "gpu.memory_usage_bytes",
];
const METRIC_LABELS: Record<InstanceMetricCode, string> = {
  "cpu.usage_cores": "CPU 使用量",
  "memory.working_set_bytes": "内存使用量",
  "network.receive_bytes_per_second": "网络接收速率",
  "network.transmit_bytes_per_second": "网络发送速率",
  "gpu.utilization_percent": "GPU 利用率",
  "gpu.memory_usage_bytes": "GPU 显存",
};
const METRIC_UNIT_LABELS: Record<InstanceMetricSeries["unit"], string> = {
  cores: "核",
  bytes: "字节",
  bytes_per_second: "B/s",
  percent: "%",
};
const METRIC_CHARTS: Array<{
  key: string;
  title: string;
  codes: InstanceMetricCode[];
  unit: InstanceMetricSeries["unit"];
}> = [
  { key: "cpu", title: "CPU 使用量趋势", codes: ["cpu.usage_cores"], unit: "cores" },
  {
    key: "memory",
    title: "内存使用量趋势",
    codes: ["memory.working_set_bytes"],
    unit: "bytes",
  },
  {
    key: "network",
    title: "网络收发速率趋势",
    codes: ["network.receive_bytes_per_second", "network.transmit_bytes_per_second"],
    unit: "bytes_per_second",
  },
];
const METRIC_STEP_SECONDS = 60;
const METRIC_RANGE_HOURS = 1;

function metricValue(value: number | null | undefined, unit?: InstanceMetricSeries["unit"]) {
  if (value == null || unit == null) return "-";
  if (unit === "bytes") return formatBytes(value);
  if (unit === "bytes_per_second") return `${formatBytes(value)}/s`;
  if (unit === "percent") return `${Number(value.toFixed(3))}%`;
  return `${Number(value.toFixed(3))} 核`;
}

function metricChart(
  series: InstanceMetricSeries[],
  unit: InstanceMetricSeries["unit"],
): EChartsOption {
  const timestamps = [
    ...new Set(series.flatMap((item) => item.points.map((point) => point.timestamp))),
  ].sort();
  return {
    tooltip: { trigger: "axis" },
    legend: { bottom: 0 },
    grid: { left: 85, right: 30, top: 35, bottom: 48 },
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: timestamps.map((timestamp) => formatTime(timestamp)),
    },
    yAxis: {
      type: "value",
      min: 0,
      name: METRIC_UNIT_LABELS[unit],
      axisLine: { onZero: false },
      axisLabel:
        unit === "cores" ? undefined : { formatter: (value: number) => metricValue(value, unit) },
    },
    series: series.map((item) => {
      const points = new Map(item.points.map((point) => [point.timestamp, point.value]));
      return {
        name: METRIC_LABELS[item.metric_code],
        type: "line",
        smooth: true,
        showSymbol: item.points.filter((point) => point.value !== null).length < 2,
        connectNulls: false,
        tooltip: {
          valueFormatter: (value) =>
            metricValue(typeof value === "number" ? value : null, item.unit),
        },
        data: timestamps.map((timestamp) => points.get(timestamp) ?? null),
      };
    }),
  };
}

export function useGovernanceMetrics(instanceId?: string, hasGpuMetrics = false) {
  // TODO(instance-metrics): Gov 新版部署后联调 GPU 非零值、多卡聚合及 VM 指标；缺失点保留 null，不补零。
  const latest = useQuery({
    queryKey: ["governance-instance-metrics-latest", instanceId],
    enabled: Boolean(instanceId),
    queryFn: ({ signal }) => getInstanceLatestMetrics(instanceId!, signal),
    meta: {
      errorNotification: {
        id: withId("instance-metrics-latest", instanceId),
        action: "监控指标加载",
      },
    },
  });
  // latest 返回的指标目录用于兼容 Gov 的 2 / 4 / 6 项版本，NO_DATA 不代表指标未启用。
  const hasNetworkMetrics = METRIC_CODES.every((code) =>
    latest.data?.data.series.some((series) => series.metric_code === code),
  );
  const supportsGpuMetrics = GPU_METRIC_CODES.every((code) =>
    latest.data?.data.series.some((series) => series.metric_code === code),
  );
  const metricCodes = [
    ...(hasNetworkMetrics ? METRIC_CODES : BASE_METRIC_CODES),
    ...(hasGpuMetrics && supportsGpuMetrics ? GPU_METRIC_CODES : []),
  ];
  const range = useQuery({
    queryKey: [
      "governance-instance-metrics-range",
      instanceId,
      METRIC_RANGE_HOURS,
      metricCodes,
      METRIC_STEP_SECONDS,
    ],
    enabled: Boolean(instanceId),
    queryFn: ({ signal }) =>
      queryInstanceMetrics(
        instanceId!,
        {
          ...getPreviousHoursDateTimeRange(METRIC_RANGE_HOURS),
          metric_codes: metricCodes,
          step_seconds: METRIC_STEP_SECONDS,
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
  const latestValue = (code: InstanceMetricCode) => {
    const series = latest.data?.data.series.find((item) => item.metric_code === code);
    return metricValue(series?.points[0]?.value, series?.unit);
  };
  const gpuUtilization = latestValue("gpu.utilization_percent");
  const gpuMemoryUsage = latestValue("gpu.memory_usage_bytes");
  const statistics = [
    { title: "CPU 使用量", value: latestValue("cpu.usage_cores") },
    { title: "内存使用量", value: latestValue("memory.working_set_bytes") },
    ...(hasGpuMetrics
      ? [
          { title: "GPU 利用率", value: gpuUtilization },
          { title: "GPU 显存", value: gpuMemoryUsage },
        ]
      : []),
    {
      title: "网络入 / 出速率",
      value: `${latestValue("network.receive_bytes_per_second")} / ${latestValue("network.transmit_bytes_per_second")}`,
    },
  ];
  const series = range.data?.data.series ?? [];
  const gpuSeries = series.filter((item) => item.metric_code === "gpu.utilization_percent");
  const charts = METRIC_CHARTS.map(({ key, title, codes, unit }) => {
    const chartSeries = series.filter((item) => codes.includes(item.metric_code));
    return {
      key,
      title,
      hasTrend: chartSeries.some((item) => item.points.some((point) => point.value !== null)),
      option: metricChart(chartSeries, unit),
    };
  });
  const gpuChart = {
    key: "gpu",
    title: "GPU 利用率趋势",
    hasTrend: gpuSeries.some((item) => item.points.some((point) => point.value !== null)),
    option: metricChart(gpuSeries, "percent"),
  };
  return {
    statistics,
    hasData: Boolean(latest.data),
    loading: latest.isLoading,
    trendLoading: range.isLoading,
    charts: hasGpuMetrics ? [...charts, gpuChart] : charts,
    gpuMetrics: {
      utilization: gpuUtilization,
      memoryUsage: gpuMemoryUsage,
      hasTrend: gpuChart.hasTrend,
      option: gpuChart.option,
    },
  };
}
