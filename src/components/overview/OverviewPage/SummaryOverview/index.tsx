import { IconRight } from "@arco-design/web-react/icon";
import { Skeleton } from "@arco-design/web-react";
import { Link } from "@tanstack/react-router";
import clsx from "clsx";
import { AliIcon } from "@/components/common";
import { useHomeOverview } from "../useHomeOverview";
import { toHomeSummaries, homeSummaryPlaceholders } from "./data-source";
import styles from "../index.module.css";

type HomeRoute =
  | "/overview-compute"
  | "/vms"
  | "/containers"
  | "/gpu-containers"
  | "/sandboxes"
  | "/k8s-clusters"
  | "/volumes"
  | "/vpcs"
  | "/ai-models"
  | "/ai-inference"
  | "/kb"
  | "/registry"
  | "/vector-stores";

type HomeSummaryStatus = {
  label: string;
  value: number | null;
  tone: "success" | "danger" | "neutral";
};

export type HomeSummaryCard = {
  id: string;
  label: string;
  value: number | null;
  icon: string;
  // TODO(feature-visibility): 待知识库管理支持后恢复必填路由及卡片入口。
  // route: HomeRoute;
  route?: HomeRoute;
  statuses: HomeSummaryStatus[];
};

export default function SummaryOverview() {
  const summariesQuery = useHomeOverview();
  const items = summariesQuery.data
    ? toHomeSummaries(summariesQuery.data)
    : homeSummaryPlaceholders;
  const loading = summariesQuery.isLoading;
  return (
    <section
      className={clsx(styles.panel, styles.summaryPanel)}
      aria-label="资源总览"
      aria-busy={loading}
    >
      <div className={styles.summaryGrid}>
        {items.map((item) => {
          const content = (
            <>
              <span className={styles.summaryDecorLarge} aria-hidden="true" />
              <div className={styles.summaryDecorRing} aria-hidden="true">
                {loading ? (
                  <Skeleton
                    loading
                    animation
                    text={false}
                    image={{ shape: "square", style: { width: 16, height: 16, margin: 0 } }}
                  />
                ) : (
                  <AliIcon name={item.icon} size={16} />
                )}
              </div>
              <div className="z-1 flex h-5.5 items-center gap-2">
                <Skeleton
                  loading={loading}
                  animation
                  style={{ width: 96 }}
                  text={{ rows: 1, width: "100%" }}
                >
                  <span className="font-bold leading-5.5 text-(--home-text-secondary)">
                    {item.label}
                  </span>
                </Skeleton>
                {!loading && item.route && (
                  <IconRight className={styles.inlineArrow} aria-hidden="true" />
                )}
              </div>
              <div className="z-1 flex h-8 items-center text-[28px] leading-8 font-semibold!">
                <Skeleton
                  loading={loading}
                  animation
                  className="[&_.arco-skeleton-text-row]:h-7"
                  style={{ width: 64 }}
                  text={{ rows: 1, width: 64, style: { height: 28 } }}
                >
                  {item.value ?? "-"}
                </Skeleton>
              </div>
              {loading ? (
                <div className="z-1 flex h-4 items-center gap-3">
                  {item.statuses.map((status) => (
                    <Skeleton
                      key={status.label}
                      loading
                      animation
                      style={{ width: 56 }}
                      text={{ rows: 1, width: "100%" }}
                    />
                  ))}
                </div>
              ) : (
                <div className="z-1 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                  {item.statuses.map((status) => (
                    <div
                      key={`${item.id}-${status.label}`}
                      className="inline-flex items-center gap-1.5 text-[12px] leading-4 whitespace-nowrap text-(--home-text-secondary)"
                    >
                      <span
                        className={clsx("size-1.5 flex-none rounded-[50%]", {
                          "bg-[#67c23a]": status.tone === "success",
                          "bg-(--home-danger)": status.tone === "danger",
                          "bg-[rgba(0,0,0,0.26)]": status.tone === "neutral",
                        })}
                      />
                      <div className="inline-flex items-center gap-1">
                        {status.label}
                        <b className="font-bold!">{status.value ?? "-"}</b>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          );
          // TODO(feature-visibility): 待知识库管理支持后恢复 route，统一使用原 Link 卡片。
          return item.route ? (
            <Link key={item.id} to={item.route} className={styles.summaryCard}>
              {content}
            </Link>
          ) : (
            <div key={item.id} className={styles.summaryCard}>
              {content}
            </div>
          );
        })}
      </div>
    </section>
  );
}
