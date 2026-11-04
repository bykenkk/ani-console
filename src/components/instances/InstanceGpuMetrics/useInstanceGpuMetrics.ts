import { useQuery } from "@tanstack/react-query";
import {
  getInstanceLatestMetrics,
  queryInstanceMetrics,
  type InstanceMetricCode,
} from "@/api/instances";
import { getPreviousHoursDateTimeRange } from "@/lib/date";
import { withId } from "@/lib/id";
import { metricChart, metricValue } from "@/lib/metrics";

const GPU_METRIC_CODES: InstanceMetricCode[] = [
  "gpu.utilization_percent",
  "gpu.memory_usage_bytes",
];
const METRIC_RANGE_HOURS = 1;
const METRIC_STEP_SECONDS = 60;

export function useInstanceGpuMetrics(instanceId: string) {
  const latest = useQuery({
    queryKey: ["instance-metrics-latest", instanceId],
    queryFn: ({ signal }) => getInstanceLatestMetrics(instanceId, signal),
    meta: {
      errorNotification: {
        id: withId("instance-metrics-latest", instanceId),
        action: "监控指标加载",
      },
    },
  });
  // 仅在 latest 的指标目录包含 GPU 指标时查询，兼容尚未启用 GPU 监控的版本。
  const supportsGpuMetrics = GPU_METRIC_CODES.every((code) =>
    latest.data?.data.series.some((series) => series.metric_code === code),
  );
  const range = useQuery({
    queryKey: [
      "instance-metrics-range",
      instanceId,
      METRIC_RANGE_HOURS,
      GPU_METRIC_CODES,
      METRIC_STEP_SECONDS,
    ],
    enabled: supportsGpuMetrics,
    queryFn: ({ signal }) =>
      queryInstanceMetrics(
        instanceId,
        {
          ...getPreviousHoursDateTimeRange(METRIC_RANGE_HOURS),
          metric_codes: GPU_METRIC_CODES,
          step_seconds: METRIC_STEP_SECONDS,
        },
        signal,
      ),
    meta: {
      errorNotification: {
        id: withId("instance-gpu-metrics-range", instanceId),
        action: "GPU 指标加载",
      },
    },
  });
  const latestValue = (code: InstanceMetricCode) => {
    const series = latest.data?.data.series.find((item) => item.metric_code === code);
    return metricValue(series?.points[0]?.value, series?.unit);
  };
  const series = (range.data?.data.series ?? []).filter(
    (item) => item.metric_code === "gpu.utilization_percent",
  );
  const primaryRgb =
    getComputedStyle(document.body).getPropertyValue("--primary-6").trim() || "22, 93, 255";
  return {
    utilization: latestValue("gpu.utilization_percent"),
    memoryUsage: latestValue("gpu.memory_usage_bytes"),
    loading: latest.isLoading,
    trendLoading: latest.isLoading || range.isLoading,
    hasTrend: series.some((item) => item.points.some((point) => point.value !== null)),
    option: metricChart(
      series.map((item) => ({
        name: "GPU 利用率",
        points: item.points,
        color: `rgb(${primaryRgb})`,
        areaColor: `rgba(${primaryRgb}, 0.22)`,
      })),
      "percent",
    ),
  };
}
