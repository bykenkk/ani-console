import CreateVpcModal from "../CreateVpcModal";
import { useVpcActions } from "@/hooks/useVpcActions";

import { useQuery, useQueryClient } from "@tanstack/react-query";

import { useMemo, useState } from "react";
import {
  listNetworkRoutes,
  listNetworkSubnets,
  listNetworkVpcs,
  type NetworkRoute,
  type NetworkSubnet,
  type NetworkVPC,
} from "@/api/network";

import {
  ResourceNameId,
  ListPageFrame,
  type ListColumn,
  StatusBadge,
  ListDataTable,
} from "@/components/common";
import { formatDateTime } from "@/lib/format";
import { useCursorPaginatedQuery } from "@/hooks/useCursorPaginatedQuery";

type Vpc = NetworkVPC;
type Subnet = NetworkSubnet;
type VpcStatusFilter = "all" | Vpc["state"];
type VpcSearchField = "name" | "id";

export default function VpcsPage() {
  const qc = useQueryClient();
  const [createVisible, setCreateVisible] = useState(false);

  const [status, setStatus] = useState<VpcStatusFilter>("all");
  const [searchField, setSearchField] = useState<VpcSearchField>("name");
  const [searchText, setSearchText] = useState("");

  const {
    query: vpcs,
    page,
    pageSize,
    setPage,
    setPageSize,
    resetPagination,
    refresh,
  } = useCursorPaginatedQuery<Vpc>({
    errorNotification: {
      id: "vpcs",
      action: "VPC 列表加载",
      fallback: "请求失败，请稍后重试",
    },
    queryKey: ["network-vpcs", { status, searchField, searchText }],
    cursorScope: `${status}:${searchField}:${searchText.trim()}`,
    fetchPage: async ({ cursor, limit }) => {
      const keyword = searchText.trim();
      return listNetworkVpcs({
        limit,
        cursor,
        state: status === "all" ? undefined : status,
        search_field: keyword ? searchField : undefined,
        keyword: keyword || undefined,
      });
    },
  });
  const subnets = useQuery({
    meta: {
      errorNotification: {
        id: "subnets",
        action: "数据加载",
        fallback: "请求失败，请稍后重试",
      },
    },
    queryKey: ["network-subnets", "vpc-counts"],
    queryFn: () => listNetworkSubnets({ limit: 100 }),
  });
  const routes = useQuery({
    meta: {
      errorNotification: {
        id: "routes",
        action: "数据加载",
        fallback: "请求失败，请稍后重试",
      },
    },
    queryKey: ["network-routes", "vpc-counts"],
    queryFn: () => listNetworkRoutes({ limit: 100 }),
  });

  const { actions } = useVpcActions(() => {
    resetPagination();
    qc.invalidateQueries({ queryKey: ["network-subnets"] });
    qc.invalidateQueries({ queryKey: ["network-routes"] });
  });

  const items = useMemo(() => (vpcs.data?.items ?? []) as Vpc[], [vpcs.data?.items]);
  const subnetCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const subnet of (subnets.data?.items ?? []) as Subnet[])
      counts.set(subnet.vpc_id, (counts.get(subnet.vpc_id) ?? 0) + 1);
    return counts;
  }, [subnets.data?.items]);
  const routeTableNames = useMemo(() => {
    const names = new Map<string, string[]>();
    for (const route of (routes.data?.items ?? []) as NetworkRoute[]) {
      names.set(route.vpc_id, [
        ...(names.get(route.vpc_id) ?? []),
        route.description?.trim() || route.id,
      ]);
    }
    return names;
  }, [routes.data?.items]);
  const paginationTotal = vpcs.data?.total ?? items.length;
  const columns: Array<ListColumn<Vpc>> = [
    {
      key: "name",
      title: "名称 / ID",
      render: (_, vpc) => <ResourceNameId name={vpc.name} id={vpc.id} type="vpc" />,
    },
    {
      key: "state",
      title: "状态",
      width: 120,
      render: (_, vpc) => <StatusBadge status={vpc.state} />,
    },
    { key: "cidr", title: "CIDR", dataIndex: "cidr" },
    {
      key: "subnets",
      title: "子网数",
      render: (_, vpc) => (subnets.isError ? "-" : (subnetCounts.get(vpc.id) ?? 0)),
    },
    {
      key: "routeTable",
      title: "路由表",
      render: (_, vpc) => (routes.isError ? "-" : routeTableNames.get(vpc.id)?.join("、") || "-"),
    },
    {
      key: "createdAt",
      title: "创建时间",
      width: 150,
      render: (_, vpc) => formatDateTime(vpc.created_at),
    },
  ];

  return (
    <>
      <ListPageFrame
        header={{
          iconClassName: "icon-VPCwangluo",
          title: "VPC",
          subtitle: "创建和管理相互隔离的虚拟私有云网络",
          actions: [
            {
              key: "create",
              label: "创建 VPC",
              iconClassName: "icon-add-1",
              variant: "primary",
              onClick: () => setCreateVisible(true),
            },
          ],
        }}
        tabs={{
          value: status,
          onChange: setStatus,
          items: [
            {
              value: "all",
              label: "全部",
            },
            {
              value: "available",
              label: "可用",
            },
            {
              value: "pending",
              label: "创建中",
            },
            {
              value: "failed",
              label: "异常",
            },
          ],
        }}
        toolbar={{
          search: {
            fields: [
              {
                value: "name",
                label: "名称",
              },
              {
                value: "id",
                label: "ID",
              },
            ],
            field: searchField,
            value: searchText,
            onFieldChange: setSearchField,
            onChange: setSearchText,
          },
          refresh: {
            label: "刷新",
            spinning: vpcs.isFetching,
            onClick: () => {
              refresh();
              void Promise.all([subnets.refetch(), routes.refetch()]);
            },
          },
        }}
      >
        <ListDataTable
          data={items}
          columns={columns}
          rowActions={actions}
          loading={vpcs.isFetching}
          emptyIconClassName="icon-VPCwangluo"
          tableLabel="VPC 列表"
          preserveTableOnEmpty
          pagination={{
            page,
            pageSize,
            total: paginationTotal,
            onPageChange: setPage,
            onPageSizeChange: setPageSize,
          }}
        />
      </ListPageFrame>
      {createVisible && (
        <CreateVpcModal
          onCancel={() => setCreateVisible(false)}
          onCreated={() => {
            setCreateVisible(false);
            resetPagination();
            qc.invalidateQueries({ queryKey: ["network-vpcs"] });
          }}
        />
      )}
    </>
  );
}
