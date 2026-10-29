import { queryResourceTrend } from "@/api/observability";
import { getConsoleOverview, type ConsoleOverviewStatistics } from "@/api/overview";
import { getTask, listTasks, type AsyncTask, type AsyncTaskStatus } from "@/api/tasks";
import { formatDateTime, formatTrendTime } from "@/lib/date";
import type {
  HomeOverviewDataSource,
  HomeResourceTrendMetric,
  HomeShortcut,
  HomeSummaryCard,
  HomeTask,
  HomeTaskFilter,
  HomeTimeRange,
  HomeTrendConfig,
  HomeTrendSnapshot,
} from ".";

const BLUE = "#0079D3";
const HOME_TASK_LIMIT = 10;

const taskStatusByFilter: Record<HomeTaskFilter, AsyncTaskStatus> = {
  done: "completed",
  current: "running",
};

const taskStatusLabels: Record<AsyncTask["status"], string> = {
  pending: "等待中",
  running: "进行中",
  completed: "已完成",
  failed: "失败",
  cancelled: "已取消",
  dead_letter: "处理失败",
};

export const homeSummaryPlaceholders: HomeSummaryCard[] = [
  {
    id: "instances",
    label: "实例总数",
    value: null,
    icon: "yunzhuji",
    route: "/vms",
    statuses: [
      { label: "运行中", value: null, tone: "success" },
      { label: "异常", value: null, tone: "danger" },
      { label: "其他", value: null, tone: "neutral" },
    ],
  },
  {
    id: "inference-services",
    label: "推理服务",
    value: null,
    icon: "tuili",
    route: "/ai-inference",
    statuses: [
      { label: "运行中", value: null, tone: "success" },
      { label: "异常", value: null, tone: "danger" },
      { label: "其他", value: null, tone: "neutral" },
    ],
  },
  {
    id: "models",
    label: "模型仓库",
    value: null,
    icon: "moxing",
    route: "/ai-models",
    statuses: [
      { label: "可用", value: null, tone: "success" },
      { label: "失败", value: null, tone: "danger" },
      { label: "其他", value: null, tone: "neutral" },
    ],
  },
  {
    id: "knowledge-bases",
    label: "知识库",
    value: null,
    icon: "zhishiku",
    // TODO(feature-visibility): 待知识库管理支持后恢复卡片跳转，暂保留统计展示。
    // route: "/kb",
    statuses: [
      { label: "活跃", value: null, tone: "success" },
      { label: "其他", value: null, tone: "neutral" },
    ],
  },
];

export const homeQuickCreateItems: HomeShortcut[] = [
  { id: "create-vm", name: "创建云主机", icon: "yunzhuji", route: "/vms" },
  {
    id: "create-container",
    name: "创建容器",
    icon: "rongqishili",
    route: "/containers",
  },
  {
    id: "create-gpu",
    name: "创建 GPU 容器",
    icon: "GPUrongqishili",
    route: "/gpu-containers",
  },
  {
    id: "create-sandbox",
    name: "创建沙箱",
    icon: "Sandbox",
    route: "/sandboxes",
  },
  // {
  //   id: "create-k8s",
  //   name: "创建 K8s 集群",
  //   icon: "jiqun",
  //   route: "/k8s-clusters",
  // },
];

export const homeTrendConfigs: Record<HomeResourceTrendMetric, HomeTrendConfig> = {
  gpu: { title: "GPU 显存使用量趋势" },
  cpu: { title: "CPU 使用量趋势" },
  memory: { title: "内存使用量趋势" },
};

const taskDomainLabels: Record<string, string> = {
  instance: "实例",
  platform_workload: "工作负载",
  volume: "云盘",
  vector_store: "向量存储",
  kb: "知识库文档",
  sandbox: "沙箱",
};

const taskActionLabels: Record<string, string> = {
  create: "创建",
  start: "启动",
  stop: "停止",
  restart: "重启",
  delete: "删除",
  scale: "扩缩容",
  expand: "扩容",
  rebuild: "重建",
  parse: "解析",
  import: "导入",
};

function toHomeSummaries(overview: ConsoleOverviewStatistics): HomeSummaryCard[] {
  const instanceRunning = overview.instances.by_state.running;
  const instanceFailed = overview.instances.by_state.failed;
  const inferenceRunning = overview.inference_services.by_status.running;
  const inferenceFailed = overview.inference_services.by_status.failed;
  const modelReady = overview.models.by_status.ready;
  const modelFailed = overview.models.by_status.error;
  const knowledgeBaseActive = overview.knowledge_bases.by_status.active;

  return [
    {
      id: "instances",
      label: "实例总数",
      value: overview.instances.total,
      icon: "yunzhuji",
      route: "/vms",
      statuses: [
        { label: "运行中", value: instanceRunning, tone: "success" },
        { label: "异常", value: instanceFailed, tone: "danger" },
        {
          label: "其他",
          value: overview.instances.other,
          tone: "neutral",
        },
      ],
    },
    {
      id: "inference-services",
      label: "推理服务",
      value: overview.inference_services.total,
      icon: "tuili",
      route: "/ai-inference",
      statuses: [
        { label: "运行中", value: inferenceRunning, tone: "success" },
        { label: "异常", value: inferenceFailed, tone: "danger" },
        {
          label: "其他",
          value: overview.inference_services.other,
          tone: "neutral",
        },
      ],
    },
    {
      id: "models",
      label: "模型仓库",
      value: overview.models.total,
      icon: "moxing",
      route: "/ai-models",
      statuses: [
        { label: "可用", value: modelReady, tone: "success" },
        { label: "失败", value: modelFailed, tone: "danger" },
        {
          label: "其他",
          value: overview.models.other,
          tone: "neutral",
        },
      ],
    },
    {
      id: "knowledge-bases",
      label: "知识库",
      value: overview.knowledge_bases.total,
      icon: "zhishiku",
      // TODO(feature-visibility): 待知识库管理支持后恢复卡片跳转，暂保留统计展示。
      // route: "/kb",
      statuses: [
        { label: "活跃", value: knowledgeBaseActive, tone: "success" },
        {
          label: "其他",
          value: overview.knowledge_bases.other,
          tone: "neutral",
        },
      ],
    },
  ];
}

async function getSummaries(signal?: AbortSignal): Promise<HomeSummaryCard[]> {
  return toHomeSummaries(await getConsoleOverview(signal));
}

const resourceTrendMeta: Record<HomeResourceTrendMetric, { name: string }> = {
  gpu: { name: "GPU 显存使用量" },
  cpu: { name: "CPU 使用量" },
  memory: { name: "内存使用量" },
};

function getTaskResultText(task: AsyncTask, key: string): string | undefined {
  const value = task.result?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function getTaskTitle(task: AsyncTask): string {
  const [domain, action] = task.task_type.split(".");
  const domainLabel = taskDomainLabels[domain] ?? task.resource_type ?? domain;
  const actionLabel = taskActionLabels[action];
  const taskLabel = actionLabel ? `${actionLabel}${domainLabel}` : task.task_type;
  const resourceName =
    getTaskResultText(task, "name") ??
    getTaskResultText(task, "instance_id") ??
    task.resource_id ??
    undefined;
  return resourceName ? `${taskLabel} ${resourceName}` : taskLabel;
}

function toHomeTask(task: AsyncTask): HomeTask {
  const status =
    task.status === "completed"
      ? "done"
      : task.status === "pending" || task.status === "running"
        ? "current"
        : "failed";
  const progress = Math.min(100, Math.max(0, task.progress_pct ?? 0));

  return {
    id: task.id,
    title: getTaskTitle(task),
    subtitle: `${taskStatusLabels[task.status]} · ${task.task_type}`,
    time: formatDateTime(task.created_at),
    status,
    progress: status === "current" ? progress : undefined,
  };
}

async function getTasks(filter: HomeTaskFilter): Promise<HomeTask[]> {
  const status = taskStatusByFilter[filter];
  const response = await listTasks({ limit: HOME_TASK_LIMIT, status });
  const tasks = await Promise.all(
    response.items.map(async (task) => {
      if (
        !task.task_type.startsWith("instance.") ||
        (task.status !== "pending" && task.status !== "running")
      ) {
        return task;
      }

      try {
        return await getTask(task.id);
      } catch {
        return task;
      }
    }),
  );
  // Detail reads advance instance tasks on the current backend. Reuse those results
  // and let the next poll fill vacated rows instead of requesting the list twice.
  return tasks.filter((task) => task.status === status).map(toHomeTask);
}

async function getResourceTrend(
  metric: HomeResourceTrendMetric,
  range: HomeTimeRange,
  signal?: AbortSignal,
): Promise<HomeTrendSnapshot> {
  const response = await queryResourceTrend({ metric, range }, signal);
  const trend = response.data.series[0];
  const points = trend.points;
  const latest = points.at(-1);

  return {
    labels: points.map((point) => formatTrendTime(point.timestamp, range !== "1d")),
    unit: trend.unit,
    status: trend.status,
    headlines: [
      {
        label: "当前",
        value: latest?.value ?? null,
        unit: trend.unit,
        color: BLUE,
      },
    ],
    series: [
      {
        name: resourceTrendMeta[metric].name,
        color: BLUE,
        values: points.map((point) => point.value),
      },
    ],
  };
}

export const homeOverviewDataSource: HomeOverviewDataSource = {
  getSummaries,
  getTasks,
  getResourceTrend,
};
