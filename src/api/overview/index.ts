import { ApiError, coreRequest } from "@/api/request";
import type { ConsoleOverviewStatistics } from "./types";

const OVERVIEW_TIMEOUT_MS = 15_000;

const OVERVIEW_ERROR_MESSAGES: Record<string, string> = {
  INVALID_OVERVIEW_REQUEST: "资源统计查询参数错误",
  FORBIDDEN: "无权查看资源统计",
  OVERVIEW_AUTHORIZATION_UNAVAILABLE: "资源统计授权服务暂不可用，请稍后重试",
  ECONNABORTED: "资源统计查询超时，请稍后重试",
  ETIMEDOUT: "资源统计查询超时，请稍后重试",
};

export async function getConsoleOverview(signal?: AbortSignal): Promise<ConsoleOverviewStatistics> {
  try {
    return await coreRequest<ConsoleOverviewStatistics>("/overview", {
      method: "GET",
      signal,
      timeout: OVERVIEW_TIMEOUT_MS,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      const message =
        error.status === 403 ? "无权查看资源统计" : OVERVIEW_ERROR_MESSAGES[error.code ?? ""];
      if (message) error.message = message;
    }
    throw error;
  }
}

export type {
  ConsoleGpuQuotaOverview,
  ConsoleGpuQuotaItem,
  ConsoleOverviewStatistics,
  InferenceServiceOverviewStatistics,
  InstanceOverviewStatistics,
  KnowledgeBaseOverviewStatistics,
  ModelOverviewStatistics,
} from "./types";
