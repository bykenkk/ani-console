// FIXME(governance-migration): 自定义命令/容器、VNC 等访问契约尚未对齐，保留原调用。
// TODO(governance-migration): 公共标准终端已迁移；其余访问能力待等价契约后迁移。
import { runIdempotentRequest } from "@/api/idempotency";
import { coreRequest } from "@/api/request";
import { createIdempotencyScope } from "@/lib/idempotency";
import { instancePath } from "./records-legacy";
import type {
  CreateInstanceExecSessionInput,
  InstanceConsoleSession,
  InstanceExecSession,
} from "./types-legacy";

const execScope = createIdempotencyScope("instance-exec-session", ["POST"]);
const consoleScope = createIdempotencyScope("instance-console-session", ["POST"]);
export function createInstanceExecSession(
  instanceId: string,
  submitData: CreateInstanceExecSessionInput,
  signal?: AbortSignal,
): Promise<InstanceExecSession> {
  return runIdempotentRequest(
    execScope,
    submitData,
    (body) =>
      coreRequest<InstanceExecSession, typeof body>(`${instancePath(instanceId)}/exec`, {
        method: "POST",
        data: body,
        signal,
      }),
    [instanceId],
  );
}
export function createInstanceConsoleSession(
  instanceId: string,
  protocol: "console" | "vnc" | "novnc" | "serial",
  signal?: AbortSignal,
): Promise<InstanceConsoleSession> {
  const submitData = { protocol };
  return runIdempotentRequest(
    consoleScope,
    submitData,
    (body) =>
      coreRequest<InstanceConsoleSession, typeof body>(`${instancePath(instanceId)}/console`, {
        method: "POST",
        data: body,
        signal,
      }),
    [instanceId],
  );
}
