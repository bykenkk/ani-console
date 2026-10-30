import { Progress, Skeleton } from "@arco-design/web-react";
import { useHomeOverview } from "../useHomeOverview";

// occupied 为含 pending 实例的当前配额占用，不是监控实耗。
const quotaRows = [
  { key: "shared_memory_mib", label: "共享 GPU" },
  { key: "physical_count", label: "独享 GPU" },
] as const;

export default function GpuQuota() {
  const overview = useHomeOverview();
  const quota = overview.data?.gpu_quota;

  return (
    <section
      className="mt-5 flex min-h-0 flex-1 flex-col"
      aria-label="GPU 配额"
      aria-busy={overview.isLoading}
    >
      <header className="flex flex-wrap items-center justify-between gap-2 mb-0">
        <h2 className="m-0! text-[14px]! font-semibold! text-app-text">GPU 配额</h2>
      </header>
      <div className="flex flex-1 flex-col justify-evenly gap-4">
        {quotaRows.map((row) => {
          const item = quota?.[row.key];
          const allocated = item?.configured ? Number(item.limit) : undefined;
          const used = item?.configured ? Number(item.occupied) : undefined;
          const overLimit = item?.configured && item.over_limit;
          const percent =
            allocated !== undefined && used !== undefined
              ? allocated > 0
                ? Math.round((used / allocated) * 1000) / 10
                : used === 0
                  ? 0
                  : undefined
              : undefined;
          const formatAmount = (value: number | undefined) => {
            if (value === undefined) return "-";
            return item?.unit === "MiB"
              ? `${Number((value / 1024).toFixed(2))} GiB`
              : `${value} 张`;
          };

          return (
            <div key={row.key} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-2 text-[13px]">
                <span className="font-medium text-app-text">{row.label}</span>
                <Skeleton loading={overview.isLoading} animation text={{ rows: 1, width: 36 }}>
                  <span
                    className="text-app-text-tertiary"
                    style={{ color: overLimit ? "rgb(var(--danger-6))" : undefined }}
                  >
                    {item && !item.configured
                      ? "未配置"
                      : overLimit
                        ? percent === undefined
                          ? "超额"
                          : `${percent}% · 超额`
                        : percent === undefined
                          ? "-"
                          : `${percent}%`}
                  </span>
                </Skeleton>
              </div>
              {overview.isLoading ? (
                <Skeleton
                  loading
                  animation
                  text={{ rows: 1, width: "100%", style: { height: 8, borderRadius: 4 } }}
                />
              ) : (
                <Progress
                  percent={overLimit ? 100 : Math.min(percent ?? 0, 100)}
                  showText={false}
                  strokeWidth={8}
                  status={overLimit ? "error" : "normal"}
                  color={overLimit ? "rgb(var(--danger-6))" : "rgb(var(--primary-6))"}
                  trailColor="var(--color-fill-2)"
                />
              )}
              <div className="flex flex-wrap justify-between gap-x-3 gap-y-1 text-[12px] text-(--color-text-3)">
                <div className="flex items-center gap-1">
                  已占用
                  <Skeleton loading={overview.isLoading} animation text={{ rows: 1, width: 56 }}>
                    <strong className="font-medium! text-(--color-text-1)">
                      {formatAmount(used)}
                    </strong>
                  </Skeleton>
                </div>
                <div className="flex items-center gap-1">
                  已分配
                  <Skeleton loading={overview.isLoading} animation text={{ rows: 1, width: 56 }}>
                    <strong className="font-medium! text-(--color-text-1)">
                      {item && !item.configured ? "未配置" : formatAmount(allocated)}
                    </strong>
                  </Skeleton>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
