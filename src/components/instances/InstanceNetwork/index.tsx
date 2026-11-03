import { DataTable } from "@/components/common";
import type { InstanceConfigurationData, InstanceRecord } from "@/api/instances";
import type { ReactNode } from "react";
import InstanceNetworkInterfaces from "../InstanceNetworkInterfaces";

type InstanceNetworkProps = {
  configuration?: InstanceConfigurationData;
  loading?: boolean;
  instance?: InstanceRecord;
  onRestart?: () => void;
  busy?: boolean;
};

export default function InstanceNetwork({
  configuration,
  loading = false,
  instance,
  onRestart,
  busy = false,
}: InstanceNetworkProps) {
  const rows: Array<{ name: string; value: ReactNode }> = [
    { name: "VPC", value: configuration?.network?.vpc_id ?? "-" },
    { name: "子网", value: configuration?.network?.subnet_id ?? "-" },
    // FIXME(instance-network-address): Pod IP 不等价于私网 IP 或访问地址；当前契约没有返回这两个字段。
    // TODO(instance-network-address): 保留字段位置，待 Governance 开放等价数据后接入。
    { name: "私网 IP", value: "-" },
    { name: "访问地址", value: "-" },
  ];
  return (
    <div className="flex flex-col gap-6">
      {instance && onRestart && (
        <InstanceNetworkInterfaces
          consumerKind="container"
          consumerId={instance.id}
          resourceVersion={instance.version}
          running={instance.observedState === "running"}
          stopped={instance.observedState === "stopped"}
          busy={busy}
          onRestart={onRestart}
        />
      )}
      <DataTable
        data={rows}
        loading={loading}
        rowKey="name"
        pagination={false}
        columns={[
          { title: "类型", dataIndex: "name", width: 160 },
          { title: "名称", width: 200, dataIndex: "value" },
        ]}
      />
    </div>
  );
}
