import { useState } from "react";
import { Button, Select } from "@arco-design/web-react";
import { IconRefresh } from "@arco-design/web-react/icon";
import { useQuery } from "@tanstack/react-query";
import {
  listNetworkSecurityGroupBindings,
  type NetworkSecurityGroupBinding,
  type NetworkSecurityGroupBindingTargetType,
} from "@/api/network";
import { DataTable, ResourceId, StatusBadge } from "@/components/common";
import { useListPagination } from "@/hooks/useListPagination";
import { withId } from "@/lib/id";

type RelatedResourcesProps = { securityGroupId: string };
const TYPES = { container: "容器实例", vm: "云主机", eip: "公网 IP", vnic: "虚拟网卡" };
const APPLICATION_STATES: Record<string, string> = {
  unbound: "未配置",
  applying: "应用中",
  waiting_for_binding: "待绑定资源",
  configured: "已配置",
  applied: "已应用",
  released: "已解除",
  degraded: "应用异常",
  failed: "应用失败",
};
export default function RelatedResources({ securityGroupId }: RelatedResourcesProps) {
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
    <DataTable<NetworkSecurityGroupBinding>
      header={{
        title: "关联资源",
        extra: (
          <div className="flex items-center gap-2">
            <Select
              allowClear
              aria-label="资源类型筛选"
              placeholder="全部资源类型"
              value={targetType}
              onChange={setTargetType}
              style={{ width: 160 }}
              options={Object.entries(TYPES).map(([value, label]) => ({ value, label }))}
            />
            <Button
              icon={<IconRefresh />}
              loading={bindings.isFetching}
              onClick={() => bindings.refetch()}
              title="刷新"
              aria-label="刷新"
            />
          </div>
        ),
      }}
      tableLabel="安全组关联资源"
      rowKey={(item) => `${item.target_type}:${item.target_id}`}
      loading={bindings.isFetching}
      data={bindings.data?.items ?? []}
      columns={[
        {
          title: "资源 ID",
          width: 240,
          fixed: "left",
          ellipsis: true,
          render: (_, item) => <ResourceId value={item.target_id} />,
        },
        { title: "资源类型", width: 120, render: (_, item) => TYPES[item.target_type] },
        {
          title: "应用状态",
          width: 120,
          render: (_, item) => (
            <StatusBadge
              status={item.state}
              title={item.reason || undefined}
              loading={item.state === "applying"}
              tone={
                item.state === "configured" || item.state === "applied"
                  ? "success"
                  : item.state === "applying"
                    ? "primary"
                    : item.state === "waiting_for_binding"
                      ? "warning"
                      : undefined
              }
            >
              {APPLICATION_STATES[item.state] ?? item.state}
            </StatusBadge>
          ),
        },
      ]}
      pagination={{
        page: paging.page,
        pageSize: paging.pageSize,
        total: Number(bindings.data?.total ?? "0"),
        onPageChange: paging.setPage,
        onPageSizeChange: paging.setPageSize,
      }}
    />
  );
}
