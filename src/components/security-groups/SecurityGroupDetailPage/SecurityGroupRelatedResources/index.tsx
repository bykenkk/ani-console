// FIXME(governance-instance-associations): 安全组关联实例仍依赖旧列表、kind 及绑定字段，保留原组件、入口和 legacy 调用。
// TODO(governance-instance-associations): 等新关联契约齐备后逐项迁移，不影响沙箱、虚拟机等未迁移实例。
import { listInstances, type InstanceRecord } from "@/api/instances/legacy";
import {
  listNetworkSecurityGroupBindings,
  type NetworkSecurityGroupBinding,
  type NetworkVPC,
} from "@/api/network";
import { StatusBadge } from "@/components/common";
import { withId } from "@/lib/id";
import { Card, Empty, List, Space, Tag, Typography } from "@arco-design/web-react";
import { useQuery } from "@tanstack/react-query";

type RelatedResource = {
  key: string;
  id: string;
  kind: "VPC" | "实例";
  name: string;
  status: string;
};

export default function SecurityGroupRelatedResources({
  securityGroupId,
  parentVpc,
  vpcLoading,
}: {
  securityGroupId: string;
  parentVpc?: NetworkVPC;
  vpcLoading: boolean;
}) {
  const bindings = useQuery({
    meta: {
      errorNotification: {
        id: withId("security-group-bindings", securityGroupId),
        action: "安全组绑定加载",
        fallback: "请求失败，请稍后重试",
      },
    },
    queryKey: ["network-security-group-bindings", securityGroupId],
    queryFn: () =>
      listNetworkSecurityGroupBindings(securityGroupId, {
        target_type: "instance",
      }),
  });
  const instances = useQuery({
    meta: {
      errorNotification: {
        id: withId("security-group-instances", securityGroupId),
        action: "关联实例加载",
        fallback: "请求失败，请稍后重试",
      },
    },
    queryKey: ["instances", "security-group-related"],
    queryFn: () => listInstances(),
  });
  const instanceById = new Map(
    ((instances.data?.items ?? []) as InstanceRecord[]).map((instance) => [instance.id, instance]),
  );
  const networkResources: RelatedResource[] = parentVpc
    ? [
        {
          key: `vpc-${parentVpc.id}`,
          id: parentVpc.id,
          kind: "VPC",
          name: parentVpc.name,
          status: parentVpc.state,
        },
      ]
    : [];
  const computeResources: RelatedResource[] = (
    (bindings.data?.items ?? []) as NetworkSecurityGroupBinding[]
  ).map((binding) => {
    const instance = instanceById.get(binding.target_id);
    return {
      key: binding.id,
      id: binding.target_id,
      kind: "实例",
      name: instance?.name ?? binding.target_id,
      status: instance?.state ?? "-",
    };
  });
  const loading = bindings.isLoading || instances.isLoading || vpcLoading;
  const renderList = (items: RelatedResource[], emptyText: string) => (
    <List<RelatedResource>
      loading={loading}
      dataSource={items}
      noDataElement={<Empty description={emptyText} />}
      render={(resource) => (
        <div className="flex w-full items-center gap-3 px-5 py-3">
          <Tag className="shrink-0">{resource.kind}</Tag>
          <span className="min-w-0 flex-1 truncate">{resource.name}</span>
          <Typography.Text className="shrink-0" type="secondary">
            {resource.id}
          </Typography.Text>
          <StatusBadge status={resource.status} />
        </div>
      )}
    />
  );

  return (
    <Space direction="vertical" size={12} className="w-full">
      <Typography.Text>
        共{" "}
        <Typography.Text bold>{networkResources.length + computeResources.length}</Typography.Text>{" "}
        个关联对象
      </Typography.Text>
      <Card title={`网络关联 ${networkResources.length}`} size="small">
        {renderList(networkResources, "暂无网络关联资源")}
      </Card>
      <Card title={`算力关联 ${computeResources.length}`} size="small">
        {renderList(computeResources, "暂无算力关联资源")}
      </Card>
    </Space>
  );
}
