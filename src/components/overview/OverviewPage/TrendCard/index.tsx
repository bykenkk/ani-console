import { withId } from "@/lib/id";
import { Empty, Skeleton } from "@arco-design/web-react";
import { useQuery } from "@tanstack/react-query";
import type { EChartsOption, LineSeriesOption } from "echarts";
import clsx from "clsx";
import { useMemo, useState } from "react";
import { CoreLineBarChart } from "@/components/common";
import { ApiError } from "@/api/request";
import type {
  ResourceTrendMetric,
  ResourceTrendStatus,
  ResourceTrendUnit,
} from "@/api/observability";
import { formatBytes } from "@/lib/format";
import type { HomeTimeRange } from "..";
import { getResourceTrend } from "./data-source";
import PeriodSwitch from "../PeriodSwitch";
import styles from "../index.module.css";

export type HomeResourceTrendMetric = ResourceTrendMetric;

type HomeTrendSeries = {
  name: string;
  color: string;
  values: Array<number | null>;
};

type HomeTrendHeadline = {
  label: string;
  value: number | null;
  unit: ResourceTrendUnit;
  color: string;
};

export type HomeTrendSnapshot = {
  labels: string[];
  headlines: HomeTrendHeadline[];
  series: HomeTrendSeries[];
  unit: ResourceTrendUnit;
  status: ResourceTrendStatus;
};

type HomeTrendConfig = {
  title: string;
};

type TrendCardProps = {
  metric: HomeResourceTrendMetric;
};

const homeTrendConfigs: Record<HomeResourceTrendMetric, HomeTrendConfig> = {
  gpu: { title: "GPU 显存使用量趋势" },
  cpu: { title: "CPU 使用量趋势" },
  memory: { title: "内存使用量趋势" },
};

function areaColor(color: string) {
  return color.toUpperCase() === "#67C23A" ? "rgba(103, 194, 58, 0.12)" : "rgba(0, 121, 211, 0.15)";
}

const emptyTrend: HomeTrendSnapshot = {
  labels: [],
  headlines: [],
  series: [],
  unit: "cores",
  status: "NO_DATA",
};

function formatResourceTrendValue(value: unknown, unit: ResourceTrendUnit): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return "-";
  return unit === "bytes" ? formatBytes(value) : `${Number(value.toFixed(4))} 核`;
}

export default function TrendCard({ metric }: TrendCardProps) {
  const config = homeTrendConfigs[metric];
  const [range, setRange] = useState<HomeTimeRange>("7d");
  const trendQuery = useQuery({
    meta: {
      errorNotification: {
        id: withId("resource-trend", metric, range),
        action: `${config.title}加载`,
        fallback: "数据服务暂不可用",
      },
    },
    queryKey: ["governance-resource-trend", metric, range],
    queryFn: ({ signal }) => getResourceTrend(metric, range, signal),
    staleTime: 60_000,
    refetchInterval: ({ state }) =>
      state.error instanceof ApiError && [400, 401, 403].includes(state.error.status ?? 0)
        ? false
        : 60_000,
    refetchIntervalInBackground: false,
  });
  const current = trendQuery.data ?? emptyTrend;
  const hasData =
    current.status !== "NO_DATA" &&
    current.series.some((series) => series.values.some((value) => value !== null));

  const option = useMemo<EChartsOption>(() => {
    const series: LineSeriesOption[] = current.series.map((item) => ({
      name: item.name,
      type: "line",
      data: item.values,
      showSymbol: item.values.some(
        (value, index, values) =>
          value !== null && values[index - 1] == null && values[index + 1] == null,
      ),
      connectNulls: false,
      symbol: "circle",
      symbolSize: 7,
      lineStyle: { color: item.color, width: 1.5 },
      itemStyle: { color: item.color, borderColor: "#fff", borderWidth: 2 },
      areaStyle: {
        color: {
          type: "linear",
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: areaColor(item.color) },
            { offset: 1, color: "rgba(255, 255, 255, 0)" },
          ],
        },
      },
      emphasis: { focus: "series" },
    }));

    return {
      animation: false,
      grid: { left: 8, right: 16, top: 8, bottom: 12, containLabel: true },
      tooltip: {
        trigger: "axis",
        valueFormatter: (value) => formatResourceTrendValue(value, current.unit),
        backgroundColor: "rgba(255, 255, 255, 0.94)",
        borderColor: "#fff",
        borderWidth: 2,
        padding: [8, 12],
        textStyle: { color: "rgba(0, 0, 0, 0.9)", fontSize: 12 },
      },
      xAxis: {
        type: "category",
        boundaryGap: false,
        data: current.labels,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: "rgba(0, 0, 0, 0.4)", fontSize: 12, margin: 10 },
      },
      yAxis: {
        type: "value",
        min: 0,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          color: "rgba(0, 0, 0, 0.4)",
          fontSize: 12,
          formatter: (value: number) => formatResourceTrendValue(value, current.unit),
        },
        splitLine: { lineStyle: { color: "rgba(0, 0, 0, 0.08)", width: 0.5 } },
      },
      series,
    };
  }, [current]);

  return (
    <section className={clsx(styles.panel, styles.trendPanel)} aria-busy={trendQuery.isLoading}>
      <header className="flex flex-none items-center justify-between">
        <h2 className="m-0! text-[16px]! leading-6 font-bold text-(--home-text)">{config.title}</h2>
        <PeriodSwitch value={range} onChange={setRange} ariaLabel={`${config.title}时间范围`} />
      </header>
      {trendQuery.isLoading ? (
        <div className="flex min-h-0 flex-1 flex-col" role="status" aria-label="正在加载趋势数据">
          <div className="flex flex-[0_0_42px] items-center gap-2 px-4">
            <span className="size-2 flex-none rounded-[50%] bg-(--home-primary)" />
            <span className="text-(--home-text-secondary)">当前</span>
            <Skeleton loading animation text={{ rows: 1, width: 112, style: { height: 28 } }} />
          </div>
          <div className="min-h-0 flex-1 px-4 py-3">
            <Skeleton
              loading
              animation
              className="h-full"
              text={{
                rows: 5,
                width: ["100%", "92%", "96%", "88%", "100%"],
                style: {
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                },
              }}
            />
          </div>
        </div>
      ) : !hasData ? (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 p-4 text-(--home-text-secondary)">
          <Empty description="暂无数据" />
        </div>
      ) : (
        <>
          <div className="flex flex-[0_0_42px] items-center gap-7 px-4 py-0">
            {current.headlines.map((headline) => (
              <div key={headline.label} className="flex items-baseline gap-2 whitespace-nowrap">
                <span
                  className="size-2 flex-none self-center rounded-[50%]"
                  style={{ background: headline.color }}
                />
                <span className="text-(--home-text-secondary)">{headline.label}</span>
                <strong className="text-[24px] leading-8 font-semibold!">
                  {formatResourceTrendValue(headline.value, headline.unit)}
                </strong>
              </div>
            ))}
          </div>
          <div className="min-h-0 flex-1">
            <CoreLineBarChart option={option} style={{ width: "100%", height: "100%" }} />
          </div>
        </>
      )}
    </section>
  );
}
