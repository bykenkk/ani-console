import { Button, Modal } from "@arco-design/web-react";
import { IconPlus } from "@arco-design/web-react/icon";
import { useState } from "react";
import type { NetworkLoadBalancerBackendInput } from "@/api/network";
import { DataTable } from "@/components/common";
import SaveLoadBalancerBackendModal from "../SaveLoadBalancerBackendModal";

type LoadBalancerBackendsFieldProps = {
  vpcId: string;
  value?: NetworkLoadBalancerBackendInput[];
  onChange?: (backends: NetworkLoadBalancerBackendInput[]) => void;
};

export default function LoadBalancerBackendsField({
  vpcId,
  value = [],
  onChange,
}: LoadBalancerBackendsFieldProps) {
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<NetworkLoadBalancerBackendInput>();
  return (
    <div className="flex flex-col gap-3">
      <DataTable<NetworkLoadBalancerBackendInput>
        data={value}
        pagination={false}
        rowKey={(row) => row.id ?? `${row.subnet_id}:${row.address}:${row.port}`}
        columns={[
          { title: "地址", dataIndex: "address", width: 180 },
          { title: "端口", dataIndex: "port", width: 100 },
          { title: "权重", dataIndex: "weight", width: 100 },
          { title: "子网", dataIndex: "subnet_id", width: 200, ellipsis: true },
        ]}
        rowActions={[
          { key: "edit", label: "编辑", onClick: setEditing },
          {
            key: "delete",
            label: "移除",
            intent: "danger",
            onClick: (backend) => {
              Modal.confirm({
                title: "移除后端成员",
                content: `确认移除后端成员 ${backend.address}:${backend.port}？`,
                okText: "移除",
                okButtonProps: { status: "danger" },
                onOk: () => onChange?.(value.filter((item) => item !== backend)),
              });
            },
          },
        ]}
      />
      <Button type="dashed" icon={<IconPlus />} onClick={() => setAdding(true)}>
        添加后端成员
      </Button>
      {adding && (
        <SaveLoadBalancerBackendModal
          vpcId={vpcId}
          onCancel={() => setAdding(false)}
          onSave={(backend) => {
            onChange?.([...value, backend]);
            setAdding(false);
          }}
        />
      )}
      {editing && (
        <SaveLoadBalancerBackendModal
          vpcId={vpcId}
          backend={editing}
          onCancel={() => setEditing(undefined)}
          onSave={(backend) => {
            onChange?.(value.map((item) => (item === editing ? backend : item)));
            setEditing(undefined);
          }}
        />
      )}
    </div>
  );
}
