import { Card, Empty, Grid, Statistic, Tooltip } from "@arco-design/web-react";

type InstanceGpuMetricsProps = {
  gpuModel?: string;
  gpuCount?: number;
};

export default function InstanceGpuMetrics({ gpuModel, gpuCount }: InstanceGpuMetricsProps) {
  // TODO(instance-gpu-metrics): GPU 指标尚无等价契约，保留原统计与趋势结构，待补齐并联调后接入。
  const gpuModelSummary = gpuModel ? `${gpuModel}×${gpuCount ?? "-"}` : "-";
  return (
    <Grid.Row gutter={[16, 16]}>
      <Grid.Col span={24}>
        <Card bordered={false} size="small">
          <Grid.Row gutter={16}>
            <Grid.Col span={8}>
              <div className="px-3 py-2">
                <Statistic title="GPU 利用率" value="-" />
              </div>
            </Grid.Col>
            <Grid.Col span={8}>
              <div className="px-3 py-2">
                <Statistic title="显存" value="-" />
              </div>
            </Grid.Col>
            <Grid.Col span={8}>
              <Tooltip content={gpuModelSummary} disabled={!gpuModel}>
                <div className="min-w-0 overflow-hidden px-3 py-2">
                  <Statistic
                    title="型号 × 数量"
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
        <Card bordered={false} title="GPU 利用率趋势" size="small">
          <Empty description="暂无 GPU 利用率趋势数据" />
        </Card>
      </Grid.Col>
    </Grid.Row>
  );
}
