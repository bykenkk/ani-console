import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getInstanceOperation } from "@/api/instances";
import { closeNotification, showNotification } from "@/lib/feedback";
import { withId } from "@/lib/id";

type InstanceOperationObserverProps = { instanceId: string; operationId?: string };
const LABELS: Record<string, string> = {
  restart: "重启",
  "attach-pvc": "挂载云盘",
  "detach-pvc": "卸载云盘",
};

export default function InstanceOperationObserver({
  instanceId,
  operationId,
}: InstanceOperationObserverProps) {
  const qc = useQueryClient();
  const handled = useRef("");
  const [trackedId, setTrackedId] = useState(operationId);
  useEffect(() => {
    if (operationId) setTrackedId(operationId);
  }, [operationId]);
  useEffect(
    () => () => {
      if (trackedId) closeNotification(withId("instance-operation-result", trackedId));
    },
    [trackedId],
  );
  const query = useQuery({
    queryKey: ["governance-instance-operation", trackedId],
    enabled: Boolean(trackedId),
    queryFn: ({ signal }) => getInstanceOperation(trackedId!, signal),
    // 创建、删除等旧操作仍按原边界暂缓跟踪，只轮询本批新增的三个动作。
    refetchInterval: (query) =>
      query.state.data &&
      (!LABELS[query.state.data.action] ||
        ["completed", "failed", "superseded"].includes(query.state.data.state))
        ? false
        : 4000,
    meta: {
      errorNotification: { id: withId("instance-operation", trackedId), action: "操作状态加载" },
    },
  });
  useEffect(() => {
    const operation = query.data;
    if (
      !operation ||
      (operationId && operationId !== trackedId) ||
      operation.id !== trackedId ||
      operation.instanceId !== instanceId ||
      !LABELS[operation.action]
    )
      return;
    const terminal = ["completed", "failed", "superseded"].includes(operation.state);
    const signature = `${operation.id}:${operation.state}`;
    if (handled.current === signature) return;
    handled.current = signature;
    const action = LABELS[operation.action];
    showNotification({
      id: withId("instance-operation-result", trackedId),
      action,
      state: terminal ? (operation.state === "completed" ? "success" : "error") : "loading",
      title: terminal
        ? `${action}${operation.state === "completed" ? "成功" : "失败"}`
        : `${action}处理中`,
      content:
        operation.state === "blocked"
          ? "正在等待后端收敛"
          : operation.state === "superseded"
            ? "操作已被实例删除接管"
            : operation.failure_reason || operation.reason || undefined,
    });
    if (terminal) {
      // 失败不代表回滚，始终重新查询当前实例和权威挂载集合。
      Promise.all([
        qc.invalidateQueries({ queryKey: ["governance-instances"] }),
        qc.invalidateQueries({ queryKey: ["governance-instance", instanceId] }),
        qc.invalidateQueries({ queryKey: ["governance-instance-configuration", instanceId] }),
        qc.invalidateQueries({ queryKey: ["governance-instance-runtime", instanceId] }),
        qc.invalidateQueries({ queryKey: ["instance-mountable-pvcs", instanceId] }),
      ]).catch(() => {
        /* 查询失败由各查询的 errorNotification 处理。 */
      });
    }
  }, [query.data, operationId, trackedId, instanceId, qc]);
  return null;
}
