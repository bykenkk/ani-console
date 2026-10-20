import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import SummaryOverview from "./SummaryOverview";
import TasksPanel from "./TasksPanel";
import TrendCard from "./TrendCard";
import WelcomePanel from "./WelcomePanel";
import {
  homeOverviewDataSource,
  homeQuickCreateItems,
  homeSummaryPlaceholders,
  homeTrendConfigs,
} from "./data-source";

import styles from "./index.module.css";

type OverviewPageProps = {
  dataSource?: HomeOverviewDataSource;
};

export type HomeTimeRange = "1d" | "7d" | "30d";

export type HomeResourceTrendMetric = "gpu" | "cpu" | "memory";

type HomeTaskStatus = "done" | "failed" | "current";

export type HomeTaskFilter = "done" | "current";

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
  value: number;
  tone: "success" | "danger" | "neutral";
};

export type HomeSummaryCard = {
  id: string;
  label: string;
  value: number;
  icon: string;
  route: HomeRoute;
  statuses: HomeSummaryStatus[];
};

export type HomeShortcut = {
  id: string;
  name: string;
  icon: string;
  route: HomeRoute;
};

type HomeTrendSeries = {
  name: string;
  color: string;
  values: number[];
};

export type HomeTrendHeadline = {
  label: string;
  value: number;
  unit: string;
  color: string;
};

export type HomeTrendSnapshot = {
  labels: string[];
  headlines: HomeTrendHeadline[];
  series: HomeTrendSeries[];
};

export type HomeTrendConfig = {
  title: string;
  yMax: number;
  yInterval: number;
};

export type HomeTask = {
  id: string;
  title: string;
  subtitle: string;
  time?: string;
  status: HomeTaskStatus;
  progress?: number;
};

export interface HomeOverviewDataSource {
  getSummaries(): Promise<HomeSummaryCard[]>;
  getTasks(filter: HomeTaskFilter): Promise<HomeTask[]>;
  getResourceTrend(
    metric: HomeResourceTrendMetric,
    range: HomeTimeRange,
  ): Promise<HomeTrendSnapshot>;
}

export default function OverviewPage({ dataSource = homeOverviewDataSource }: OverviewPageProps) {
  const [taskFilter, setTaskFilter] = useState<HomeTaskFilter>("done");
  const summariesQuery = useQuery({
    meta: {
      errorNotification: {
        id: "resource-summaries",
        action: "概览统计加载",
        fallback: "请求失败，请稍后重试",
      },
    },
    queryKey: ["resource-summaries"],
    queryFn: () => dataSource.getSummaries(),
  });
  const tasksQuery = useQuery({
    meta: {
      errorNotification: {
        id: "tasks",
        action: "任务中心加载",
        fallback: "请求失败，请稍后重试",
      },
    },
    queryKey: ["tasks", taskFilter],
    queryFn: () => dataSource.getTasks(taskFilter),
  });
  return (
    <main className={styles.homePage}>
      <div className={styles.twoColumnRow}>
        <SummaryOverview items={summariesQuery.data ?? homeSummaryPlaceholders} />
        <WelcomePanel quickCreateItems={homeQuickCreateItems} />
      </div>

      <div className={styles.twoColumnRow}>
        <TrendCard config={homeTrendConfigs.gpu} dataSource={dataSource} metric="gpu" />
        <TrendCard config={homeTrendConfigs.cpu} dataSource={dataSource} metric="cpu" />
      </div>

      <div className={styles.bottomGrid}>
        <TrendCard config={homeTrendConfigs.memory} dataSource={dataSource} metric="memory" />
        <TasksPanel
          items={tasksQuery.data ?? []}
          filter={taskFilter}
          loading={tasksQuery.isLoading}
          refreshing={tasksQuery.isFetching && !tasksQuery.isLoading}
          onFilterChange={setTaskFilter}
          onRefresh={() => tasksQuery.refetch()}
        />
      </div>
    </main>
  );
}
