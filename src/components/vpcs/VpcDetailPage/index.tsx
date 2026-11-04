import NetworkResourceStatus from "@/components/network/NetworkResourceStatus";
import { useVpcActions } from "@/hooks/useVpcActions";
import ResourceActionMenu from "@/components/common/ResourceActionMenu";

import { withId } from "@/lib/id";
import { DetailPageFrame, DetailPagePlaceholder, AliIcon, ResourceId } from "@/components/common";
import { useBackOrFallback } from "@/hooks/useBackOrFallback";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { getNetworkVpc, type NetworkVPC } from "@/api/network";

import { formatDateTime } from "@/lib/format";
import { navigationBreadcrumbsForPath } from "@/layouts/AppLayout/navigation";
import VpcRelatedResources from "./VpcRelatedResources";
import VpcSubnets from "./VpcSubnets";
import BindVpcEipModal from "../BindVpcEipModal";
import VpcPublicEgressStatus from "../VpcPublicEgressStatus";
import VpcBaseConnectivityStatus from "../VpcBaseConnectivityStatus";

type VpcDetailPageProps = {
  vpcId: string;
  tab?: string;
  onTabChange: (tab: string) => void;
};

type Vpc = NetworkVPC;

export default function VpcDetailPage({ vpcId, tab, onTabChange }: VpcDetailPageProps) {
  const goBack = useBackOrFallback("vpc");
  const [bindingVpc, setBindingVpc] = useState<Vpc>();
  const detail = useQuery({
    meta: {
      errorNotification: {
        id: withId("vpc", vpcId),
        action: `VPC 加载`,
        fallback: "请求失败，请稍后重试",
      },
    },
    queryKey: ["network-vpc", vpcId],
    queryFn: () => getNetworkVpc(vpcId),
  });
  const { actions } = useVpcActions(goBack, setBindingVpc);

  if (!detail.data) return <DetailPagePlaceholder loading={detail.isLoading} />;

  const vpc = detail.data as Vpc;

  return (
    <>
      <DetailPageFrame
        breadcrumbs={[...navigationBreadcrumbsForPath("/vpcs"), { label: vpc.name }]}
        title={vpc.name}
        status={<NetworkResourceStatus resource={vpc} />}
        icon={<AliIcon name="VPCwangluo" size={28} />}
        headerItems={[{ label: "CIDR", value: vpc.cidr }]}
        actions={<ResourceActionMenu record={vpc} actions={actions} />}
        cards={[
          {
            key: "basic",
            title: "基本信息",
            fields: [
              { label: "ID", value: <ResourceId value={vpc.id} /> },
              { label: "CIDR", value: vpc.cidr },
              {
                label: "基础网络",
                value: <VpcBaseConnectivityStatus connectivity={vpc.base_connectivity} />,
              },
              { label: "公网 IP", value: <VpcPublicEgressStatus binding={vpc.public_egress} /> },
              ...(vpc.public_egress
                ? [
                    { label: "EIP ID", value: <ResourceId value={vpc.public_egress.eip_id} /> },
                    {
                      label: "绑定 ID",
                      value: <ResourceId value={vpc.public_egress.binding_id} />,
                    },
                    {
                      label: "公网 IP 观测时间",
                      value: formatDateTime(vpc.public_egress.observed_at),
                    },
                  ]
                : []),
              { label: "创建时间", value: formatDateTime(vpc.created_at) },
              { label: "更新时间", value: formatDateTime(vpc.updated_at) },
            ],
          },
        ]}
        tabs={[
          {
            key: "subnets",
            label: "子网",
            content: <VpcSubnets vpcId={vpcId} />,
          },
          {
            key: "related",
            label: "关联资源",
            content: <VpcRelatedResources vpcId={vpcId} />,
          },
        ]}
        activeTabKey={tab}
        onTabChange={onTabChange}
        onBack={goBack}
      />
      {bindingVpc && (
        <BindVpcEipModal
          vpc={bindingVpc}
          onCancel={() => setBindingVpc(undefined)}
          onSubmitted={() => setBindingVpc(undefined)}
        />
      )}
    </>
  );
}
