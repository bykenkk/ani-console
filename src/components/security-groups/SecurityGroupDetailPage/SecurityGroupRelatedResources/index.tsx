import { useState } from "react";
import { Select, Space, Typography } from "@arco-design/web-react";
import { useQuery } from "@tanstack/react-query";
import {
  listNetworkSecurityGroupBindings,
  type NetworkSecurityGroupBinding,
  type NetworkSecurityGroupBindingTargetType,
} from "@/api/network";
import { DataTable, StatusBadge } from "@/components/common";
import { useListPagination } from "@/hooks/useListPagination";
import { withId } from "@/lib/id";
import { formatDateTime } from "@/lib/format";

type SecurityGroupRelatedResourcesProps = { securityGroupId: string };
const TYPES = { container: "容器", vm: "云主机", eip: "公网 IP" };
export default function SecurityGroupRelatedResources({
  securityGroupId,
}: SecurityGroupRelatedResourcesProps) {
  const [targetType, setTargetType] = useState<NetworkSecurityGroupBindingTargetType>();
  const paging = useListPagination(`${securityGroupId}:${targetType ?? ""}`, 20);
  const bindings = useQuery({
    queryKey: [
      "network-security-group-bindings",
      securityGroupId,
      { targetType, page: paging.page, pageSize: paging.pageSize },
    ],
    queryFn: ({ signal }) =>
      listNetworkSecurityGroupBindings(
        securityGroupId,
        { target_type: targetType, page: paging.page, pageSize: paging.pageSize },
        signal,
      ),
    meta: {
      errorNotification: {
        id: withId("security-group-bindings", securityGroupId),
        action: "安全组绑定加载",
      },
    },
  });
  return (
    <Space direction="vertical" size={12} className="w-full">
      <div className="flex items-center justify-between">
        <Typography.Text>共 {bindings.data?.total ?? "0"} 个关联对象</Typography.Text>
        <Select
          allowClear
          placeholder="全部资源类型"
          value={targetType}
          onChange={setTargetType}
          style={{ width: 160 }}
          options={Object.entries(TYPES).map(([value, label]) => ({ value, label }))}
        />
      </div>
      <DataTable<NetworkSecurityGroupBinding>
        rowKey={(item) => `${item.target_type}:${item.target_id}`}
        loading={bindings.isLoading}
        data={bindings.data?.items ?? []}
        columns={[
          { title: "类型", width: 110, render: (_, item) => TYPES[item.target_type] },
          { title: "资源 ID", dataIndex: "target_id", width: 240 },
          {
            title: "绑定状态",
            width: 140,
            render: (_, item) => <StatusBadge status={item.state} reason={item.reason} />,
          },
          {
            title: "期望安全组",
            width: 240,
            render: (_, item) => item.security_group_ids.join(" · ") || "-",
          },
          {
            title: "已应用安全组",
            width: 240,
            render: (_, item) => item.applied_security_group_ids.join(" · ") || "-",
          },
          { title: "状态原因", dataIndex: "reason", width: 200 },
          { title: "最近观测", width: 180, render: (_, item) => formatDateTime(item.observed_at) },
        ]}
        pagination={{
          page: paging.page,
          pageSize: paging.pageSize,
          total: Number(bindings.data?.total ?? "0"),
          onPageChange: paging.setPage,
          onPageSizeChange: paging.setPageSize,
        }}
      />
    </Space>
  );
}
