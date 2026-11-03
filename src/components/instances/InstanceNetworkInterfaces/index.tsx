import { useState } from "react";
import { Alert, Button, Modal, Tag } from "@arco-design/web-react";
import { useIsMutating, useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { getVmNetworkInterfaces } from "@/api/vms";
import { getInstanceNetworkInterfaces } from "@/api/instances";
import type { InstanceNetworkInterface, VnicConsumerKind } from "@/api/network";
import { DataTable } from "@/components/common";
import { useInstanceNetworkActions } from "@/hooks/useInstanceNetworkActions";
import { formatDateTime } from "@/lib/format";
import { withId } from "@/lib/id";
import InstanceNetworkInterfaceModal from "../InstanceNetworkInterfaceModal";

type InstanceNetworkInterfacesProps = {
  consumerKind: VnicConsumerKind;
  consumerId: string;
  resourceVersion: string;
  running: boolean;
  stopped: boolean;
  busy: boolean;
  onRestart: () => void;
};

export default function InstanceNetworkInterfaces({
  consumerKind,
  consumerId,
  resourceVersion,
  running,
  stopped,
  busy,
  onRestart,
}: InstanceNetworkInterfacesProps) {
  const [editing, setEditing] = useState(false);
  const network = useQuery({
    queryKey: ["network-interfaces", consumerKind, consumerId, resourceVersion, running, stopped],
    queryFn: ({ signal }) =>
      consumerKind === "vm"
        ? getVmNetworkInterfaces(consumerId, signal)
        : getInstanceNetworkInterfaces(consumerId, signal),
    meta: {
      errorNotification: {
        id: withId("network-interfaces", consumerKind, consumerId),
        action: "实例网卡配置加载",
      },
    },
  });
  const current = network.data?.items.find((item) => item.slot === "primary");
  const save = useInstanceNetworkActions(consumerKind, consumerId);
  const ownerMutations = useIsMutating({
    mutationKey: [consumerKind === "vm" ? "vm-write" : "instance-command"],
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
  const confirmAutomatic = () =>
    Modal.confirm({
      title: "恢复自动分配",
      content: "保存后需重启生效，停止实例在下次启动使用。IP 可能变化；手动网卡及其地址将保留。",
      onOk: () => save.mutateAsync({ mode: "automatic", expected_version: network.data!.version }),
    });
  const confirmCancel = () => {
    if (!current) return;
    Modal.confirm({
      title: "取消待生效变更",
      content: "恢复当前已应用的网卡选择，释放不再使用的目标预留。",
      onOk: () =>
        save.mutateAsync({
          mode: current.applied.mode,
          vnic_id: current.applied.vnic_id,
          expected_version: network.data!.version,
        }),
    });
  };
  return (
    <div className="flex flex-col gap-3">
      {network.data && !network.data.supported && (
        <Alert
          type="info"
          content={network.data.unsupported_reason || "当前实例不支持配置手动网卡"}
        />
      )}
      <DataTable<InstanceNetworkInterface>
        header={{
          title: "主网卡配置",
          extra: (
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => network.refetch()} loading={network.isFetching}>
                刷新
              </Button>
              <Button disabled={disabled} onClick={() => setEditing(true)}>
                切换网卡
              </Button>
              <Button
                disabled={disabled || current?.desired.mode !== "manual"}
                onClick={confirmAutomatic}
              >
                恢复自动分配
              </Button>
              <Button disabled={disabled || !current?.pending_restart} onClick={confirmCancel}>
                取消待生效变更
              </Button>
              <Button
                disabled={disabled || !running || !current?.pending_restart}
                onClick={onRestart}
              >
                重启并应用
              </Button>
            </div>
          ),
        }}
        data={network.data?.items ?? []}
        rowKey="slot"
        loading={network.isFetching}
        pagination={false}
        tableLabel="实例主网卡配置"
        columns={[
          { title: "槽位", dataIndex: "slot", width: 100 },
          {
            title: "当前网卡 / 地址",
            width: 230,
            render: (_, item) => (
              <div>
                {stopped ? "无当前在线端点" : item.current_vnic_name || "观察待确认"}
                <div>{stopped ? "-" : item.current_ips?.join(" · ") || "-"}</div>
                <div>{stopped ? "-" : item.current_mac_address || "-"}</div>
              </div>
            ),
          },
          {
            title: "目标网卡 / 分配地址",
            width: 260,
            render: (_, item) => (
              <div>
                {item.desired.mode === "manual" && item.desired.vnic_id ? (
                  <Link to="/vnics/$vnicId" params={{ vnicId: item.desired.vnic_id }}>
                    {item.desired.vnic_name || item.desired.vnic_id}
                  </Link>
                ) : (
                  "子网自动分配"
                )}
                <div>{item.desired.ips?.join(" · ") || "-"}</div>
                <div>{item.desired.mac_address || "-"}</div>
              </div>
            ),
          },
          {
            title: "使用模式",
            width: 120,
            render: (_, item) => (item.desired.mode === "manual" ? "手动网卡" : "自动分配"),
          },
          {
            title: "配置与生效状态",
            width: 210,
            render: (_, item) => {
              let state = "配置状态待确认";
              if (item.configuration_state === "configuring") state = "配置处理中";
              else if (item.configuration_state === "failed") state = "配置失败";
              else if (item.configuration_state === "ready") {
                state = stopped
                  ? "下次启动使用"
                  : busy
                    ? "处理中"
                    : item.pending_restart
                      ? "待重启生效"
                      : item.effective_now
                        ? "已生效"
                        : "观察待确认";
              }
              return (
                <div>
                  <Tag
                    color={
                      item.configuration_state === "failed"
                        ? "red"
                        : item.configuration_state === "configuring"
                          ? "orange"
                          : undefined
                    }
                  >
                    {state}
                  </Tag>
                  {item.operation_reason && (
                    <div className="mt-1 break-words text-[12px]">{item.operation_reason}</div>
                  )}
                </div>
              );
            },
          },
          {
            title: "配置版本",
            width: 150,
            render: (_, item) =>
              `目标 ${item.requested_revision} / 已应用 ${item.applied_revision}`,
          },
          {
            title: "观察",
            width: 210,
            render: (_, item) => (
              <div>
                {item.observation_reason || "-"}
                <div>{formatDateTime(item.observed_at)}</div>
              </div>
            ),
          },
        ]}
      />
      {editing && network.data && (
        <InstanceNetworkInterfaceModal
          consumerKind={consumerKind}
          consumerId={consumerId}
          version={network.data.version}
          current={current}
          onCancel={() => setEditing(false)}
        />
      )}
    </div>
  );
}
