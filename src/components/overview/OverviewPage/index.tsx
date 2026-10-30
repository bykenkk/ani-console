import type { ResourceTrendRange } from "@/api/observability";
// import { useQuery } from "@tanstack/react-query";
// import { useState } from "react";
import SummaryOverview from "./SummaryOverview";
// import TasksPanel from "./TasksPanel";
import TrendCard from "./TrendCard";
import WelcomePanel from "./WelcomePanel";
// import { homeOverviewDataSource } from "./data-source";

import styles from "./index.module.css";

export type HomeTimeRange = ResourceTrendRange;

type HomeTaskStatus = "done" | "failed" | "current";

export type HomeTaskFilter = "done" | "current";

export type HomeTask = {
  id: string;
  title: string;
  subtitle: string;
  time?: string;
  status: HomeTaskStatus;
  progress?: number;
};

export default function OverviewPage() {
  // const [taskFilter, setTaskFilter] = useState<HomeTaskFilter>("done");
  // const tasksQuery = useQuery({
  //   meta: {
  //     errorNotification: {
  //       id: "tasks",
  //       action: "任务中心加载",
  //       fallback: "请求失败，请稍后重试",
  //     },
  //   },
  //   queryKey: ["tasks", taskFilter],
  //   queryFn: () => homeOverviewDataSource.getTasks(taskFilter),
  // });
  return (
    <main className={styles.homePage}>
      <div className={styles.twoColumnRow}>
        <SummaryOverview />
        <WelcomePanel />
      </div>

      <div className="grid auto-rows-[320px] grid-cols-1 gap-4 md:grid-cols-3">
        <TrendCard metric="gpu" />
        <TrendCard metric="cpu" />
        <TrendCard metric="memory" />
      </div>
      {/* <TasksPanel
          items={tasksQuery.data ?? []}
          filter={taskFilter}
          loading={tasksQuery.isLoading}
          refreshing={tasksQuery.isFetching && !tasksQuery.isLoading}
          onFilterChange={setTaskFilter}
          onRefresh={() => tasksQuery.refetch()}
        /> */}
    </main>
  );
}
