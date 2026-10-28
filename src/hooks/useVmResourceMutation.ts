import { useIsMutating, useMutation, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/api/request";
import { withId } from "@/lib/id";

type VmResourceMutationOptions<TVariables> = {
  vmId: string;
  action: string;
  actionId: string;
  channel?: "message" | "notification";
  mutationFn: (variables: TVariables) => Promise<void>;
  onSubmitted?: () => void;
  onConflict?: () => void;
};

export function useVmResourceMutation<TVariables = void>({
  vmId,
  action,
  actionId,
  channel = "message",
  mutationFn,
  onSubmitted,
  onConflict,
}: VmResourceMutationOptions<TVariables>) {
  const client = useQueryClient();
  const pending = useIsMutating({ mutationKey: ["vm-write"] });
  const refresh = () =>
    Promise.all([
      client.invalidateQueries({ queryKey: ["vms", vmId] }),
      client.invalidateQueries({ queryKey: ["vms", "list"] }),
    ]);
  const mutation = useMutation({
    mutationKey: ["vm-write", vmId, actionId],
    mutationFn,
    retry: false,
    meta: {
      feedback:
        channel === "notification"
          ? { channel, id: withId(actionId, vmId), action, successText: `${action}已提交` }
          : { channel, action, successText: `${action}已提交` },
    },
    onSuccess: async () => {
      // TODO(vm-task): 创建、删除的任务跟踪统一暂缓；只刷新资源，不查询操作结果。
      onSubmitted?.();
      await refresh();
    },
    onError: async (error) => {
      if (error instanceof ApiError && error.status === 409) {
        onConflict?.();
        await refresh();
      }
    },
  });
  return { ...mutation, busy: pending > 0 };
}
