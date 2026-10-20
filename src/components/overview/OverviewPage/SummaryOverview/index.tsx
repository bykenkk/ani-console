import { IconRight } from "@arco-design/web-react/icon";
import { Link } from "@tanstack/react-router";
import clsx from "clsx";
import { AliIcon } from "@/components/common";
import type { HomeSummaryCard } from "..";
import styles from "../index.module.css";

type SummaryOverviewProps = { items: HomeSummaryCard[] };

export default function SummaryOverview({ items }: SummaryOverviewProps) {
  return (
    <section className={clsx(styles.panel, styles.summaryPanel)} aria-label="资源总览">
      <div className={styles.summaryGrid}>
        {items.map((item) => (
          <Link key={item.id} to={item.route} className={styles.summaryCard}>
            <span className={styles.summaryDecorLarge} aria-hidden="true" />
            <span className={styles.summaryDecorRing} aria-hidden="true">
              <AliIcon name={item.icon} size={16} />
            </span>
            <span className="z-1 flex items-center gap-2">
              <span className="font-bold leading-5.5 text-(--home-text-secondary)">
                {item.label}
              </span>
              <IconRight className={styles.inlineArrow} aria-hidden="true" />
            </span>
            <strong className="z-1 text-[28px] leading-8 font-semibold!">{item.value}</strong>
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
                    {status.label} <b className="font-bold!">{status.value}</b>
                  </span>
                </span>
              ))}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
