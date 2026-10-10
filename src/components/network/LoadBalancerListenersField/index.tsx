import { Button, Modal, Space } from "@arco-design/web-react";
import { IconPlus } from "@arco-design/web-react/icon";
import { useState } from "react";
import type { LoadBalancerListenerValues } from "@/components/network/LoadBalancerListenerForm";
import AddLoadBalancerListenerModal from "@/components/network/AddLoadBalancerListenerModal";

import { DataTable } from "@/components/common/DataTable";
import EditLoadBalancerListenerModal from "@/components/network/EditLoadBalancerListenerModal";

export default function LoadBalancerListenersField({
  value = [],
  onChange,
  disabled,
}: {
  value?: LoadBalancerListenerValues[];
  onChange?: (value: LoadBalancerListenerValues[]) => void;
  disabled?: boolean;
}) {
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<LoadBalancerListenerValues>();
  return (
    <>
      <Space direction="vertical" className="w-full">
        {value.length > 0 && (
          <DataTable<LoadBalancerListenerValues>
            pagination={false}
            rowKey="port"
            data={value}
            tableLabel="监听器列表"
            rowActions={[
              {
                key: "edit",
                label: "编辑",
                disabled: () => !!disabled,
                onClick: (item) => setEditing(item),
              },
              {
                key: "delete",
                label: "删除",
                intent: "danger",
                disabled: () => !!disabled,
                onClick: (item) => {
                  Modal.confirm({
                    title: "删除监听器",
                    content: `确认删除监听器“${item.name}”（端口 ${item.port}）？`,
                    okText: "删除",
                    okButtonProps: { status: "danger" },
                    onOk: () => onChange?.(value.filter((current) => current.port !== item.port)),
                  });
                },
              },
            ]}
            columns={[
              { title: "名称", dataIndex: "name", ellipsis: true, width: 200 },
              {
                title: "协议",
                dataIndex: "protocol",
                width: 100,
                render: (protocol: string) => protocol.toUpperCase(),
              },
              { title: "监听端口", dataIndex: "port", width: 120 },
              { title: "目标端口", dataIndex: "target_port", width: 120 },
            ]}
          />
        )}
        <Button
          long
          type="dashed"
          icon={<IconPlus />}
          disabled={disabled}
          onClick={() => setAdding(true)}
        >
          添加监听器
        </Button>
      </Space>
      {adding && (
        <AddLoadBalancerListenerModal
          usedPorts={value.map((item) => item.port)}
          onCancel={() => setAdding(false)}
          onAdd={(listener) => {
            onChange?.([...value, listener]);
            setAdding(false);
          }}
        />
      )}
      {editing && (
        <EditLoadBalancerListenerModal
          listener={editing}
          usedPorts={value.filter((item) => item.port !== editing.port).map((item) => item.port)}
          onCancel={() => setEditing(undefined)}
          onSave={(listener) => {
            onChange?.(value.map((item) => (item.port === editing.port ? listener : item)));
            setEditing(undefined);
          }}
        />
      )}
    </>
  );
}
