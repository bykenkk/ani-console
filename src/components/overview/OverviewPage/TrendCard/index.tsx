import { withId } from "@/lib/id";
import { Empty, Spin } from "@arco-design/web-react";
import { useQuery } from "@tanstack/react-query";
import type { EChartsOption, LineSeriesOption } from "echarts";
import clsx from "clsx";
import { useMemo, useState } from "react";
import { CoreLineBarChart } from "@/components/common";
import type {
  HomeOverviewDataSource,
  HomeResourceTrendMetric,
  HomeTimeRange,
  HomeTrendConfig,
  HomeTrendSnapshot,
} from "../types";
import PeriodSwitch from "../PeriodSwitch";
import styles from "../index.module.css";

function areaColor(color: string) {
  return color.toUpperCase() === "#67C23A" ? "rgba(103, 194, 58, 0.12)" : "rgba(0, 121, 211, 0.15)";
}

const emptyTrend: HomeTrendSnapshot = {
  labels: [],
  headlines: [],
  series: [],
};

function percentTooltip(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) ? `${Number(number.toFixed(2))}%` : "-";
}

export default function TrendCard({
  config,
  dataSource,
  metric,
}: {
  config: HomeTrendConfig;
  dataSource: HomeOverviewDataSource;
  metric: HomeResourceTrendMetric;
}) {
  const [range, setRange] = useState<HomeTimeRange>("7d");
  const trendQuery = useQuery({
    meta: {
      errorNotification: {
        id: withId("resource-trend", metric, range),
        action: `${config.title}加载`,
        fallback: "数据服务暂不可用",
      },
    },
    queryKey: ["home-resource-trend", metric, range],
    queryFn: () => dataSource.getResourceTrend(metric, range),
    retry: 1,
    staleTime: 60_000,
  });
  const current = trendQuery.data ?? emptyTrend;
  const hasData = current.series.some((series) => series.values.length > 0);

  const option = useMemo<EChartsOption>(() => {
    const series: LineSeriesOption[] = current.series.map((item) => ({
      name: item.name,
      type: "line",
      data: item.values,
      showSymbol: false,
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
      grid: { left: 40, right: 16, top: 8, bottom: 30 },
      tooltip: {
        trigger: "axis",
        valueFormatter: percentTooltip,
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
        max: config.yMax,
        interval: config.yInterval,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          color: "rgba(0, 0, 0, 0.4)",
          fontSize: 12,
          formatter: "{value}%",
        },
        splitLine: { lineStyle: { color: "rgba(0, 0, 0, 0.08)", width: 0.5 } },
      },
      series,
    };
  }, [config.yInterval, config.yMax, current]);

  return (
    <section className={clsx(styles.panel, styles.trendPanel)}>
      <header className="flex flex-none items-center justify-between">
        <h2 className="m-0! text-[16px]! leading-6 font-bold text-(--home-text)">{config.title}</h2>
        <PeriodSwitch value={range} onChange={setRange} ariaLabel={`${config.title}时间范围`} />
      </header>
      {trendQuery.isLoading ? (
        <div
          className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 p-4 text-(--home-text-secondary)"
          role="status"
        >
          <Spin />
          <span>正在加载趋势数据...</span>
        </div>
      ) : trendQuery.isError ? (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 p-4 text-(--home-text-secondary)" />
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
                <strong className="text-[24px] leading-8 font-semibold!">{headline.value}</strong>
                <span className="-ml-1.5 text-(--home-text-secondary)">{headline.unit}</span>
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
