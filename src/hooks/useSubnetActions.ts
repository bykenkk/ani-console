import { useResourceDelete } from "@/hooks/useResourceDelete";
import { type NetworkSubnet } from "@/api/network";
import type { RowAction } from "@/components/common";
type Subnet = NetworkSubnet;
export function useSubnetActions(onDeleted: (item: Subnet) => void) {
  const deleteSubnet = useResourceDelete<Subnet>("subnet", onDeleted, {
    isDisabled: (item) =>
      item.can_manage !== true || item.state === "deleting" || item.state === "deleted",
  });

  const actions: RowAction<Subnet>[] = [
    {
      key: "delete",
      label: "删除",
      disabled: deleteSubnet.isDisabled,
      loading: (item) => deleteSubnet.isPending && deleteSubnet.variables?.id === item.id,
      intent: "danger",
      onClick: (subnet) => {
        deleteSubnet.confirm(subnet);
      },
    },
  ];
  return { actions };
}
