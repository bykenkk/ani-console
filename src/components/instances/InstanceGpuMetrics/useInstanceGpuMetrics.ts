import { useQuery } from "@tanstack/react-query";
import {
  getContainerGpuMemory,
  queryContainerGpuMemory,
  type GpuMemoryMetricCode,
} from "@/api/gpu";
import {
  getInstanceLatestMetrics,
  queryInstanceMetrics,
  type InstanceMetricCode,
} from "@/api/instances";
import { getPreviousHoursDateTimeRange } from "@/lib/date";
import { withId } from "@/lib/id";
import { metricChart, metricValue } from "@/lib/metrics";

const GPU_METRIC_CODES: InstanceMetricCode[] = ["gpu.utilization_percent"];
const METRIC_RANGE_HOURS = 1;
const METRIC_STEP_SECONDS = 60;
const MEMORY_LABELS: Record<GpuMemoryMetricCode, string> = {
  "gpu.resource.memory_used_bytes": "实际显存",
  "gpu.resource.memory_limit_bytes": "显存限制",
};

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
  const memoryLatest = useQuery({
    queryKey: ["container-gpu-memory-latest", instanceId],
    queryFn: ({ signal }) => getContainerGpuMemory(instanceId, signal),
    meta: {
      errorNotification: {
        id: withId("container-gpu-memory-latest", instanceId),
        action: "GPU 显存加载",
      },
    },
  });
  const memoryRange = useQuery({
    queryKey: ["container-gpu-memory-range", instanceId, "1h"],
    queryFn: ({ signal }) => queryContainerGpuMemory(instanceId, signal),
    meta: {
      errorNotification: {
        id: withId("container-gpu-memory-range", instanceId),
        action: "GPU 显存趋势加载",
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
  const currentMemory = (code: GpuMemoryMetricCode) =>
    memoryLatest.data?.series.find((item) => item.metricCode === code);
  const memoryUsage = currentMemory("gpu.resource.memory_used_bytes");
  const memoryLimit = currentMemory("gpu.resource.memory_limit_bytes");
  const memorySeries = memoryRange.data?.series ?? [];
  const theme = getComputedStyle(document.body);
  const primaryRgb = theme.getPropertyValue("--primary-6").trim() || "22, 93, 255";
  const successRgb = theme.getPropertyValue("--success-6").trim() || "0, 180, 42";
  return {
    utilization: latestValue("gpu.utilization_percent"),
    memoryUsage: metricValue(memoryUsage?.points[0]?.value, "bytes"),
    memoryLimit: metricValue(memoryLimit?.points[0]?.value, "bytes"),
    memoryChart: {
      key: "gpu-memory",
      title: "GPU 显存使用量与限制",
      hasTrend: memorySeries.some((item) => item.points.some((point) => point.value !== null)),
      option: metricChart(
        memorySeries.map((item) => {
          const rgb =
            item.metricCode === "gpu.resource.memory_limit_bytes" ? successRgb : primaryRgb;
          return {
            name: MEMORY_LABELS[item.metricCode],
            points: item.points,
            color: `rgb(${rgb})`,
            areaColor: `rgba(${rgb}, 0.22)`,
          };
        }),
        "bytes",
      ),
    },
    memoryLoading: memoryLatest.isLoading,
    memoryTrendLoading: memoryRange.isLoading,
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
