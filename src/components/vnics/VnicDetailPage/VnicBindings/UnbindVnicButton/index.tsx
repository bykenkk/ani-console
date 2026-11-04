import { Button, Modal } from "@arco-design/web-react";
import type { NetworkVnicBinding } from "@/api/network";
import { getVmNetworkInterfaces } from "@/api/vms";
import { getInstanceNetworkInterfaces } from "@/api/instances";
import { useInstanceNetworkActions } from "@/hooks/useInstanceNetworkActions";
import { useQueryClient } from "@tanstack/react-query";
import { withId } from "@/lib/id";

type UnbindVnicButtonProps = { binding: NetworkVnicBinding };
export default function UnbindVnicButton({ binding }: UnbindVnicButtonProps) {
  const save = useInstanceNetworkActions(binding.consumer_kind, binding.consumer_id);
  const qc = useQueryClient();
  return (
    <Button
      disabled={save.isPending}
      loading={save.isPending}
      onClick={() =>
        Modal.confirm({
          title: "解绑网卡配置",
          content:
            "将实例主网卡恢复自动分配。运行中需重启生效，原网卡仍受当前占用保护；网卡和地址保留。",
          onOk: async () => {
            const network = await qc.fetchQuery({
              queryKey: ["network-interfaces", binding.consumer_kind, binding.consumer_id],
              queryFn: ({ signal }) =>
                binding.consumer_kind === "vm"
                  ? getVmNetworkInterfaces(binding.consumer_id, signal)
                  : getInstanceNetworkInterfaces(binding.consumer_id, signal),
              staleTime: 0,
              meta: {
                errorNotification: {
                  id: withId("network-interfaces", binding.consumer_kind, binding.consumer_id),
                  action: "实例网卡配置加载",
                },
              },
            });
            await save.mutateAsync({ mode: "automatic", expected_version: network.version });
          },
        })
      }
    >
      解绑配置
    </Button>
  );
}
