import { useResourceDelete } from "@/hooks/useResourceDelete";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { copyNetworkSecurityGroup, type NetworkSecurityGroup } from "@/api/network";
import type { RowAction } from "@/components/common";
type SecurityGroup = NetworkSecurityGroup;
export function useSecurityGroupActions(
  onDeleted: (item: SecurityGroup) => void,
  onCopied?: () => void,
) {
  const qc = useQueryClient();
  const deleteSecurityGroup = useResourceDelete<SecurityGroup>("security-group", onDeleted);
  const copySecurityGroup = useMutation({
    meta: {
      feedback: {
        channel: "notification",
        id: "security-group-copy",
        action: "复制安全组",
        errorFallback: "请求失败",
      },
    },
    mutationFn: (item: SecurityGroup) => copyNetworkSecurityGroup(item),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["network-security-groups"] });
      onCopied?.();
    },
  });
  const actions: RowAction<SecurityGroup>[] = [
    {
      key: "copy",
      label: "复制",
      loading: () => copySecurityGroup.isPending,
      onClick: (item) => copySecurityGroup.mutate(item),
    },
    {
      key: "delete",
      label: "删除",
      disabled: deleteSecurityGroup.isDisabled,
      loading: (item) =>
        deleteSecurityGroup.isPending && deleteSecurityGroup.variables?.id === item.id,
      intent: "danger",
      onClick: (item) => deleteSecurityGroup.confirm(item),
    },
  ];
  return { actions };
}
