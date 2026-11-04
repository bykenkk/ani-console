import { Tag } from "@arco-design/web-react";
import NetworkResourceStatus from "@/components/network/NetworkResourceStatus";
import { useSubnetActions } from "@/hooks/useSubnetActions";
import ResourceActionMenu from "@/components/common/ResourceActionMenu";

import {
  getNetworkSubnet,
  getNetworkVpc,
  type NetworkSubnet,
  type NetworkVPC,
} from "@/api/network";
import { AliIcon, DetailPageFrame, DetailPagePlaceholder, ResourceId } from "@/components/common";
import { withId } from "@/lib/id";

import { useQuery } from "@tanstack/react-query";
import { useBackOrFallback } from "@/hooks/useBackOrFallback";

import { formatDateTime } from "@/lib/format";
import { navigationBreadcrumbsForPath } from "@/layouts/AppLayout/navigation";

type Subnet = NetworkSubnet;
type Vpc = NetworkVPC;
import SubnetRelatedResources from "./SubnetRelatedResources";

type SubnetDetailPageProps = {
  subnetId: string;
  tab?: string;
  onTabChange: (tab: string) => void;
};

export default function SubnetDetailPage({ subnetId, tab, onTabChange }: SubnetDetailPageProps) {
  const goBack = useBackOrFallback("subnet");
  const detail = useQuery({
    meta: {
      errorNotification: {
        id: withId("subnet", subnetId),
        action: `子网加载`,
        fallback: "请求失败，请稍后重试",
      },
    },
    queryKey: ["network-subnet", subnetId],
    queryFn: () => getNetworkSubnet(subnetId),
  });
  const vpc = useQuery({
    meta: {
      errorNotification: {
        id: withId("subnet-vpc", subnetId),
        action: `VPC 加载`,
        fallback: "请求失败，请稍后重试",
      },
    },
    queryKey: ["network-vpc", detail.data?.vpc_id],
    queryFn: () => getNetworkVpc(detail.data!.vpc_id),
    enabled: Boolean(detail.data?.vpc_id),
  });
  const { actions } = useSubnetActions(goBack);

  if (!detail.data) return <DetailPagePlaceholder loading={detail.isLoading} />;

  const subnet = detail.data as Subnet;
  const parentVpc = vpc.data as Vpc | undefined;

  return (
    <DetailPageFrame
      breadcrumbs={[...navigationBreadcrumbsForPath("/subnets"), { label: subnet.name }]}
      title={subnet.name}
      status={
        <div className="flex items-center gap-2">
          <NetworkResourceStatus resource={subnet} />
          {subnet.owner_scope === "platform" && <Tag color="arcoblue">平台基础网络</Tag>}
        </div>
      }
      icon={<AliIcon name="VPCwangluo" size={28} />}
      headerItems={[{ label: "CIDR", value: subnet.cidr || "-" }]}
      actions={<ResourceActionMenu record={subnet} actions={actions} />}
      cards={[
        {
          key: "basic",
          title: "基本信息",
          fields: [
            { label: "ID", value: <ResourceId value={subnet.id} /> },
            {
              label: "VPC",
              value:
                parentVpc?.name ??
                (vpc.isLoading ? "加载中…" : <ResourceId value={subnet.vpc_id} />),
            },
            { label: "CIDR", value: subnet.cidr || "-" },
            { label: "网关", value: subnet.gateway || "-" },
            { label: "排除 IP", value: subnet.exclude_ips?.join(" · ") || "-" },
            { label: "DHCP", value: subnet.enable_dhcp ? "已开启" : "已关闭" },
            { label: "DNS 服务器", value: subnet.dns_servers?.join(" · ") || "-" },
            { label: "创建时间", value: formatDateTime(subnet.created_at) },
            { label: "更新时间", value: formatDateTime(subnet.updated_at) },
          ],
        },
      ]}
      tabs={[
        {
          key: "related",
          label: "关联资源",
          content: <SubnetRelatedResources subnetId={subnetId} />,
        },
      ]}
      activeTabKey={tab}
      onTabChange={onTabChange}
      onBack={goBack}
    />
  );
}
