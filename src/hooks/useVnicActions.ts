import { Modal } from "@arco-design/web-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteNetworkVnic, type NetworkVnic } from "@/api/network";
import type { RowAction } from "@/components/common";

export function useVnicActions(onDeleted?: () => void) {
  const qc = useQueryClient();
  const remove = useMutation({
    mutationFn: (vnic: NetworkVnic) => deleteNetworkVnic(vnic.id),
    meta: {
      feedback: {
        channel: "notification",
        id: "vnic-delete",
        action: "删除虚拟网卡",
        successText: "删除已提交",
        errorFallback: "删除失败",
      },
    },
    onSuccess: async (_, vnic) => {
      // TODO(resource-task): 资源删除的任务跟踪待统一接入。
      await qc.invalidateQueries({ queryKey: ["network-vnic", vnic.id], refetchType: "none" });
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["network-vnics"] }),
        qc.invalidateQueries({ queryKey: ["network-subnets"] }),
        qc.invalidateQueries({ queryKey: ["network-security-group-bindings"] }),
      ]);
      onDeleted?.();
    },
  });
  const actions: RowAction<NetworkVnic>[] = [
    {
      key: "delete",
      label: "删除",
      intent: "danger",
      disabled: (vnic) =>
        remove.isPending ||
        Boolean(vnic.bindings?.length) ||
        vnic.state === "deleting" ||
        vnic.state === "deleted",
      tooltip: (vnic) =>
        vnic.bindings?.length ? "网卡正被使用或预留，请在绑定实例中解除配置" : undefined,
      loading: (vnic) => remove.isPending && remove.variables?.id === vnic.id,
      onClick: (vnic) => {
        Modal.confirm({
          title: "删除虚拟网卡",
          content: `确定删除「${vnic.name}」？分配的地址将被释放。`,
          okButtonProps: { status: "danger" },
          onOk: () => remove.mutateAsync(vnic),
        });
      },
    },
  ];
  return { actions };
}
