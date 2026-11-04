import type { EChartsOption } from "echarts";
import { formatTime } from "@/lib/date";
import { formatBytes } from "@/lib/format";

type MetricUnit = "cores" | "bytes" | "bytes_per_second" | "percent";

type MetricChartSeries = {
  name: string;
  color: string;
  areaColor: string;
  points: Array<{ timestamp: string; value: number | null }>;
};

const METRIC_UNIT_LABELS: Record<MetricUnit, string> = {
  cores: "核",
  bytes: "字节",
  bytes_per_second: "B/s",
  percent: "%",
};
export function metricValue(value: number | null | undefined, unit?: MetricUnit) {
  if (value == null || unit == null) return "-";
  if (unit === "bytes") return formatBytes(value);
  if (unit === "bytes_per_second") return `${formatBytes(value)}/s`;
  if (unit === "percent") return `${Number(value.toFixed(3))}%`;
  return `${Number(value.toFixed(3))} 核`;
}

export function metricChart(series: MetricChartSeries[], unit: MetricUnit): EChartsOption {
  const timestamps = [
    ...new Set(series.flatMap((item) => item.points.map((point) => point.timestamp))),
  ].sort();
  return {
    tooltip: { trigger: "axis" },
    legend: { show: series.length > 1, top: 0, right: 16 },
    grid: { left: 8, right: 16, top: 32, bottom: 16, containLabel: true },
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
      splitLine: { lineStyle: { type: "dashed" } },
      axisLabel: {
        show: true,
        formatter: (value: number) =>
          unit === "cores" ? String(Number(value.toPrecision(3))) : metricValue(value, unit),
      },
    },
    series: series.map((item) => {
      const points = new Map(item.points.map((point) => [point.timestamp, point.value]));
      return {
        name: item.name,
        type: "line",
        smooth: true,
        lineStyle: { color: item.color },
        itemStyle: { color: item.color },
        areaStyle: {
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: item.areaColor },
              { offset: 1, color: "rgba(0, 0, 0, 0)" },
            ],
          },
        },
        showSymbol: item.points.filter((point) => point.value !== null).length < 2,
        connectNulls: false,
        tooltip: {
          valueFormatter: (value) => metricValue(typeof value === "number" ? value : null, unit),
        },
        data: timestamps.map((timestamp) => points.get(timestamp) ?? null),
      };
    }),
  };
}
