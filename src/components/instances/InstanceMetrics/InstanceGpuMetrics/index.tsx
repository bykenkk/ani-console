import { Card, Empty, Grid, Statistic, Tag, Tooltip } from "@arco-design/web-react";
import type { EChartsOption } from "echarts";
import { CoreLineBarChart } from "@/components/common";

type InstanceGpuMetricsProps = {
  gpuModel?: string;
  gpuCount?: number;
  metrics: {
    utilization: string;
    memoryUsage: string;
    memoryLimit: string;
    memoryStatus: string;
    memoryRangeStatus: string;
    memoryChart: { title: string; hasTrend: boolean; option: EChartsOption };
    hasTrend: boolean;
    option: EChartsOption;
  };
  loading: boolean;
  trendLoading: boolean;
};

export default function InstanceGpuMetrics({
  gpuModel,
  gpuCount,
  metrics,
  loading,
  trendLoading,
}: InstanceGpuMetricsProps) {
  const gpuModelSummary = gpuModel ? `${gpuModel} × ${gpuCount ?? "-"}` : "-";
  const qualityLabels: Record<string, string> = {
    OK: "完整",
    PARTIAL: "部分数据",
    NO_DATA: "无数据",
  };
  return (
    <Grid.Row gutter={[16, 16]}>
      <Grid.Col span={24}>
        <Card bordered={false} size="small" loading={loading}>
          <Grid.Row gutter={16}>
            <Grid.Col span={8}>
              <div className="px-3 py-2">
                <Statistic title="GPU 利用率" value={metrics.utilization} />
              </div>
            </Grid.Col>
            <Grid.Col span={8}>
              <div className="px-3 py-2">
                <Statistic
                  title="显存使用量 / 限制"
                  value={`${metrics.memoryUsage} / ${metrics.memoryLimit}`}
                  styleValue={{ overflowWrap: "anywhere", whiteSpace: "normal" }}
                />
                <Tag>{qualityLabels[metrics.memoryStatus] ?? "未知"}</Tag>
              </div>
            </Grid.Col>
            <Grid.Col span={8}>
              <Tooltip content={gpuModelSummary} disabled={!gpuModel}>
                <div className="min-w-0 overflow-hidden px-3 py-2">
                  <Statistic
                    title="GPU 配置"
                    className="w-full"
                    value={gpuModelSummary}
                    styleValue={{
                      display: "block",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  />
                </div>
              </Tooltip>
            </Grid.Col>
          </Grid.Row>
        </Card>
      </Grid.Col>
      <Grid.Col span={24}>
        <Card
          bordered={false}
          title={metrics.memoryChart.title}
          size="small"
          loading={trendLoading}
        >
          <Tag>{qualityLabels[metrics.memoryRangeStatus] ?? "未知"}</Tag>
          {metrics.memoryChart.hasTrend ? (
            <CoreLineBarChart option={metrics.memoryChart.option} style={{ height: 280 }} />
          ) : (
            <Empty description="暂无 GPU 显存趋势数据" />
          )}
        </Card>
      </Grid.Col>
      <Grid.Col span={24}>
        <Card bordered={false} title="GPU 利用率趋势" size="small" loading={trendLoading}>
          {metrics.hasTrend ? (
            <CoreLineBarChart option={metrics.option} style={{ height: 280 }} />
          ) : (
            <Empty description="暂无 GPU 利用率趋势数据" />
          )}
        </Card>
      </Grid.Col>
    </Grid.Row>
  );
}
