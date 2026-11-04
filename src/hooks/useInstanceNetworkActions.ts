import { useMutation, useQueryClient } from "@tanstack/react-query";
import { setVmNetworkInterface } from "@/api/vms";
import { setInstanceNetworkInterface } from "@/api/instances";
import type { VnicConsumerKind, SetNetworkInterfaceInput } from "@/api/network";

export function useInstanceNetworkActions(
  kind: VnicConsumerKind,
  id: string,
  onSaved?: () => void,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: [kind === "vm" ? "vm-write" : "instance-command", "network", id],
    mutationFn: (input: SetNetworkInterfaceInput) =>
      kind === "vm"
        ? setVmNetworkInterface(id, "primary", input)
        : setInstanceNetworkInterface(id, "primary", input),
    meta: {
      feedback: {
        channel: "message",
        action: "保存网卡配置",
        successText: "网卡配置已提交",
        errorFallback: "保存失败，请刷新后检查配置版本",
      },
    },
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["network-vnics"] }),
        qc.invalidateQueries({ queryKey: ["network-vnic"] }),
        qc.invalidateQueries({ queryKey: ["network-interfaces", kind, id] }),
        qc.invalidateQueries({ queryKey: [kind === "vm" ? "vms" : "instance", id] }),
        qc.invalidateQueries({ queryKey: ["network-security-group-bindings"] }),
        qc.invalidateQueries({ queryKey: ["network-subnets"] }),
      ]);
      onSaved?.();
    },
    onError: async () => {
      // 版本冲突刷新事实并保留弹窗选择，由用户明确重新提交。
      await qc.invalidateQueries({ queryKey: ["network-interfaces", kind, id] });
    },
  });
}
