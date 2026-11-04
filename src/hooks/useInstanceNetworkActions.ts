import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getVm, restartVm, setVmNetworkInterface } from "@/api/vms";
import { getInstance, restartInstance, setInstanceNetworkInterface } from "@/api/instances";
import type { VnicConsumerKind, SetNetworkInterfaceInput } from "@/api/network";
import { withId } from "@/lib/id";

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

export function useRestartInstanceNetwork(kind: VnicConsumerKind, id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: [kind === "vm" ? "vm-write" : "instance-command", id, "network-restart"],
    retry: false,
    mutationFn: async () => {
      if (kind === "vm") {
        const latest = await getVm(id);
        if (latest.closing) throw new Error("云主机正在删除，请刷新后确认");
        await restartVm(id, { expected_version: latest.version });
      } else {
        const latest = await getInstance(id);
        if (latest.activeOperationId || latest.desiredState === "deleted") {
          throw new Error("实例已有进行中的操作或正在删除，请刷新后确认");
        }
        await restartInstance(id, { expectedVersion: latest.version });
      }
    },
    meta: {
      feedback: {
        channel: "notification",
        id: withId("network-restart", kind, id),
        action: "重启",
        successText: "重启已提交",
        errorFallback: "重启失败，请刷新后检查实例状态",
      },
    },
    onSettled: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: [kind === "vm" ? "vms" : "instance", id], exact: true }),
        qc.invalidateQueries({ queryKey: kind === "vm" ? ["vms", "list"] : ["instances"] }),
        qc.invalidateQueries({ queryKey: ["network-interfaces", kind, id] }),
        qc.invalidateQueries({ queryKey: ["network-vnics"] }),
        qc.invalidateQueries({ queryKey: ["network-vnic"] }),
      ]);
    },
  });
}
