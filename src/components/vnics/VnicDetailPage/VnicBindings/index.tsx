import { Link } from "@tanstack/react-router";
import { DataTable } from "@/components/common";
import type { NetworkVnicBinding } from "@/api/network";
import UnbindVnicButton from "./UnbindVnicButton";

type VnicBindingsProps = { bindings: NetworkVnicBinding[] };
export default function VnicBindings({ bindings }: VnicBindingsProps) {
  return (
    <DataTable
      data={bindings}
      rowKey="binding_id"
      pagination={false}
      tableLabel="虚拟网卡绑定关系"
      columns={[
        {
          title: "实例类型",
          width: 120,
          render: (_, item) => (item.consumer_kind === "vm" ? "云主机" : "容器"),
        },
        {
          title: "实例",
          width: 280,
          render: (_, item) => (
            <div>
              <Link
                to={
                  item.consumer_kind === "vm"
                    ? "/vms/$instanceId"
                    : item.compute_type === "gpu"
                      ? "/gpu-containers/$instanceId"
                      : "/containers/$instanceId"
                }
                params={{ instanceId: item.consumer_id }}
              >
                {item.consumer_name || item.consumer_id}
              </Link>
              <div>{item.consumer_name ? item.consumer_id : ""}</div>
            </div>
          ),
        },
        { title: "网卡槽位", dataIndex: "slot", width: 120 },
        {
          title: "用途",
          width: 200,
          render: (_, item) =>
            [item.current ? "当前使用" : "", item.target ? "目标预留" : ""]
              .filter(Boolean)
              .join(" / ") || "-",
        },
        { title: "目标版本", dataIndex: "requested_revision", width: 120 },
        { title: "已应用版本", dataIndex: "applied_revision", width: 120 },
        { title: "配置操作", width: 130, render: (_, item) => <UnbindVnicButton binding={item} /> },
      ]}
    />
  );
}
