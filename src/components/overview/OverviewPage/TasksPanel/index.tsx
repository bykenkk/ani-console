import { Button, Empty, Spin } from "@arco-design/web-react";
import {
  IconCheckCircle,
  IconClockCircle,
  IconCloseCircle,
  IconRefresh,
} from "@arco-design/web-react/icon";
import clsx from "clsx";
import type { HomeTask, HomeTaskFilter } from "..";
import styles from "../index.module.css";

type TasksPanelProps = {
  items: HomeTask[];
  filter: HomeTaskFilter;
  loading: boolean;
  refreshing: boolean;
  onFilterChange: (filter: HomeTaskFilter) => void;
  onRefresh: () => void;
};

export default function TasksPanel({
  items,
  filter,
  loading,
  refreshing,
  onFilterChange,
  onRefresh,
}: TasksPanelProps) {
  return (
    <section className={clsx(styles.panel, styles.taskPanel)}>
      <header className="flex flex-none items-center justify-between">
        <h2 className="m-0! text-[16px]! leading-6 font-bold text-(--home-text)">任务中心</h2>
        <Button
          type="text"
          size="mini"
          icon={<IconRefresh />}
          loading={refreshing}
          onClick={onRefresh}
        >
          刷新
        </Button>
      </header>
      <div
        className="flex flex-[0_0_32px] items-end gap-2 px-4 py-0 [border-bottom:1px_solid_var(--home-border)]"
        role="tablist"
        aria-label="任务状态"
      >
        <button
          type="button"
          role="tab"
          aria-selected={filter === "done"}
          className={clsx(
            "relative flex h-8 cursor-pointer items-center justify-center border-0 bg-transparent px-4 py-0 [font:inherit] text-[12px]! leading-[inherit]! [&:hover]:text-(--home-primary)",
            filter === "done"
              ? "font-bold! text-(--home-primary) after:absolute after:right-3 after:-bottom-px after:left-3 after:h-0.5 after:rounded-[1px] after:bg-(--home-primary) after:content-['']"
              : "text-(--home-text-secondary)",
          )}
          onClick={() => onFilterChange("done")}
        >
          已完成
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={filter === "current"}
          className={clsx(
            "relative flex h-8 cursor-pointer items-center justify-center border-0 bg-transparent px-4 py-0 [font:inherit] text-[12px]! leading-[inherit]! [&:hover]:text-(--home-primary)",
            filter === "current"
              ? "font-bold! text-(--home-primary) after:absolute after:right-3 after:-bottom-px after:left-3 after:h-0.5 after:rounded-[1px] after:bg-(--home-primary) after:content-['']"
              : "text-(--home-text-secondary)",
          )}
          onClick={() => onFilterChange("current")}
        >
          当前任务
        </button>
      </div>

      <div className="mt-2.5 mr-0 mb-0 -ml-2 flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
        {loading ? (
          <div
            className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 p-4 text-(--home-text-secondary)"
            role="status"
          >
            <Spin />
            <span>正在加载任务...</span>
          </div>
        ) : items.length === 0 ? (
          <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 p-4 text-(--home-text-secondary)">
            <Empty description={filter === "current" ? "暂无当前任务" : "暂无已完成任务"} />
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="group/task flex min-h-12 min-w-0 flex-none cursor-pointer items-center gap-2 rounded-sm border-0 bg-transparent px-2 py-1 text-left text-inherit [font:inherit] [&:hover]:bg-(--home-card-bg)"
            >
              <span
                className={clsx(
                  "flex size-10 flex-[0_0_40px] items-center justify-center rounded-lg bg-[#f5f6fa] text-[16px]",
                  {
                    "text-[#67c23a]": item.status === "done",
                    "text-(--home-danger)": item.status === "failed",
                    "text-(--home-primary)": item.status === "current",
                  },
                )}
              >
                {item.status === "done" ? <IconCheckCircle /> : null}
                {item.status === "failed" ? <IconCloseCircle /> : null}
                {item.status === "current" ? <IconClockCircle /> : null}
              </span>
              <span className="flex min-w-0 max-w-52.5 flex-1 flex-col gap-1">
                <span className="truncate leading-5.5 text-(--home-text) group-[:hover]/task:text-(--home-primary)">
                  {item.title}
                </span>
                <span className="truncate text-[12px] leading-4 text-(--home-text-tertiary)">
                  {item.subtitle}
                </span>
              </span>
              {item.status === "current" ? (
                <span
                  className="ml-2 h-1 min-w-20 flex-1 overflow-hidden rounded-[99px] bg-(--home-primary-soft)"
                  aria-label={`进度 ${item.progress ?? 0}%`}
                >
                  <span
                    className="block h-full rounded-[inherit] bg-(--home-primary)"
                    style={{ width: `${item.progress ?? 0}%` }}
                  />
                </span>
              ) : (
                <span className="ml-auto flex-none truncate text-[12px] leading-4 text-(--home-text-tertiary)">
                  {item.time}
                </span>
              )}
            </div>
          ))
        )}
      </div>
    </section>
  );
}
