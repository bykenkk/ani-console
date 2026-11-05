import { useState } from "react";
import { Alert, Modal } from "@arco-design/web-react";
import { useIsMutating, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getInstanceNetworkInterfaces,
  setInstanceNetworkInterface,
  type InstanceRecord,
} from "@/api/instances";
import type { InstanceNetworkInterface, SetNetworkInterfaceInput } from "@/api/network";
import InstanceNetworkInterfacesTable from "@/components/instances/InstanceNetworkInterfacesTable";
import { withId } from "@/lib/id";
import InstanceChangePrimaryVnicModal from "@/components/instances/InstanceChangePrimaryVnicModal";

type ContainerNetworkInterfacesProps = { instance: InstanceRecord };

export default function ContainerNetworkInterfaces({ instance }: ContainerNetworkInterfacesProps) {
  const instanceId = instance.id;
  const resourceVersion = instance.version;
  const running = instance.observedState === "running";
  const stopped = instance.observedState === "stopped";
  const busy = Boolean(instance.activeOperationId) || instance.desiredState === "deleted";
  const [editing, setEditing] = useState(false);
  const network = useQuery({
    queryKey: ["container-network-interfaces", instanceId, resourceVersion, running, stopped],
    queryFn: ({ signal }) => getInstanceNetworkInterfaces(instanceId, signal),
    meta: {
      errorNotification: {
        id: withId("container-network-interfaces", instanceId),
        action: "实例网卡配置加载",
      },
    },
  });
  const current = network.data?.items.find((item) => item.slot === "primary");
  const qc = useQueryClient();
  const save = useMutation({
    mutationKey: ["instance-command", "network", instanceId],
    mutationFn: (input: SetNetworkInterfaceInput) =>
      setInstanceNetworkInterface(instanceId, "primary", input),
    meta: {
      feedback: {
        channel: "notification",
        id: withId("container-network-interface-update", instanceId),
        action: "保存网卡配置",
        successText: "网卡配置已提交",
        errorFallback: "保存失败，请刷新后检查配置版本",
      },
    },
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["container-network-interfaces", instanceId] }),
        qc.invalidateQueries({ queryKey: ["network-vnics"] }),
        qc.invalidateQueries({ queryKey: ["network-vnic"] }),
      ]);
    },
    onError: () => qc.invalidateQueries({ queryKey: ["container-network-interfaces", instanceId] }),
  });
  const ownerMutations = useIsMutating({
    mutationKey: ["instance-command"],
  });
  const configurationInProgress = network.data?.items.some(
    (item) => item.configuration_state === "configuring",
  );
  const disabled =
    busy ||
    Boolean(ownerMutations) ||
    configurationInProgress ||
    save.isPending ||
    !network.data?.supported;

  const confirmCancel = (item: InstanceNetworkInterface) => {
    Modal.confirm({
      title: "撤销待生效变更",
      content: "撤销尚未生效的网卡变更，保留当前已应用的配置，并释放本次变更预留的资源。",
      okText: "撤销变更",
      onOk: () =>
        save.mutateAsync({
          mode: item.applied.mode,
          vnic_id: item.applied.vnic_id,
          expected_version: network.data!.version,
        }),
    });
  };
  return (
    <div className="flex flex-col gap-3">
      {network.data && !network.data.supported && (
        <Alert
          type="info"
          content={network.data.unsupported_reason || "当前实例不支持选择已有网卡"}
        />
      )}
      <InstanceNetworkInterfacesTable
        items={network.data?.items ?? []}
        loading={network.isFetching}
        stopped={stopped}
        disabled={disabled}
        onEdit={() => setEditing(true)}
        onRefresh={() => network.refetch()}
        onCancelChange={confirmCancel}
      />
      {editing && network.data && (
        <InstanceChangePrimaryVnicModal
          instanceKind="container"
          instanceId={instanceId}
          version={network.data.version}
          current={current}
          onCancel={() => setEditing(false)}
        />
      )}
    </div>
  );
}
