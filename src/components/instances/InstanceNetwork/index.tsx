// FIXME(governance-migration): Pod IP 已接新 runtime，私网 IP、VPC/子网及访问地址仍保留原字段和旧调用。
// TODO(governance-migration): 等网络关联契约齐备后迁移，沙箱、虚拟机等继续原数据及调用。
import { type InstanceRecord } from "@/api/instances/legacy";
import type { InstanceRuntime } from "@/api/instances";
import { DataTable } from "@/components/common";
import { getInstanceDisplayIp, getInstanceNetworkValue } from "@/lib/instances";

type NetworkRow = {
  type: string;
  name: string;
};

export default function InstanceNetwork({
  instance,
  runtime,
  loading = false,
}: {
  instance?: InstanceRecord;
  runtime?: InstanceRuntime;
  loading?: boolean;
}) {
  const rows: NetworkRow[] = [
    ...(runtime ? [{ type: "Pod IP", name: runtime.pod?.podIp ?? "-" }] : []),
    { type: "VPC", name: getInstanceNetworkValue(instance, "vpc_id") },
    { type: "子网", name: getInstanceNetworkValue(instance, "subnet_id") },
    { type: "私网 IP", name: getInstanceDisplayIp(instance) || "-" },
    { type: "访问地址", name: instance?.endpoint ?? "-" },
  ];

  return (
    <DataTable<NetworkRow>
      data={rows}
      loading={loading && !runtime}
      rowKey="type"
      pagination={false}
      tableLabel="实例网络信息"
      columns={[
        { title: "类型", dataIndex: "type", width: 160 },
        { title: "名称", dataIndex: "name", ellipsis: true },
      ]}
    />
  );
}
