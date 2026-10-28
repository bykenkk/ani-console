// TODO(governance-migration): 保留旧概览契约作为迁移参考，不作为 Governance 请求失败时的回退。
import { coreRequest } from "@/api/request";
import type { ConsoleOverviewStatistics } from "./types-legacy";

const OVERVIEW_TIMEOUT_MS = 15_000;

export function getConsoleOverview(): Promise<ConsoleOverviewStatistics> {
  return coreRequest<ConsoleOverviewStatistics>("/overview", {
    method: "GET",
    timeout: OVERVIEW_TIMEOUT_MS,
  });
}

export type {
  ConsoleOverviewStatistics,
  InferenceServiceOverviewStatistics,
  InstanceOverviewStatistics,
  KnowledgeBaseOverviewStatistics,
  ModelOverviewStatistics,
} from "./types-legacy";
