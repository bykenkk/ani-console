import { useQuery } from "@tanstack/react-query";
// import { useState } from "react";
import { ApiError } from "@/api/request";
import type {
  ResourceTrendMetric,
  ResourceTrendRange,
  ResourceTrendStatus,
  ResourceTrendUnit,
} from "@/api/observability";
import SummaryOverview from "./SummaryOverview";
// import TasksPanel from "./TasksPanel";
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

export type HomeTimeRange = ResourceTrendRange;

export type HomeResourceTrendMetric = ResourceTrendMetric;

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

export type HomeShortcut = {
  id: string;
  name: string;
  icon: string;
  route: HomeRoute;
};

type HomeTrendSeries = {
  name: string;
  color: string;
  values: Array<number | null>;
};

export type HomeTrendHeadline = {
  label: string;
  value: number | null;
  unit: ResourceTrendUnit;
  color: string;
};

export type HomeTrendSnapshot = {
  labels: string[];
  headlines: HomeTrendHeadline[];
  series: HomeTrendSeries[];
  unit: ResourceTrendUnit;
  status: ResourceTrendStatus;
};

export type HomeTrendConfig = {
  title: string;
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
  getSummaries(signal?: AbortSignal): Promise<HomeSummaryCard[]>;
  getTasks(filter: HomeTaskFilter): Promise<HomeTask[]>;
  getResourceTrend(
    metric: HomeResourceTrendMetric,
    range: HomeTimeRange,
    signal?: AbortSignal,
  ): Promise<HomeTrendSnapshot>;
}

export default function OverviewPage({ dataSource = homeOverviewDataSource }: OverviewPageProps) {
  // const [taskFilter, setTaskFilter] = useState<HomeTaskFilter>("done");
  const summariesQuery = useQuery({
    meta: {
      errorNotification: {
        id: "resource-summaries",
        action: "概览统计加载",
        fallback: "请求失败，请稍后重试",
      },
    },
    queryKey: ["governance-resource-summaries"],
    queryFn: ({ signal }) => dataSource.getSummaries(signal),
    staleTime: 60_000,
    refetchInterval: ({ state }) =>
      state.error instanceof ApiError && [400, 401, 403].includes(state.error.status ?? 0)
        ? false
        : 60_000,
    refetchIntervalInBackground: false,
  });
  // const tasksQuery = useQuery({
  //   meta: {
  //     errorNotification: {
  //       id: "tasks",
  //       action: "任务中心加载",
  //       fallback: "请求失败，请稍后重试",
  //     },
  //   },
  //   queryKey: ["tasks", taskFilter],
  //   queryFn: () => dataSource.getTasks(taskFilter),
  // });
  return (
    <main className={styles.homePage}>
      <div className={styles.twoColumnRow}>
        <SummaryOverview
          items={summariesQuery.data ?? homeSummaryPlaceholders}
          loading={summariesQuery.isLoading}
        />
        <WelcomePanel quickCreateItems={homeQuickCreateItems} />
      </div>

      <div className={styles.twoColumnRow}>
        <TrendCard config={homeTrendConfigs.gpu} dataSource={dataSource} metric="gpu" />
        <TrendCard config={homeTrendConfigs.cpu} dataSource={dataSource} metric="cpu" />
      </div>

      <div className={styles.bottomGrid}>
        <TrendCard config={homeTrendConfigs.memory} dataSource={dataSource} metric="memory" />
        {/* <TasksPanel
          items={tasksQuery.data ?? []}
          filter={taskFilter}
          loading={tasksQuery.isLoading}
          refreshing={tasksQuery.isFetching && !tasksQuery.isLoading}
          onFilterChange={setTaskFilter}
          onRefresh={() => tasksQuery.refetch()}
        /> */}
      </div>
    </main>
  );
}
