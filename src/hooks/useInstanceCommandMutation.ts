import { useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getInstance, type InstanceRecord } from "@/api/instances";
import { ApiError } from "@/api/request";
import { withId } from "@/lib/id";

export function useInstanceCommandMutation<TInput extends object>(
  instanceId: string,
  action: string,
  label: string,
  channel: "message" | "notification",
  submit: (input: TInput & { expectedVersion: string }) => Promise<void>,
  onSubmitted: () => void,
) {
  const qc = useQueryClient();
  const intent = useRef<{ fingerprint: string; version: string }>();
  return useMutation({
    mutationKey: ["instance-command", instanceId, action],
    retry: false,
    mutationFn: async (input: TInput) => {
      const fingerprint = JSON.stringify(input);
      // 首次提交现查版本；响应丢失后的同正文重试保持原版本，由 API 作用域复用原 key。
      if (!intent.current || intent.current.fingerprint !== fingerprint) {
        const latest = await getInstance(instanceId);
        if (latest.activeOperationId || latest.desiredState === "deleted") {
          throw new Error("实例已有进行中的操作或正在删除，请刷新后确认");
        }
        intent.current = { fingerprint, version: latest.version };
      }
      try {
        await submit({ ...input, expectedVersion: intent.current.version });
      } catch (error) {
        if (error instanceof ApiError) {
          if (error.code === "INSTANCE_VERSION_CONFLICT") {
            error.message = "实例版本已变化，请重新打开操作并确认";
          } else if (error.status === 503 && error.code === "INSTANCE_ACTION_UNAVAILABLE") {
            error.message = "当前环境暂未开放此操作";
          } else if (error.code === "INSTANCE_REQUIRES_STOP") {
            error.message = "实例正在运行，请确认允许重启后再提交";
          } else if (error.code === "INSTANCE_OPERATION_IN_PROGRESS") {
            error.message = "实例已有进行中的操作，请等待完成后再操作";
          }
        }
        throw error;
      }
    },
    meta: {
      feedback: {
        channel,
        id: withId("instance-command", action, instanceId),
        action: label,
        successText: `${label}已提交`,
        errorFallback: `${label}失败，请稍后重试`,
      },
    },
    onSuccess: async () => {
      intent.current = undefined;
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["governance-instances"] }),
        qc.invalidateQueries({ queryKey: ["governance-instance", instanceId] }),
        qc.invalidateQueries({ queryKey: ["governance-instance-configuration", instanceId] }),
        qc.invalidateQueries({ queryKey: ["governance-instance-runtime", instanceId] }),
        qc.invalidateQueries({ queryKey: ["instance-mountable-pvcs", instanceId] }),
      ]);
      onSubmitted();
    },
    onError: async (error) => {
      if (error instanceof ApiError && error.status === 409) {
        await Promise.all([
          qc.invalidateQueries({ queryKey: ["governance-instances"] }),
          qc.invalidateQueries({ queryKey: ["governance-instance", instanceId] }),
          qc.invalidateQueries({ queryKey: ["governance-instance-configuration", instanceId] }),
        ]);
      }
    },
  });
}

export function instanceIntentUnavailable(instance: InstanceRecord) {
  return (
    Boolean(instance.activeOperationId) ||
    !["running", "stopped"].includes(instance.observedState) ||
    instance.desiredState !== instance.observedState ||
    instance.executionRunState !== instance.observedState ||
    !instance.appliedMountVersion ||
    instance.appliedMountVersion === "0"
  );
}
