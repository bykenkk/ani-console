import { DataTable, ResourceIdentity } from "@/components/common";
import type { NetworkVnicBinding } from "@/api/network";
import { Tag } from "@arco-design/web-react";

type AssociatedInstancesProps = { bindings: NetworkVnicBinding[] };
export default function AssociatedInstances({ bindings }: AssociatedInstancesProps) {
  return (
    <DataTable
      header={{ title: "实例" }}
      data={bindings}
      rowKey="binding_id"
      pagination={false}
      tableLabel="虚拟网卡关联实例"
      columns={[
        {
          title: "名称 / ID",
          width: 200,
          ellipsis: true,
          fixed: "left",
          render: (_, item) => (
            <ResourceIdentity
              name={item.consumer_name || "-"}
              id={item.consumer_id}
              openable={false}
            />
          ),
        },
        {
          title: "类型",
          width: 120,
          render: (_, item) => <Tag>{item.consumer_kind === "vm" ? "云主机" : "容器实例"}</Tag>,
        },
      ]}
    />
  );
}
