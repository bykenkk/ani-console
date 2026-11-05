import { Card, Empty, Grid, Skeleton, Statistic, Tooltip } from "@arco-design/web-react";
import { IconCommon, IconStorage } from "@arco-design/web-react/icon";
import { CoreLineBarChart } from "@/components/common";
import { useInstanceGpuMetrics } from "./useInstanceGpuMetrics";

type InstanceGpuMetricsProps = {
  instanceId: string;
  gpuModel?: string;
  gpuCount?: number;
};

export default function InstanceGpuMetrics({
  instanceId,
  gpuModel,
  gpuCount,
}: InstanceGpuMetricsProps) {
  const metrics = useInstanceGpuMetrics(instanceId);
  const { loading, trendLoading } = metrics;
  const gpuModelSummary = gpuModel ? `${gpuModel} × ${gpuCount ?? "-"}` : "-";
  const statistics = [
    {
      key: "utilization",
      title: "GPU 利用率",
      value: metrics.utilization,
      icon: IconCommon,
      loading,
    },
    {
      key: "memory",
      title: "显存使用量 / 限制",
      value: `${metrics.memoryUsage} / ${metrics.memoryLimit}`,
      icon: IconStorage,
      loading: metrics.memoryLoading,
    },
    {
      key: "configuration",
      title: "GPU 配置",
      value: gpuModelSummary,
      icon: IconCommon,
      loading: false,
    },
  ];
  const charts = [
    {
      ...metrics.memoryChart,
      loading: metrics.memoryTrendLoading,
    },
    {
      key: "gpu-utilization",
      title: "GPU 利用率",
      hasTrend: metrics.hasTrend,
      option: metrics.option,
      loading: trendLoading,
    },
  ];
  return (
    <Grid.Row gutter={[16, 16]}>
      <Grid.Col span={24}>
        <Card bordered={false} size="small" bodyStyle={{ padding: 0 }}>
          <div className="flex flex-wrap gap-5">
            {statistics.map((statistic) => {
              const Icon = statistic.icon;
              const isConfiguration = statistic.key === "configuration";
              return (
                <Card
                  key={statistic.key}
                  bordered={false}
                  className="min-w-50 flex-1"
                  style={{ background: "var(--color-fill-1)", borderRadius: 8 }}
                  bodyStyle={{ padding: "12px 24px" }}
                >
                  <Skeleton
                    loading={statistic.loading}
                    animation
                    style={{ minHeight: 56 }}
                    text={{ rows: 2, width: ["30%", "60%"] }}
                  >
                    <Tooltip content={statistic.value} disabled={!isConfiguration || !gpuModel}>
                      <div className="min-w-0">
                        <Statistic
                          title={
                            <span
                              className="flex items-center gap-2 text-xs leading-4 font-normal"
                              style={{ color: "var(--color-text-2)" }}
                            >
                              <Icon
                                className="text-sm"
                                style={{ color: "rgb(var(--primary-6))" }}
                              />
                              {statistic.title}
                            </span>
                          }
                          value={statistic.value}
                          className="w-full"
                          styleValue={{
                            marginLeft: 22,
                            fontSize: 22,
                            lineHeight: "32px",
                            fontWeight: 500,
                            color: "var(--color-text-1)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: isConfiguration ? "nowrap" : "normal",
                            overflowWrap: "anywhere",
                          }}
                          renderFormat={() =>
                            isConfiguration
                              ? statistic.value
                              : statistic.value.split(/(\d+(?:\.\d+)?)/).map((part, index) => (
                                  <span
                                    key={index}
                                    style={
                                      index % 2 === 0
                                        ? {
                                            fontSize: 14,
                                            lineHeight: "24px",
                                            fontWeight: 400,
                                            color: "var(--color-text-2)",
                                          }
                                        : undefined
                                    }
                                  >
                                    {part}
                                  </span>
                                ))
                          }
                        />
                      </div>
                    </Tooltip>
                  </Skeleton>
                </Card>
              );
            })}
          </div>
        </Card>
      </Grid.Col>
      {charts.map((chart) => (
        <Grid.Col key={chart.key} span={24}>
          <Card
            bordered={false}
            title={
              <span className="flex items-center gap-2 text-sm leading-5 font-semibold">
                <span
                  aria-hidden="true"
                  className="h-3 w-1 shrink-0"
                  style={{ background: "rgb(var(--primary-6))" }}
                />
                {chart.title}
              </span>
            }
            size="small"
            headerStyle={{ borderBottom: "none", padding: "0 0 8px", height: "auto" }}
            bodyStyle={{ padding: 0 }}
          >
            <Skeleton
              loading={chart.loading}
              animation
              style={{ display: "block", height: 160 }}
              text={false}
              image={{ style: { width: "100%", height: 160, marginRight: 0 } }}
            >
              {chart.hasTrend ? (
                <CoreLineBarChart option={chart.option} style={{ height: 160 }} />
              ) : (
                <div className="flex h-40 items-center justify-center">
                  <Empty description={`暂无${chart.title}数据`} />
                </div>
              )}
            </Skeleton>
          </Card>
        </Grid.Col>
      ))}
    </Grid.Row>
  );
}
