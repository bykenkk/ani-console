import { useMemo } from "react";
import { Card, Empty, Typography } from "@arco-design/web-react";
import type { EChartsOption } from "echarts";
import type { ModelDevTrainingMetric } from "@/api/modeldev";
import { CoreLineBarChart } from "@/components/common";

type TrainingTaskMetricsProps = { metrics: ModelDevTrainingMetric[] };

export default function TrainingTaskMetrics({ metrics }: TrainingTaskMetricsProps) {
  const charts = useMemo(() => {
    const series = new Map<string, [number, number][]>();
    for (const metric of metrics) {
      const points = series.get(metric.name) ?? [];
      points.push([Number(metric.step), Number(metric.decimal_value)]);
      series.set(metric.name, points);
    }
    return Array.from(series, ([name, points]) => ({
      name,
      option: {
        animation: false,
        tooltip: { trigger: "axis" },
        grid: { left: 65, right: 25, top: 35, bottom: 45 },
        xAxis: {
          type: "value",
          name: "训练步数",
          nameLocation: "middle",
          nameGap: 28,
          minInterval: 1,
        },
        yAxis: { type: "value", scale: true },
        series: [
          {
            name,
            type: "line",
            showSymbol: points.length === 1,
            connectNulls: false,
            // 仅对绘图降采样，保留详情返回的全部指标点。
            sampling: "lttb",
            data: points,
          },
        ],
      } satisfies EChartsOption,
    }));
  }, [metrics]);

  return (
    <div className="flex flex-col gap-4">
      <Typography.Text type="secondary">训练曲线在指标产物发布后显示。</Typography.Text>
      {charts.length === 0 ? (
        <Empty description="暂无已发布的训练指标" />
      ) : (
        charts.map((chart) => (
          <Card key={chart.name} title={chart.name === "train.loss" ? "训练损失" : chart.name}>
            <CoreLineBarChart option={chart.option} style={{ height: 300 }} />
          </Card>
        ))
      )}
    </div>
  );
}
