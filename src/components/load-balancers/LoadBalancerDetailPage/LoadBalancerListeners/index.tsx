import { Button, Modal } from "@arco-design/web-react";
import { useState } from "react";
import AddLoadBalancerListenerModal from "../../AddLoadBalancerListenerModal";
import EditLoadBalancerListenerModal from "../../EditLoadBalancerListenerModal";
import type {
  NetworkLoadBalancer,
  NetworkLoadBalancerListener,
  NetworkLoadBalancerListenerResource,
} from "@/api/network";
import { DataTable, ResourceNameId, StatusBadge } from "@/components/common";
import { listenerInput, loadBalancerLabel } from "@/lib/load-balancers";
import { loadBalancerListeners } from "@/lib/load-balancers";

type LoadBalancerListenersProps = {
  item: NetworkLoadBalancer;
  pending: boolean;
  onSave: (
    listeners: NetworkLoadBalancerListener[],
    channel?: "message" | "notification",
  ) => Promise<void>;
};

export default function LoadBalancerListeners({
  item,
  pending,
  onSave,
}: LoadBalancerListenersProps) {
  const listeners = loadBalancerListeners(item);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<NetworkLoadBalancerListenerResource>();
  const disabled =
    pending || !item.version || item.state === "deleting" || item.state === "deleted";
  return (
    <div className="flex flex-col gap-3">
      <Button type="primary" disabled={disabled} onClick={() => setAdding(true)}>
        添加监听器
      </Button>
      <DataTable<NetworkLoadBalancerListenerResource>
        columns={[
          {
            title: "部署状态",
            width: 120,
            render: (_, row) => (
              <StatusBadge status={row.deployment_state} reason={row.reason}>
                {loadBalancerLabel(row.deployment_state)}
              </StatusBadge>
            ),
          },
          {
            title: "名称 / ID",
            fixed: "left",
            width: 200,
            render: (_, row) => (
              <ResourceNameId name={row.name || "-"} id={row.id} openable={false} />
            ),
          },
          {
            title: "协议",
            width: 90,
            render: (_, row) => loadBalancerLabel(row.protocol),
          },
          {
            title: "端口",
            width: 90,
            dataIndex: "port",
          },
          {
            title: "算法",
            width: 120,
            render: (_, row) => loadBalancerLabel(row.algorithm),
          },
          {
            title: "后端数",
            width: 90,
            render: (_, row) => row.backends?.length ?? 0,
          },
          {
            title: "健康检查",
            width: 110,
            render: (_, row) =>
              row.https_redirect_status_code ? "-" : loadBalancerLabel(row.health_check?.protocol),
          },
          {
            title: "会话保持",
            width: 180,
            render: (_, row) => loadBalancerLabel(row.session_persistence?.mode),
          },
          {
            title: "连接限制",
            width: 130,
            dataIndex: "max_connections",
          },
          {
            title: "gzip",
            width: 80,
            render: (_, row) => (row.gzip_enabled ? "开启" : "关闭"),
          },
          {
            title: "重定向",
            width: 90,
            render: (_, row) => row.https_redirect_status_code || "-",
          },
          {
            title: "证书",
            width: 180,
            dataIndex: "certificate_ref.name",
            ellipsis: true,
          },
        ]}
        rowActions={[
          { key: "edit", label: "编辑", disabled: () => disabled, onClick: setEditing },
          {
            key: "delete",
            label: "删除",
            intent: "danger",
            disabled: () => disabled || listeners.length <= 1,
            onClick: (listener) => {
              Modal.confirm({
                title: "删除监听器",
                content: `确认删除监听器“${listener.name}”（端口 ${listener.port}）及其后端成员？`,
                okText: "删除",
                okButtonProps: { status: "danger" },
                onOk: () =>
                  onSave(
                    listeners.filter((current) => current.id !== listener.id).map(listenerInput),
                    "notification",
                  ),
              });
            },
          },
        ]}
        data={listeners}
        rowKey="id"
        pagination={false}
        tableLabel="负载均衡监听器"
      />
      {adding && (
        <AddLoadBalancerListenerModal
          vpcId={item.vpc_id}
          pending={pending}
          usedPorts={listeners.map((listener) => listener.port)}
          onCancel={() => setAdding(false)}
          onAdd={async (listener) => {
            await onSave([...listeners.map(listenerInput), listener]);
            setAdding(false);
          }}
        />
      )}
      {editing && (
        <EditLoadBalancerListenerModal
          vpcId={item.vpc_id}
          pending={pending}
          listener={listenerInput(editing)}
          usedPorts={listeners
            .filter((listener) => listener.id !== editing.id)
            .map((listener) => listener.port)}
          onCancel={() => setEditing(undefined)}
          onSave={async (listener) => {
            await onSave(
              listeners.map((current) =>
                current.id === editing.id ? listener : listenerInput(current),
              ),
            );
            setEditing(undefined);
          }}
        />
      )}
    </div>
  );
}
