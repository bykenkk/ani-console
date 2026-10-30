import { getTask, listTasks, type AsyncTask, type AsyncTaskStatus } from "@/api/tasks";
import { formatDateTime } from "@/lib/date";
import type { HomeTask, HomeTaskFilter } from ".";

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

export const homeOverviewDataSource = {
  getTasks,
};
