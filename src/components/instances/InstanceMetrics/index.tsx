import { Card, Empty, Grid, Skeleton, Statistic } from "@arco-design/web-react";
import { IconCommon, IconPublic, IconStorage } from "@arco-design/web-react/icon";
import { CoreLineBarChart } from "@/components/common";
import { useInstanceMetrics } from "./useInstanceMetrics";

const STATISTIC_APPEARANCE: Record<string, { label: string; icon: typeof IconCommon }> = {
  "CPU 使用量": { label: "CPU", icon: IconCommon },
  内存使用量: { label: "内存", icon: IconStorage },
  "网络入 / 出速率": { label: "网络入/出速率", icon: IconPublic },
};

type InstanceMetricsProps = {
  instanceId?: string;
};

export default function InstanceMetrics({ instanceId }: InstanceMetricsProps) {
  // TODO(instance-metrics): 沙箱监控契约尚未提供，调用方保留模板空态，待补齐后传入正式实例 ID。
  const metrics = useInstanceMetrics(instanceId);
  const statistics = metrics.statistics;
  return (
    <Grid.Row gutter={[16, 16]}>
      <Grid.Col span={24}>
        <Card bordered={false} size="small" bodyStyle={{ padding: 0 }}>
          {metrics.loading || metrics.hasData ? (
            <div className="flex flex-wrap gap-5">
              {statistics.map((statistic) => {
                const appearance = STATISTIC_APPEARANCE[statistic.title];
                const Icon = appearance?.icon ?? IconCommon;
                return (
                  <Card
                    key={statistic.title}
                    bordered={false}
                    className="min-w-50 flex-1"
                    style={{ background: "var(--color-fill-1)", borderRadius: 8 }}
                    bodyStyle={{ padding: "12px 24px" }}
                  >
                    <Skeleton
                      loading={metrics.loading}
                      animation
                      style={{ minHeight: 56 }}
                      text={{ rows: 2, width: ["30%", "60%"] }}
                    >
                      <Statistic
                        title={
                          <span
                            className="flex items-center gap-2 text-xs leading-4 font-normal"
                            style={{ color: "var(--color-text-2)" }}
                          >
                            <Icon className="text-sm" style={{ color: "rgb(var(--primary-6))" }} />
                            {appearance?.label ?? statistic.title}
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
                          whiteSpace: "normal",
                          overflowWrap: "anywhere",
                        }}
                        renderFormat={() =>
                          statistic.value.split(/(\d+(?:\.\d+)?)/).map((part, index) => (
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
                    </Skeleton>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Empty description="暂无监控指标" />
          )}
        </Card>
      </Grid.Col>
      {metrics.charts.map((chart) => (
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
              loading={metrics.trendLoading}
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
