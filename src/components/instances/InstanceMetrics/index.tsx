import { Card, Empty, Grid, Statistic } from "@arco-design/web-react";
import type { ComputeType } from "@/api/instances";
import { CoreLineBarChart } from "@/components/common";
import InstanceGpuMetrics from "./InstanceGpuMetrics";
import { useGovernanceMetrics } from "./useGovernanceMetrics";

type InstanceMetricsProps = {
  instanceId?: string;
  computeType?: ComputeType;
  gpuOnly?: boolean;
  gpuModel?: string;
  gpuCount?: number;
};

export default function InstanceMetrics({
  instanceId,
  computeType,
  gpuOnly = false,
  gpuModel,
  gpuCount,
}: InstanceMetricsProps) {
  // TODO(instance-metrics): 云主机、沙箱的新监控契约尚未提供；调用方保留模板空态，待接口补齐后传入正式实例 ID。
  const metrics = useGovernanceMetrics(gpuOnly ? undefined : instanceId, computeType === "gpu");
  const statistics = metrics.statistics;
  if (gpuOnly && computeType === "gpu") {
    return <InstanceGpuMetrics gpuModel={gpuModel} gpuCount={gpuCount} />;
  }
  return (
    <Grid.Row gutter={[16, 16]}>
      <Grid.Col span={24}>
        <Card bordered={false} size="small" loading={metrics.loading}>
          {metrics.hasData ? (
            <Grid.Row gutter={[16, 16]}>
              {statistics.map((statistic) => (
                <Grid.Col key={statistic.title} span={24 / statistics.length}>
                  <div className="px-3 py-2">
                    <Statistic
                      title={statistic.title}
                      value={statistic.value}
                      className="w-full"
                      styleValue={{ whiteSpace: "normal", overflowWrap: "anywhere" }}
                    />
                  </div>
                </Grid.Col>
              ))}
            </Grid.Row>
          ) : (
            <Empty description="暂无监控指标" />
          )}
        </Card>
      </Grid.Col>
      {metrics.charts.map((chart) => (
        <Grid.Col key={chart.key} span={24}>
          <Card bordered={false} title={chart.title} size="small" loading={metrics.trendLoading}>
            {chart.hasTrend ? (
              <CoreLineBarChart option={chart.option} style={{ height: 280 }} />
            ) : (
              <Empty description={`暂无${chart.title}数据`} />
            )}
          </Card>
        </Grid.Col>
      ))}
    </Grid.Row>
  );
}
