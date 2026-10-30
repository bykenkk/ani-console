import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { listNetworkSecurityGroups, type NetworkSecurityGroup } from "@/api/network";
import { useListPagination } from "@/hooks/useListPagination";
import { useSecurityGroupActions } from "@/hooks/useSecurityGroupActions";
import {
  ResourceNameId,
  ListPageFrame,
  ListDataTable,
  StatusBadge,
  type ListColumn,
} from "@/components/common";
import { formatDateTime } from "@/lib/format";
import CreateSecurityGroupModal from "../CreateSecurityGroupModal";

export default function SecurityGroupsPage() {
  const [creating, setCreating] = useState(false);
  const [state, setState] = useState("");
  const [name, setName] = useState("");
  const paging = useListPagination(JSON.stringify({ state, name }), 20);
  const groups = useQuery({
    queryKey: [
      "network-security-groups",
      { page: paging.page, pageSize: paging.pageSize, state, name },
    ],
    queryFn: ({ signal }) =>
      listNetworkSecurityGroups(
        {
          page: paging.page,
          pageSize: paging.pageSize,
          state: state || undefined,
          name: name.trim() || undefined,
        },
        signal,
      ),
    meta: { errorNotification: { id: "security-groups", action: "安全组列表加载" } },
  });
  const { actions } = useSecurityGroupActions(paging.resetPagination, paging.resetPagination);
  const columns: ListColumn<NetworkSecurityGroup>[] = [
    {
      key: "name",
      title: "名称 / ID",
      width: 220,
      fixed: "left",
      render: (_, item) => <ResourceNameId name={item.name} id={item.id} type="security-group" />,
    },
    {
      key: "state",
      title: "状态",
      width: 130,
      render: (_, item) => <StatusBadge status={item.state} reason={item.reason} />,
    },
    { key: "rules", title: "规则数", width: 100, render: (_, item) => item.rules.length },
    { key: "bindings", title: "关联资源", width: 100, dataIndex: "bound_resource_count" },
    { key: "description", title: "描述", width: 220, dataIndex: "description", ellipsis: true },
    {
      key: "createdAt",
      title: "创建时间",
      width: 180,
      render: (_, item) => formatDateTime(item.created_at),
    },
  ];
  return (
    <>
      <ListPageFrame
        header={{
          iconClassName: "icon-anquanzu",
          title: "安全组",
          subtitle: "通过入站和出站规则控制容器、云主机与公网 IP 的网络访问",
          actions: [
            {
              key: "create",
              label: "创建安全组",
              iconClassName: "icon-add-1",
              variant: "primary",
              onClick: () => setCreating(true),
            },
          ],
        }}
        tabs={{
          value: state,
          onChange: setState,
          items: [
            { value: "", label: "全部" },
            { value: "available", label: "可用" },
            { value: "provisioning", label: "创建中" },
            { value: "failed", label: "异常" },
          ],
        }}
        toolbar={{
          search: {
            fields: [{ value: "name", label: "名称" }],
            field: "name",
            value: name,
            onFieldChange: () => {},
            onChange: setName,
          },
          refresh: { label: "刷新", spinning: groups.isFetching, onClick: () => groups.refetch() },
        }}
      >
        <ListDataTable
          data={groups.data?.items ?? []}
          columns={columns}
          rowActions={actions}
          loading={groups.isLoading}
          tableLabel="安全组列表"
          pagination={{
            page: paging.page,
            pageSize: paging.pageSize,
            total: Number(groups.data?.total ?? "0"),
            onPageChange: paging.setPage,
            onPageSizeChange: paging.setPageSize,
          }}
        />
      </ListPageFrame>
      {creating && <CreateSecurityGroupModal onCancel={() => setCreating(false)} />}
    </>
  );
}
