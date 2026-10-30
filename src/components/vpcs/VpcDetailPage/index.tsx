import { useVpcActions } from "@/hooks/useVpcActions";
import ResourceActionMenu from "@/components/common/ResourceActionMenu";

import { withId } from "@/lib/id";
import {
  DetailPageFrame,
  DetailPagePlaceholder,
  AliIcon,
  ResourceId,
  StatusBadge,
} from "@/components/common";
import { useBackOrFallback } from "@/hooks/useBackOrFallback";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { getNetworkVpc, type NetworkVPC } from "@/api/network";

import { formatDateTime } from "@/lib/format";
import { navigationBreadcrumbsForPath } from "@/layouts/AppLayout/navigation";
import VpcRelatedResources from "./VpcRelatedResources";
// TODO(feature-visibility): 待路由支持后恢复标签页及组件导入。
// import VpcRoutes from "./VpcRoutes";
import VpcSubnets from "./VpcSubnets";
import BindVpcEipModal from "../BindVpcEipModal";
import VpcPublicEgressStatus from "../VpcPublicEgressStatus";

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
    refetchInterval: (query) => {
      const vpc = query.state.data;
      return vpc &&
        (["pending", "provisioning", "deleting"].includes(vpc.state) ||
          vpc.public_egress?.binding_state === "reserved" ||
          ["pending", "provisioning", "deleting"].includes(vpc.public_egress?.state ?? ""))
        ? 5000
        : false;
    },
  });
  const { actions } = useVpcActions(goBack, setBindingVpc);

  if (!detail.data) return <DetailPagePlaceholder loading={detail.isLoading} />;

  const vpc = detail.data as Vpc;

  return (
    <>
      <DetailPageFrame
        breadcrumbs={[...navigationBreadcrumbsForPath("/vpcs"), { label: vpc.name }]}
        title={vpc.name}
        status={<StatusBadge status={vpc.state} reason={vpc.reason} />}
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
              { label: "创建时间", value: formatDateTime(vpc.created_at) },
              { label: "更新时间", value: formatDateTime(vpc.updated_at) },
            ],
          },
          {
            key: "public-egress",
            title: "公网 IP",
            fields: [
              { label: "绑定状态", value: <VpcPublicEgressStatus binding={vpc.public_egress} /> },
              ...(vpc.public_egress
                ? [
                    { label: "公网 IP", value: vpc.public_egress.eip_address || "分配中" },
                    { label: "EIP ID", value: <ResourceId value={vpc.public_egress.eip_id} /> },
                    {
                      label: "绑定 ID",
                      value: <ResourceId value={vpc.public_egress.binding_id} />,
                    },
                    { label: "观测时间", value: formatDateTime(vpc.public_egress.observed_at) },
                  ]
                : []),
            ],
          },
        ]}
        tabs={[
          {
            key: "subnets",
            label: "子网",
            content: <VpcSubnets vpcId={vpcId} />,
          },
          // TODO(feature-visibility): 待路由支持后恢复此标签页入口。
          // {
          //   key: "routes",
          //   label: "路由",
          //   content: <VpcRoutes vpcId={vpcId} />,
          // },
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
