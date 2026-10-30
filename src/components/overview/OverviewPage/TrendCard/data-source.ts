import { queryResourceTrend } from "@/api/observability";
import { formatTrendTime } from "@/lib/date";
import type { HomeTimeRange } from "..";
import type { HomeResourceTrendMetric, HomeTrendSnapshot } from ".";

const BLUE = "#0079D3";

const resourceTrendMeta: Record<HomeResourceTrendMetric, { name: string }> = {
  gpu: { name: "GPU 显存使用量" },
  cpu: { name: "CPU 使用量" },
  memory: { name: "内存使用量" },
};

export async function getResourceTrend(
  metric: HomeResourceTrendMetric,
  range: HomeTimeRange,
  signal?: AbortSignal,
): Promise<HomeTrendSnapshot> {
  const response = await queryResourceTrend({ metric, range }, signal);
  const trend = response.data.series[0];
  const points = trend.points;
  const latest = points.at(-1);

  return {
    labels: points.map((point) => formatTrendTime(point.timestamp, range !== "1d")),
    unit: trend.unit,
    status: trend.status,
    headlines: [
      {
        label: "当前",
        value: latest?.value ?? null,
        unit: trend.unit,
        color: BLUE,
      },
    ],
    series: [
      {
        name: resourceTrendMeta[metric].name,
        color: BLUE,
        values: points.map((point) => point.value),
      },
    ],
  };
}
