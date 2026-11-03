import { Button, Modal } from "@arco-design/web-react";
import { useState } from "react";
import SaveLoadBalancerBackendModal from "../../SaveLoadBalancerBackendModal";
import { loadBalancerListeners } from "@/lib/load-balancers";
import type {
  NetworkLoadBalancer,
  NetworkLoadBalancerBackend,
  NetworkLoadBalancerBackendInput,
} from "@/api/network";
import { DataTable, StatusBadge } from "@/components/common";

type LoadBalancerBackendsProps = {
  item: NetworkLoadBalancer;
  pending: boolean;
  onSave: (
    listenerId: string,
    backends: NetworkLoadBalancerBackendInput[],
    channel?: "message" | "notification",
  ) => Promise<void>;
};

export default function LoadBalancerBackends({ item, pending, onSave }: LoadBalancerBackendsProps) {
  const listeners = loadBalancerListeners(item);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<NetworkLoadBalancerBackend & { listenerId: string }>();
  const disabled =
    pending || !item.version || item.state === "deleting" || item.state === "deleted";
  const backends = listeners.flatMap((listener) =>
    (listener.backends ?? []).map((backend) => ({
      ...backend,
      listenerId: listener.id,
      listenerName: listener.name || listener.id,
      rowId: listener.id + ":" + backend.id,
    })),
  );
  return (
    <div className="flex flex-col gap-3">
      <Button
        type="primary"
        disabled={disabled || !listeners.some((listener) => !listener.https_redirect_status_code)}
        onClick={() => setAdding(true)}
      >
        添加后端成员
      </Button>
      <DataTable<
        NetworkLoadBalancerBackend & { listenerId: string; listenerName: string; rowId: string }
      >
        columns={[
          { title: "监听器", width: 200, dataIndex: "listenerName", ellipsis: true },
          { title: "成员 ID", width: 280, dataIndex: "id", ellipsis: true },
          { title: "地址", width: 180, dataIndex: "address" },
          { title: "端口", width: 100, dataIndex: "port" },
          { title: "权重", width: 100, dataIndex: "weight" },
          { title: "子网", width: 200, dataIndex: "subnet_id", ellipsis: true },
          {
            title: "状态",
            width: 120,
            render: (_, row) => <StatusBadge status={row.state} reason={row.reason} />,
          },
        ]}
        rowActions={[
          { key: "edit", label: "编辑", disabled: () => disabled, onClick: setEditing },
          {
            key: "delete",
            label: "移除",
            intent: "danger",
            disabled: () => disabled,
            onClick: (backend) => {
              Modal.confirm({
                title: "移除后端成员",
                content: `确认从监听器“${backend.listenerName}”移除 ${backend.address}:${backend.port}？移除最后一个成员后，该监听器将等待后端成员。`,
                okText: "移除",
                okButtonProps: { status: "danger" },
                onOk: () =>
                  onSave(
                    backend.listenerId,
                    backends.filter(
                      (current) =>
                        current.listenerId === backend.listenerId && current.id !== backend.id,
                    ),
                    "notification",
                  ),
              });
            },
          },
        ]}
        data={backends}
        rowKey="rowId"
        pagination={false}
      />
      {adding && (
        <SaveLoadBalancerBackendModal
          vpcId={item.vpc_id}
          listeners={listeners}
          pending={pending}
          onCancel={() => setAdding(false)}
          onSave={async (backend, listenerId) => {
            if (!listenerId) return;
            const listener = listeners.find((current) => current.id === listenerId);
            if (!listener) throw new Error("监听器已变化，请刷新后重试");
            await onSave(listenerId, [...(listener.backends ?? []), backend]);
            setAdding(false);
          }}
        />
      )}
      {editing && (
        <SaveLoadBalancerBackendModal
          vpcId={item.vpc_id}
          backend={editing}
          pending={pending}
          onCancel={() => setEditing(undefined)}
          onSave={async (backend) => {
            const listener = listeners.find((current) => current.id === editing.listenerId);
            if (!listener) throw new Error("监听器已变化，请刷新后重试");
            await onSave(
              editing.listenerId,
              (listener.backends ?? []).map((current) =>
                current.id === editing.id ? backend : current,
              ),
            );
            setEditing(undefined);
          }}
        />
      )}
    </div>
  );
}
