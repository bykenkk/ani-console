import { useQuery } from "@tanstack/react-query";
import type { EChartsOption } from "echarts";
import {
  getContainerGpuMemory,
  queryContainerGpuMemory,
  type GpuMemoryMetricCode,
  type GpuMemorySeries,
} from "@/api/gpu";
import { formatTime } from "@/lib/date";
import { formatBytes } from "@/lib/format";
import { withId } from "@/lib/id";

const MEMORY_LABELS: Record<GpuMemoryMetricCode, string> = {
  "gpu.resource.memory_used_bytes": "实际显存",
  "gpu.resource.memory_limit_bytes": "显存限制",
};

function memoryChart(series: GpuMemorySeries[]): EChartsOption {
  const timestamps = [
    ...new Set(series.flatMap((item) => item.points.map((point) => point.timestamp))),
  ].sort();
  return {
    tooltip: {
      trigger: "axis",
      valueFormatter: (value) => (typeof value === "number" ? formatBytes(value) : "-"),
    },
    legend: { bottom: 0 },
    grid: { left: 8, right: 16, top: 32, bottom: 40, containLabel: true },
    xAxis: { type: "category", boundaryGap: false, data: timestamps.map(formatTime) },
    yAxis: { type: "value", min: 0, axisLabel: { formatter: formatBytes } },
    series: series.map((item) => {
      const points = new Map(item.points.map((point) => [point.timestamp, point.value]));
      return {
        name: MEMORY_LABELS[item.metricCode],
        type: "line",
        connectNulls: false,
        showSymbol: item.points.filter((point) => point.value !== null).length < 2,
        data: timestamps.map((timestamp) => points.get(timestamp) ?? null),
      };
    }),
  };
}

export function useInstanceGpuMemory(instanceId?: string, enabled = false) {
  const latest = useQuery({
    queryKey: ["container-gpu-memory-latest", instanceId],
    enabled: enabled && Boolean(instanceId),
    queryFn: ({ signal }) => getContainerGpuMemory(instanceId!, signal),
    meta: {
      errorNotification: {
        id: withId("container-gpu-memory-latest", instanceId),
        action: "GPU 显存加载",
      },
    },
  });
  const range = useQuery({
    queryKey: ["container-gpu-memory-range", instanceId, "1h"],
    enabled: enabled && Boolean(instanceId),
    queryFn: ({ signal }) => queryContainerGpuMemory(instanceId!, signal),
    meta: {
      errorNotification: {
        id: withId("container-gpu-memory-range", instanceId),
        action: "GPU 显存趋势加载",
      },
    },
  });
  const current = (code: GpuMemoryMetricCode) =>
    latest.data?.series.find((item) => item.metricCode === code);
  const usage = current("gpu.resource.memory_used_bytes");
  const limit = current("gpu.resource.memory_limit_bytes");
  const series = range.data?.series ?? [];
  return {
    usage: formatBytes(usage?.points[0]?.value ?? undefined),
    limit: formatBytes(limit?.points[0]?.value ?? undefined),
    status: usage?.quality.status ?? "NO_DATA",
    rangeStatus:
      series.find((item) => item.metricCode === "gpu.resource.memory_used_bytes")?.quality.status ??
      "NO_DATA",
    loading: latest.isLoading,
    trendLoading: range.isLoading,
    chart: {
      key: "gpu-memory",
      title: "GPU 显存使用量与限制",
      hasTrend: series.some((item) => item.points.some((point) => point.value !== null)),
      option: memoryChart(series),
    },
  };
}
