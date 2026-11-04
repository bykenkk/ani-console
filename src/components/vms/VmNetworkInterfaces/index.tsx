import { useState } from "react";
import { Alert, Button, Modal, Tag } from "@arco-design/web-react";
import { IconRefresh } from "@arco-design/web-react/icon";
import { useIsMutating, useQuery } from "@tanstack/react-query";
import { getVmNetworkInterfaces, type VirtualMachine } from "@/api/vms";
import type { InstanceNetworkInterface } from "@/api/network";
import { DataTable } from "@/components/common";
import { useInstanceNetworkActions } from "@/hooks/useInstanceNetworkActions";
import { withId } from "@/lib/id";
import ChangePrimaryVnicModal from "./ChangePrimaryVnicModal";

type VmNetworkInterfacesProps = { vm: VirtualMachine };

export default function VmNetworkInterfaces({ vm }: VmNetworkInterfacesProps) {
  const consumerKind = "vm";
  const consumerId = vm.id;
  const resourceVersion = vm.version;
  const running = vm.observedState === "Running";
  const stopped = vm.observedState === "Stopped";
  const busy =
    vm.closing || ["Starting", "Stopping", "Deleting", "Provisioning"].includes(vm.observedState);
  const [editing, setEditing] = useState(false);
  const network = useQuery({
    queryKey: ["network-interfaces", consumerKind, consumerId, resourceVersion, running, stopped],
    queryFn: ({ signal }) => getVmNetworkInterfaces(consumerId, signal),
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
    mutationKey: ["vm-write"],
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
      title: "改为自动分配",
      content:
        "改为自动分配后，IP 地址可能变化，原网卡及其 IP 地址将保留。配置将在实例重启或下次启动时生效。",
      okText: "改为自动分配",
      onOk: () => save.mutateAsync({ mode: "automatic", expected_version: network.data!.version }),
    });
  const confirmCancel = () => {
    if (!current) return;
    Modal.confirm({
      title: "撤销待生效变更",
      content: "撤销尚未生效的网卡变更，保留当前已应用的配置，并释放本次变更预留的资源。",
      okText: "撤销变更",
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
          content={network.data.unsupported_reason || "当前实例不支持选择已有网卡"}
        />
      )}
      <DataTable<InstanceNetworkInterface>
        header={{
          title: "网卡配置",
          extra: (
            <div className="flex flex-wrap gap-2">
              <Button type="primary" disabled={disabled} onClick={() => setEditing(true)}>
                修改主网卡配置
              </Button>
              <Button
                disabled={disabled || current?.desired.mode !== "manual"}
                onClick={confirmAutomatic}
              >
                改为自动分配
              </Button>
              <Button disabled={disabled || !current?.pending_restart} onClick={confirmCancel}>
                撤销待生效变更
              </Button>
              <Button
                icon={<IconRefresh />}
                onClick={() => network.refetch()}
                loading={network.isFetching}
                aria-label="刷新"
                title="刷新"
              />
            </div>
          ),
        }}
        data={network.data?.items ?? []}
        rowKey="slot"
        loading={network.isFetching}
        pagination={false}
        tableLabel="实例网卡配置"
        columns={[
          {
            title: "网卡角色",
            width: 100,
            fixed: "left",
            render: (_, item) => (item.slot === "primary" ? "主网卡" : item.slot),
          },
          {
            title: "配置状态",
            width: 120,
            render: (_, item) => {
              let state = "状态待确认";
              if (item.configuration_state === "configuring") state = "正在应用";
              else if (item.configuration_state === "failed") state = "应用失败";
              else if (item.configuration_state === "ready") {
                state = stopped
                  ? "待启动生效"
                  : busy
                    ? "处理中"
                    : item.pending_restart
                      ? "待重启生效"
                      : item.effective_now
                        ? "已生效"
                        : "状态待确认";
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
                    <div className="mt-1 wrap-break-word text-[12px]">{item.operation_reason}</div>
                  )}
                </div>
              );
            },
          },
          {
            title: "当前配置",
            width: 230,
            render: (_, item) => (
              <div>
                <div>网卡：{stopped ? "实例已停止" : item.current_vnic_name || "暂未获取"}</div>
                <div>IP 地址：{stopped ? "-" : item.current_ips?.join(" · ") || "-"}</div>
                <div>MAC 地址：{stopped ? "-" : item.current_mac_address || "-"}</div>
              </div>
            ),
          },
          {
            title: "已保存配置",
            width: 260,
            render: (_, item) => (
              <div>
                <div>
                  网卡：
                  {item.desired.mode === "manual" && item.desired.vnic_id ? (
                    <span>{item.desired.vnic_name || item.desired.vnic_id}</span>
                  ) : (
                    "自动分配"
                  )}
                </div>
                <div>IP 地址：{item.desired.ips?.join(" · ") || "-"}</div>
                <div>MAC 地址：{item.desired.mac_address || "-"}</div>
                {item.pending_restart && <Tag>待生效</Tag>}
              </div>
            ),
          },
          {
            title: "网卡分配方式",
            width: 120,
            render: (_, item) => (item.desired.mode === "manual" ? "已有网卡" : "自动分配"),
          },
        ]}
      />
      {editing && network.data && (
        <ChangePrimaryVnicModal
          consumerId={consumerId}
          version={network.data.version}
          current={current}
          onCancel={() => setEditing(false)}
        />
      )}
    </div>
  );
}
