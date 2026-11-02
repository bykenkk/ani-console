import { useIsMutating, useMutation, useQueryClient, type QueryKey } from "@tanstack/react-query";
import { withId } from "@/lib/id";

type VMMutationOptions<TVariables> = {
  vmId: string;
  action: string;
  actionId: string;
  channel?: "message" | "notification";
  mutationFn: (variables: TVariables) => Promise<void>;
  refreshQueryKeys?: readonly QueryKey[];
  onSubmitted?: () => void;
};

export function useVMMutation<TVariables = void>({
  vmId,
  action,
  actionId,
  channel = "message",
  mutationFn,
  refreshQueryKeys = [],
  onSubmitted,
}: VMMutationOptions<TVariables>) {
  const client = useQueryClient();
  const pending = useIsMutating({ mutationKey: ["vm-write"] });
  const refresh = () =>
    Promise.all([
      client.invalidateQueries({ queryKey: ["vms", vmId], exact: true }),
      client.invalidateQueries({ queryKey: ["vms", "list"] }),
      ...refreshQueryKeys.map((queryKey) => client.invalidateQueries({ queryKey })),
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
  });
  return { ...mutation, busy: pending > 0 };
}
