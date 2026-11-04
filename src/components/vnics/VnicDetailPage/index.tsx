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
import VnicBindings from "./VnicBindings";
import { useState } from "react";
import BindVnicModal from "../BindVnicModal";

type VnicDetailPageProps = { vnicId: string };
export default function VnicDetailPage({ vnicId }: VnicDetailPageProps) {
  const navigate = useNavigate();
  const [binding, setBinding] = useState(false);
  const detail = useQuery({
    queryKey: ["network-vnic", vnicId],
    queryFn: ({ signal }) => getNetworkVnic(vnicId, signal),
    meta: { errorNotification: { id: withId("vnic", vnicId), action: "虚拟网卡加载" } },
  });
  const { actions } = useVnicActions(() => navigate({ to: "/vnics" }));
  if (!detail.data) return <DetailPagePlaceholder loading={detail.isLoading} />;
  const vnic = detail.data;
  return (
    <>
      <DetailPageFrame
        breadcrumbs={[...navigationBreadcrumbsForPath("/vnics"), { label: vnic.name }]}
        title={vnic.name}
        icon={<AliIcon name="wangluo" size={28} />}
        status={<StatusBadge status={vnic.state} reason={vnic.reason} />}
        headerItems={[
          { label: "实际 MAC", value: vnic.mac_address || "-" },
          { label: "实际 IP", value: vnic.ips?.join(" · ") || vnic.primary_ip || "-" },
        ]}
        actions={
          <ResourceActionMenu
            record={vnic}
            actions={[
              { key: "refresh", label: "刷新", onClick: () => detail.refetch() },
              {
                key: "bind",
                label: "绑定实例",
                disabled: (item) => item.state === "deleting" || item.state === "deleted",
                onClick: () => setBinding(true),
              },
              ...actions,
            ]}
          />
        }
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
              { label: "创建时间", value: formatDateTime(vnic.created_at) },
            ],
          },
          {
            key: "observation",
            title: "分配与观察",
            fields: [
              { label: "申请 IP 地址", value: vnic.requested_ip || "自动分配" },
              { label: "申请 MAC 地址", value: vnic.requested_mac || "自动分配" },
              { label: "实际 IP 地址", value: vnic.ips?.join(" · ") || vnic.primary_ip || "-" },
              { label: "实际 MAC 地址", value: vnic.mac_address || "-" },
              {
                label: "使用状态",
                value: vnic.bindings?.length
                  ? "使用或预留中"
                  : vnic.state === "available"
                    ? "空闲"
                    : "未就绪",
              },
              {
                label: "观察状态",
                value: vnic.observation_stale ? "观察待确认" : vnic.reason || "-",
              },
              { label: "原因", value: vnic.reason || "-" },
              { label: "最近确认", value: formatDateTime(vnic.observed_at) },
            ],
          },
          {
            key: "security-groups",
            title: "安全组（只读）",
            fields: [
              {
                label: vnic.bindings?.length ? "继承实例配置" : "保留上次配置",
                value: vnic.security_group_ids?.length
                  ? vnic.security_group_ids.map((id, index) => (
                      <div key={id}>{vnic.security_group_names?.[index] || id}</div>
                    ))
                  : "-",
              },
            ],
          },
        ]}
        tabs={[
          {
            key: "bindings",
            label: "绑定关系",
            content: <VnicBindings bindings={vnic.bindings ?? []} />,
          },
        ]}
        onBack={() => navigate({ to: "/vnics" })}
      />
      {binding && <BindVnicModal vnic={vnic} onCancel={() => setBinding(false)} />}
    </>
  );
}
