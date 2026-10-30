import { Modal } from "@arco-design/web-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { unbindNetworkVpcEip, type NetworkVPC } from "@/api/network";
import type { RowAction } from "@/components/common";

export function useVpcEipActions(onBind?: (vpc: NetworkVPC) => void) {
  const queryClient = useQueryClient();
  const unbind = useMutation({
    mutationFn: async (vpc: NetworkVPC) => {
      if (!vpc.public_egress) throw new Error("请刷新 VPC 绑定信息");
      await unbindNetworkVpcEip(vpc.public_egress.binding_id);
    },
    meta: {
      feedback: {
        channel: "notification",
        id: "vpc-eip-unbind",
        action: "解绑公网 IP",
        successText: "公网 IP 解绑已提交",
        errorFallback: "解绑失败，请稍后重试",
      },
    },
    onSuccess: async (_, vpc) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["network-vpcs"] }),
        queryClient.invalidateQueries({ queryKey: ["network-vpc", vpc.id] }),
        queryClient.invalidateQueries({ queryKey: ["network-eips"] }),
        queryClient.invalidateQueries({ queryKey: ["network-eip", vpc.public_egress?.eip_id] }),
      ]);
    },
  });
  const actions: RowAction<NetworkVPC>[] = [
    {
      key: "bind-eip",
      label: "绑定公网 IP",
      visible: (vpc) => Boolean(onBind) && !vpc.public_egress,
      disabled: (vpc) => ["deleting", "deleted", "failed"].includes(vpc.state),
      onClick: (vpc) => onBind?.(vpc),
    },
    {
      key: "unbind-eip",
      label: "解绑公网 IP",
      visible: (vpc) => Boolean(vpc.public_egress),
      disabled: (vpc) =>
        vpc.state === "deleting" ||
        vpc.state === "deleted" ||
        vpc.public_egress?.state === "deleting",
      loading: (vpc) => unbind.isPending && unbind.variables?.id === vpc.id,
      onClick: (vpc) => {
        Modal.confirm({
          title: "解绑公网 IP",
          content: `确认解除 VPC「${vpc.name}」与公网 IP「${vpc.public_egress?.eip_address || vpc.public_egress?.eip_id}」的绑定？解绑后将保留公网 IP。`,
          okText: "解绑",
          onOk: () => unbind.mutateAsync(vpc),
        });
      },
    },
  ];
  return actions;
}
