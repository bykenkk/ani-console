import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { getNetworkVnic } from "@/api/network";
import {
  AliIcon,
  DetailPageFrame,
  DetailPagePlaceholder,
  ResourceId,
  StatusBadge,
} from "@/components/common";
import ResourceActionMenu from "@/components/common/ResourceActionMenu";
import { useVnicActions } from "@/hooks/useVnicActions";
import { formatDateTime } from "@/lib/format";
import { withId } from "@/lib/id";
import { navigationBreadcrumbsForPath } from "@/layouts/AppLayout/navigation";
import RelatedResources from "./RelatedResources";

type VnicDetailPageProps = { vnicId: string };
export default function VnicDetailPage({ vnicId }: VnicDetailPageProps) {
  const navigate = useNavigate();
  const detail = useQuery({
    queryKey: ["network-vnic", vnicId],
    queryFn: ({ signal }) => getNetworkVnic(vnicId, signal),
    meta: { errorNotification: { id: withId("vnic", vnicId), action: "虚拟网卡加载" } },
  });
  const { actions, dialogNode } = useVnicActions(() => navigate({ to: "/vnics" }));
  if (!detail.data) return <DetailPagePlaceholder loading={detail.isLoading} />;
  const vnic = detail.data;
  return (
    <>
      <DetailPageFrame
        breadcrumbs={[...navigationBreadcrumbsForPath("/vnics"), { label: vnic.name }]}
        title={vnic.name}
        icon={<AliIcon name="wangluo" size={28} />}
        status={<StatusBadge status={vnic.state} reason={vnic.reason} />}
        headerItems={[{ label: "私网 IP", value: vnic.ips?.join(" · ") || vnic.primary_ip || "-" }]}
        actions={<ResourceActionMenu record={vnic} actions={actions} />}
        cards={[
          {
            key: "basic",
            title: "基本信息",
            fields: [
              { label: "ID", value: <ResourceId value={vnic.id} /> },
              { label: "描述", value: vnic.description || "-" },
              {
                label: "VPC",
                value: vnic.vpc_name || vnic.vpc_id,
              },
              {
                label: "子网",
                value: vnic.subnet_name || vnic.subnet_id,
              },
              { label: "MAC 地址", value: vnic.mac_address || "-" },
              { label: "指定私网 IP", value: vnic.requested_ip || "自动分配" },
              { label: "指定 MAC 地址", value: vnic.requested_mac || "自动分配" },
              {
                label: "安全组",
                value: vnic.security_group_ids.length
                  ? vnic.security_group_ids.map((id, index) => (
                      <div key={id}>{vnic.security_group_names?.[index] || id}</div>
                    ))
                  : "-",
              },
              { label: "创建时间", value: formatDateTime(vnic.created_at) },
            ],
          },
        ]}
        tabs={[
          {
            key: "bindings",
            label: "关联资源",
            content: <RelatedResources bindings={vnic.bindings ?? []} />,
          },
        ]}
        onBack={() => navigate({ to: "/vnics" })}
      />
      {dialogNode}
    </>
  );
}
