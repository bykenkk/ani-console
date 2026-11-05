import { Modal } from "@arco-design/web-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { deleteNetworkVnic, type NetworkVnic } from "@/api/network";
import type { RowAction } from "@/components/common";
import BindVnicModal from "@/components/vnics/BindVnicModal";
import UnbindVnicModal from "@/components/vnics/UnbindVnicModal";

type VnicActionDialog = { action: "bind" | "unbind"; vnic: NetworkVnic };

export function useVnicActions(onDeleted?: () => void) {
  const qc = useQueryClient();
  const [dialog, setDialog] = useState<VnicActionDialog>();
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
      key: "bind",
      label: "绑定",
      visible: (vnic) => !vnic.bindings?.length,
      disabled: (vnic) => vnic.state === "deleting" || vnic.state === "deleted",
      onClick: (vnic) => setDialog({ action: "bind", vnic }),
    },
    {
      key: "unbind",
      label: "解绑",
      visible: (vnic) => Boolean(vnic.bindings?.length),
      disabled: (vnic) => vnic.state === "deleting" || vnic.state === "deleted",
      onClick: (vnic) => setDialog({ action: "unbind", vnic }),
    },
    {
      key: "delete",
      label: "删除",
      intent: "danger",
      disabled: (vnic) =>
        remove.isPending ||
        Boolean(vnic.bindings?.length) ||
        vnic.state === "deleting" ||
        vnic.state === "deleted",
      title: (vnic) => (vnic.bindings?.length ? "网卡正被使用或预留，请先解绑实例" : undefined),
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
  const closeDialog = () => setDialog(undefined);
  const dialogNode = dialog ? (
    dialog.action === "bind" ? (
      <BindVnicModal vnic={dialog.vnic} onCancel={closeDialog} />
    ) : (
      <UnbindVnicModal vnic={dialog.vnic} onCancel={closeDialog} />
    )
  ) : null;
  return { actions, dialogNode };
}
