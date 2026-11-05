import { Modal } from "@arco-design/web-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { NetworkVnic } from "@/api/network";
import { getVmNetworkInterfaces, setVmNetworkInterface } from "@/api/vms";
import { getInstanceNetworkInterfaces, setInstanceNetworkInterface } from "@/api/instances";
import { withId } from "@/lib/id";

type UnbindVnicModalProps = {
  vnic: NetworkVnic;
  onCancel: () => void;
};

export default function UnbindVnicModal({ vnic, onCancel }: UnbindVnicModalProps) {
  const qc = useQueryClient();
  // FIXME(api-contract): 后端已确认网卡与实例为一对一关系，bindings 数组为接口设计问题；暂取第一条，待契约修正后调整。
  const { consumer_kind: instanceKind, consumer_id: instanceId } = vnic.bindings[0];
  const networkQueryKey = [
    instanceKind === "vm" ? "vm-network-interfaces" : "container-network-interfaces",
    instanceId,
  ];
  const save = useMutation({
    mutationKey: [instanceKind === "vm" ? "vm-write" : "instance-command", "network", instanceId],
    mutationFn: async () => {
      const network = await qc.fetchQuery({
        queryKey: networkQueryKey,
        queryFn: ({ signal }) =>
          instanceKind === "vm"
            ? getVmNetworkInterfaces(instanceId, signal)
            : getInstanceNetworkInterfaces(instanceId, signal),
        staleTime: 0,
        meta: {
          errorNotification: {
            id: withId(networkQueryKey[0], instanceId),
            action: "实例网卡配置加载",
          },
        },
      });
      const input = { mode: "automatic" as const, expected_version: network.version };
      return instanceKind === "vm"
        ? setVmNetworkInterface(instanceId, "primary", input)
        : setInstanceNetworkInterface(instanceId, "primary", input);
    },
    meta: {
      feedback: {
        channel: "notification",
        id: withId("vnic-unbind", instanceKind, instanceId),
        action: "解绑虚拟网卡",
        successText: "解绑已提交",
        errorFallback: "解绑失败，请刷新后重试",
      },
    },
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({
          queryKey: networkQueryKey,
        }),
        qc.invalidateQueries({ queryKey: ["network-vnics"] }),
        qc.invalidateQueries({ queryKey: ["network-vnic"] }),
      ]);
      onCancel();
    },
    onError: () =>
      qc.invalidateQueries({
        queryKey: networkQueryKey,
      }),
  });
  return (
    <Modal
      visible
      title="解绑实例"
      okText="解绑"
      okButtonProps={{ status: "danger" }}
      confirmLoading={save.isPending}
      cancelButtonProps={{ disabled: save.isPending }}
      onCancel={onCancel}
      onOk={() => save.mutateAsync()}
    >
      确认解绑虚拟网卡「{vnic.name || vnic.id}
      」？实例将改为自动分配网卡。运行中的实例需重启后生效；已停止的实例将在下次启动时生效。此虚拟网卡及其私网
      IP 将保留。
    </Modal>
  );
}
