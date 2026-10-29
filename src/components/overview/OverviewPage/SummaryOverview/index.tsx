import { IconRight } from "@arco-design/web-react/icon";
import { Spin } from "@arco-design/web-react";
import { Link } from "@tanstack/react-router";
import clsx from "clsx";
import { AliIcon } from "@/components/common";
import type { HomeSummaryCard } from "..";
import styles from "../index.module.css";

type SummaryOverviewProps = { items: HomeSummaryCard[]; loading: boolean };

export default function SummaryOverview({ items, loading }: SummaryOverviewProps) {
  return (
    <section
      className={clsx(styles.panel, styles.summaryPanel)}
      aria-label="资源总览"
      aria-busy={loading}
    >
      {loading ? (
        <div className="flex h-full items-center justify-center" role="status">
          <Spin tip="正在加载资源统计..." />
        </div>
      ) : (
        <div className={styles.summaryGrid}>
          {items.map((item) => {
            const content = (
              <>
                <span className={styles.summaryDecorLarge} aria-hidden="true" />
                <span className={styles.summaryDecorRing} aria-hidden="true">
                  <AliIcon name={item.icon} size={16} />
                </span>
                <span className="z-1 flex items-center gap-2">
                  <span className="font-bold leading-5.5 text-(--home-text-secondary)">
                    {item.label}
                  </span>
                  {item.route && <IconRight className={styles.inlineArrow} aria-hidden="true" />}
                </span>
                <strong className="z-1 text-[28px] leading-8 font-semibold!">
                  {item.value ?? "-"}
                </strong>
                <span className="z-1 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                  {item.statuses.map((status) => (
                    <span
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
                      <span>
                        {status.label} <b className="font-bold!">{status.value ?? "-"}</b>
                      </span>
                    </span>
                  ))}
                </span>
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
      )}
    </section>
  );
}
