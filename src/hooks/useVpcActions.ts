import { useResourceDelete } from "@/hooks/useResourceDelete";
import { type NetworkVPC } from "@/api/network";
import type { RowAction } from "@/components/common";
import { useVpcEipActions } from "./useVpcEipActions";
type Vpc = NetworkVPC;
export function useVpcActions(onDeleted?: (item: Vpc) => void, onBind?: (item: Vpc) => void) {
  const eipActions = useVpcEipActions(onBind);
  const deleteVpc = useResourceDelete<Vpc>("vpc", onDeleted, {
    isDisabled: (item) => item.state === "deleting" || item.state === "deleted",
  });

  const actions: RowAction<Vpc>[] = [
    ...eipActions,
    {
      key: "delete",
      label: "删除",
      disabled: deleteVpc.isDisabled,
      loading: (item) => deleteVpc.isPending && deleteVpc.variables?.id === item.id,
      intent: "danger",
      onClick: (vpc) => deleteVpc.confirm(vpc),
    },
  ];
  return { actions };
}
