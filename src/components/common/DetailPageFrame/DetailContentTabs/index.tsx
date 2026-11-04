import { Tabs } from "@arco-design/web-react";
import clsx from "clsx";
import styles from "./index.module.css";
import type { DetailTab } from "..";

type DetailContentTabsProps<TKey extends string> = {
  tabs: DetailTab<TKey>[];
  activeTabKey: TKey;
  onTabChange?: (key: TKey) => void;
};

export default function DetailContentTabs<TKey extends string>({
  tabs,
  activeTabKey,
  onTabChange,
}: DetailContentTabsProps<TKey>) {
  const activeTab = tabs.find((tab) => tab.key === activeTabKey);

  return (
    <section className={styles.rightPane}>
      <Tabs
        className={clsx(styles.tabs, activeTab?.fill && styles.fill)}
        type="line"
        headerPadding={false}
        inkBarSize={{ width: 16 }}
        activeTab={activeTabKey}
        onChange={(key) => {
          const nextTab = tabs.find((tab) => tab.key === key);
          if (nextTab) onTabChange?.(nextTab.key);
        }}
        extra={activeTab?.extra}
        overflow="scroll"
        scrollPosition="auto"
        destroyOnHide
        justify
      >
        {tabs.map((tab) => (
          <Tabs.TabPane key={tab.key} title={tab.label}>
            {tab.content}
          </Tabs.TabPane>
        ))}
      </Tabs>
    </section>
  );
}
