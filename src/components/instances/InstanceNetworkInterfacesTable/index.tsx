import { Alert, Button } from "@arco-design/web-react";
import { IconRefresh } from "@arco-design/web-react/icon";
import type { InstanceNetworkInterface } from "@/api/network";
import { DataTable, ResourceIdentity, StatusBadge } from "@/components/common";

type InstanceNetworkInterfacesTableProps = {
  items: InstanceNetworkInterface[];
  loading: boolean;
  stopped: boolean;
  disabled: boolean;
  onEdit: () => void;
  onRefresh: () => void;
  onCancelChange: (item: InstanceNetworkInterface) => void;
};

type NetworkInterfaceRow = InstanceNetworkInterface & {
  privateIp?: string;
  macAddress?: string;
};

export default function InstanceNetworkInterfacesTable({
  items,
  loading,
  stopped,
  disabled,
  onEdit,
  onRefresh,
  onCancelChange,
}: InstanceNetworkInterfacesTableProps) {
  const rows: NetworkInterfaceRow[] = items.map((item) => ({
    ...item,
    privateIp: stopped ? undefined : item.current_ips?.join(" · "),
    macAddress: stopped ? undefined : item.current_mac_address,
  }));

  return (
    <div className="flex flex-col gap-3">
      {items
        .filter((item) => item.pending_restart)
        .map((item) => (
          <Alert
            key={item.slot}
            type="info"
            content={
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="min-w-0 wrap-anywhere">
                  待生效变更：{item.slot === "primary" ? "主网卡" : item.slot}将
                  {item.desired.mode === "manual"
                    ? `绑定「${item.desired.vnic_name || item.desired.vnic_id}」`
                    : "改为自动分配"}
                  ，{stopped ? "下次启动" : "重启"}后生效。
                </span>
                <Button type="text" disabled={disabled} onClick={() => onCancelChange(item)}>
                  撤销变更
                </Button>
              </div>
            }
          />
        ))}
      <DataTable<NetworkInterfaceRow>
        header={{
          title: "网卡配置",
          extra: (
            <div className="flex flex-wrap gap-2">
              <Button type="primary" disabled={disabled} onClick={onEdit}>
                修改配置
              </Button>
              <Button
                icon={<IconRefresh />}
                onClick={onRefresh}
                loading={loading}
                aria-label="刷新"
                title="刷新"
              />
            </div>
          ),
        }}
        data={rows}
        rowKey="slot"
        loading={loading}
        pagination={false}
        tableLabel="实例网卡配置"
        columns={[
          {
            title: "网卡",
            width: 200,
            fixed: "left",
            ellipsis: true,
            render: (_, item) => (
              <div className="flex min-w-0 flex-col gap-1">
                <span>{item.slot === "primary" ? "主网卡" : item.slot}</span>
                {item.applied.mode === "manual" && (
                  <ResourceIdentity
                    name={item.applied.vnic_name || item.applied.vnic_id || "-"}
                    id={item.applied.vnic_id}
                    openable={false}
                  />
                )}
              </div>
            ),
          },
          {
            title: "分配方式",
            width: 120,
            render: (_, item) => (item.applied.mode === "manual" ? "已有网卡" : "自动分配"),
          },
          {
            title: "私网 IP",
            dataIndex: "privateIp",
            width: 200,
            ellipsis: true,
          },
          {
            title: "MAC 地址",
            dataIndex: "macAddress",
            width: 180,
            ellipsis: true,
          },
          {
            title: "配置状态",
            width: 120,
            render: (_, item) => {
              const configuring = item.configuration_state === "configuring";
              const failed = item.configuration_state === "failed";
              let label = "待确认";
              if (failed) label = "配置失败";
              else if (configuring) label = "配置中";
              else if (item.configuration_state === "ready") {
                label = stopped
                  ? "待启动"
                  : item.pending_restart
                    ? "待重启"
                    : item.effective_now
                      ? "已生效"
                      : "待确认";
              }
              return (
                <StatusBadge
                  status={item.configuration_state}
                  reason={item.operation_reason}
                  loading={configuring}
                  tone={
                    failed
                      ? "danger"
                      : configuring
                        ? "primary"
                        : stopped || item.pending_restart
                          ? "warning"
                          : item.effective_now
                            ? "success"
                            : "neutral"
                  }
                >
                  {label}
                </StatusBadge>
              );
            },
          },
        ]}
      />
    </div>
  );
}
