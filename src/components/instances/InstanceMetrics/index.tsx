import { Card, Empty, Grid, Statistic } from "@arco-design/web-react";
import { CoreLineBarChart } from "@/components/common";
import InstanceGpuMetrics from "./InstanceGpuMetrics";
import { useInstanceMetrics } from "./useInstanceMetrics";

type InstanceMetricsProps = {
  instanceId?: string;
  instanceType: "vm" | "container" | "gpu_container";
  gpuOnly?: boolean;
  gpuModel?: string;
  gpuCount?: number;
};

export default function InstanceMetrics({
  instanceId,
  instanceType,
  gpuOnly = false,
  gpuModel,
  gpuCount,
}: InstanceMetricsProps) {
  // TODO(instance-metrics): 沙箱监控契约尚未提供，调用方保留模板空态，待补齐后传入正式实例 ID。
  const metrics = useInstanceMetrics(instanceId, instanceType === "gpu_container");
  const statistics = metrics.statistics;
  if (gpuOnly && instanceType === "gpu_container") {
    return (
      <InstanceGpuMetrics
        gpuModel={gpuModel}
        gpuCount={gpuCount}
        metrics={metrics.gpuMetrics}
        loading={metrics.loading}
        trendLoading={metrics.trendLoading}
      />
    );
  }
  return (
    <Grid.Row gutter={[16, 16]}>
      <Grid.Col span={24}>
        <Card bordered={false} size="small" loading={metrics.loading}>
          {metrics.hasData ? (
            <Grid.Row gutter={[16, 16]}>
              {statistics.map((statistic) => (
                <Grid.Col key={statistic.title} flex={1}>
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
