import { runIdempotentRequest } from "@/api/idempotency";
import { servicesRequest } from "@/api/request";
import type { CursorPageParams } from "@/api/types";
import { createIdempotencyScope } from "@/lib/idempotency";
import type {
  CreateKnowledgeBaseInput,
  CreateKnowledgeBaseRequest,
  KBAuditLogListResponse,
  KnowledgeBase,
  KnowledgeBaseListParams,
  KnowledgeBaseListResponse,
} from "./types";

const createScope = createIdempotencyScope("knowledge-base-create", ["POST"]);
const knowledgeBasePath = (kbId: string) => `/knowledge-bases/${encodeURIComponent(kbId)}`;

export function listKnowledgeBases(
  params: KnowledgeBaseListParams = {},
): Promise<KnowledgeBaseListResponse> {
  return servicesRequest<KnowledgeBaseListResponse>("/knowledge-bases", {
    method: "GET",
    params,
  });
}

// TODO(submit-result): 接入 governance 后按实际契约确认提交返回值；普通创建、操作默认丢弃响应，并清理无用回传及创建后跳转。
export function createKnowledgeBase(submitData: CreateKnowledgeBaseInput): Promise<KnowledgeBase> {
  return runIdempotentRequest(createScope, submitData, (body) =>
    servicesRequest<KnowledgeBase, CreateKnowledgeBaseRequest>("/knowledge-bases", {
      method: "POST",
      data: body,
    }),
  );
}

export function getKnowledgeBase(kbId: string): Promise<KnowledgeBase> {
  return servicesRequest<KnowledgeBase>(knowledgeBasePath(kbId), { method: "GET" });
}

export function listKnowledgeBaseAuditLogs(
  kbId: string,
  params: CursorPageParams = {},
): Promise<KBAuditLogListResponse> {
  return servicesRequest<KBAuditLogListResponse>(`${knowledgeBasePath(kbId)}/audit-logs`, {
    method: "GET",
    params,
  });
}

export function deleteKnowledgeBase(kbId: string): Promise<void> {
  return servicesRequest<void>(knowledgeBasePath(kbId), { method: "DELETE" });
}
