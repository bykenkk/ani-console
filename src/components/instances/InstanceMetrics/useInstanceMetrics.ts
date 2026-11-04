import { useQuery } from "@tanstack/react-query";
import {
  getInstanceLatestMetrics,
  queryInstanceMetrics,
  type InstanceMetricCode,
  type InstanceMetricSeries,
} from "@/api/instances";
import { getPreviousHoursDateTimeRange } from "@/lib/date";
import { metricChart, metricValue } from "@/lib/metrics";
import { withId } from "@/lib/id";

const BASE_METRIC_CODES: InstanceMetricCode[] = ["cpu.usage_cores", "memory.working_set_bytes"];
const METRIC_CODES: InstanceMetricCode[] = [
  ...BASE_METRIC_CODES,
  "network.receive_bytes_per_second",
  "network.transmit_bytes_per_second",
];
const METRIC_LABELS: Partial<Record<InstanceMetricCode, string>> = {
  "cpu.usage_cores": "CPU 使用量",
  "memory.working_set_bytes": "内存使用量",
  "network.receive_bytes_per_second": "接收",
  "network.transmit_bytes_per_second": "发送",
};
const METRIC_CHARTS: Array<{
  key: string;
  title: string;
  codes: InstanceMetricCode[];
  unit: InstanceMetricSeries["unit"];
}> = [
  { key: "cpu", title: "CPU 使用量", codes: ["cpu.usage_cores"], unit: "cores" },
  {
    key: "memory",
    title: "内存使用量",
    codes: ["memory.working_set_bytes"],
    unit: "bytes",
  },
  {
    key: "network",
    title: "网络收发速率",
    codes: ["network.receive_bytes_per_second", "network.transmit_bytes_per_second"],
    unit: "bytes_per_second",
  },
];
const METRIC_STEP_SECONDS = 60;
const METRIC_RANGE_HOURS = 1;

export function useInstanceMetrics(instanceId?: string) {
  // 缺失点保留 null，不补零。
  const latest = useQuery({
    queryKey: ["instance-metrics-latest", instanceId],
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
  const metricCodes = hasNetworkMetrics ? METRIC_CODES : BASE_METRIC_CODES;
  const range = useQuery({
    queryKey: [
      "instance-metrics-range",
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
  const statistics = [
    { title: "CPU 使用量", value: latestValue("cpu.usage_cores") },
    { title: "内存使用量", value: latestValue("memory.working_set_bytes") },
    {
      title: "网络入 / 出速率",
      value: `${latestValue("network.receive_bytes_per_second")} / ${latestValue("network.transmit_bytes_per_second")}`,
    },
  ];
  const series = range.data?.data.series ?? [];
  const theme = getComputedStyle(document.body);
  const primaryRgb = theme.getPropertyValue("--primary-6").trim() || "22, 93, 255";
  const successRgb = theme.getPropertyValue("--success-6").trim() || "0, 180, 42";
  const charts = METRIC_CHARTS.map(({ key, title, codes, unit }) => {
    const chartSeries = series.filter((item) => codes.includes(item.metric_code));
    return {
      key,
      title,
      hasTrend: chartSeries.some((item) => item.points.some((point) => point.value !== null)),
      option: metricChart(
        chartSeries.map((item) => {
          const rgb =
            item.metric_code === "network.transmit_bytes_per_second" ? successRgb : primaryRgb;
          return {
            name: METRIC_LABELS[item.metric_code] ?? item.metric_code,
            points: item.points,
            color: `rgb(${rgb})`,
            areaColor: `rgba(${rgb}, 0.22)`,
          };
        }),
        unit,
      ),
    };
  });
  return {
    statistics,
    hasData: Boolean(latest.data),
    loading: latest.isLoading,
    trendLoading: range.isLoading,
    charts,
  };
}
