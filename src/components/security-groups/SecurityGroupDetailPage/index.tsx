import { useSecurityGroupActions } from "@/hooks/useSecurityGroupActions";
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

import { getNetworkSecurityGroup, type NetworkSecurityGroup } from "@/api/network";

import { formatDateTime } from "@/lib/format";
import { navigationBreadcrumbsForPath } from "@/layouts/AppLayout/navigation";
import SecurityGroupRelatedResources from "./SecurityGroupRelatedResources";
import SecurityGroupRules from "./SecurityGroupRules";

type SecurityGroupDetailPageProps = {
  securityGroupId: string;
  tab?: string;
  onTabChange: (tab: string) => void;
};

type SecurityGroup = NetworkSecurityGroup;

export default function SecurityGroupDetailPage({
  securityGroupId,
  tab,
  onTabChange,
}: SecurityGroupDetailPageProps) {
  const goBack = useBackOrFallback("security-group");
  const detail = useQuery({
    meta: {
      errorNotification: {
        id: withId("security-group", securityGroupId),
        action: `安全组加载`,
        fallback: "请求失败，请稍后重试",
      },
    },
    queryKey: ["network-security-group", securityGroupId],
    queryFn: () => getNetworkSecurityGroup(securityGroupId),
  });
  const { actions } = useSecurityGroupActions(goBack);

  if (!detail.data) return <DetailPagePlaceholder loading={detail.isLoading} />;

  const securityGroup = detail.data as SecurityGroup;
  return (
    <>
      <DetailPageFrame
        breadcrumbs={[
          ...navigationBreadcrumbsForPath("/security-groups"),
          { label: securityGroup.name },
        ]}
        title={securityGroup.name}
        status={<StatusBadge status={securityGroup.state} />}
        icon={<AliIcon name="anquanzu" size={28} />}
        headerItems={[{ label: "关联资源", value: securityGroup.bound_resource_count }]}
        actions={<ResourceActionMenu record={securityGroup} actions={actions} />}
        cards={[
          {
            key: "basic",
            title: "基本信息",
            fields: [
              { label: "ID", value: <ResourceId value={securityGroup.id} /> },
              { label: "配置版本", value: securityGroup.version },
              { label: "状态原因", value: securityGroup.reason || "-" },
              { label: "最近观测", value: formatDateTime(securityGroup.observed_at) },
              { label: "描述", value: securityGroup.description || "-" },
              {
                label: "创建时间",
                value: formatDateTime(securityGroup.created_at),
              },
              {
                label: "更新时间",
                value: formatDateTime(securityGroup.updated_at),
              },
            ],
          },
        ]}
        tabs={[
          {
            key: "ingress",
            label: "入站规则",
            content: <SecurityGroupRules securityGroupId={securityGroupId} direction="ingress" />,
          },
          {
            key: "egress",
            label: "出站规则",
            content: <SecurityGroupRules securityGroupId={securityGroupId} direction="egress" />,
          },
          {
            key: "related",
            label: "关联资源",
            content: <SecurityGroupRelatedResources securityGroupId={securityGroupId} />,
          },
        ]}
        activeTabKey={tab}
        onTabChange={onTabChange}
        onBack={goBack}
      />
    </>
  );
}
