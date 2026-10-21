import CreateSubnetModal from "@/components/subnets/CreateSubnetModal";
import { useSubnetActions } from "@/hooks/useSubnetActions";

import { useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, Select } from "@arco-design/web-react";
import { useMemo, useState } from "react";
import {
  listNetworkSubnets,
  listNetworkVpcs,
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
import { useClientPaginatedQuery } from "@/hooks/useClientPaginatedQuery";
import { navigateToResourceDetail } from "@/lib/resources";
import { withFirst100 } from "@/api/pagination";

const listVpcOptions = withFirst100(listNetworkVpcs);
type Vpc = NetworkVPC;
type Subnet = NetworkSubnet;
type SubnetStatusFilter = "all" | Subnet["state"];
type SubnetSearchField = "name" | "id";

export default function SubnetsPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [createVisible, setCreateVisible] = useState(false);
  const [status, setStatus] = useState<SubnetStatusFilter>("all");
  const [searchField, setSearchField] = useState<SubnetSearchField>("name");
  const [searchText, setSearchText] = useState("");
  const [filterVpcId, setFilterVpcId] = useState("");

  const vpcs = useQuery({
    meta: {
      errorNotification: {
        id: "vpcs",
        action: "数据加载",
        fallback: "请求失败，请稍后重试",
      },
    },
    queryKey: ["network-vpcs", "subnet-page", "options"],
    queryFn: () => listVpcOptions({}),
  });
  const {
    query: subnets,
    resetPagination,
    refresh,
    items,
    pagination,
  } = useClientPaginatedQuery<Subnet>({
    errorNotification: {
      id: "subnets",
      action: "子网列表加载",
      fallback: "请求失败，请稍后重试",
    },
    queryKey: ["network-subnets", { status, searchField, searchText, filterVpcId }],
    queryFn: async () => {
      const keyword = searchText.trim();
      return listNetworkSubnets({
        vpc_id: filterVpcId || undefined,
        state: status === "all" ? undefined : status,
        search_field: keyword ? searchField : undefined,
        keyword: keyword || undefined,
      });
    },
  });
  const { actions } = useSubnetActions(resetPagination);

  const vpcNames = useMemo(
    () => new Map(((vpcs.data?.items ?? []) as Vpc[]).map((vpc) => [vpc.id, vpc.name])),
    [vpcs.data?.items],
  );
  const columns: Array<ListColumn<Subnet>> = [
    {
      key: "name",
      title: "名称 / ID",
      width: 200,
      fixed: "left",
      render: (_, subnet) => <ResourceNameId name={subnet.name} id={subnet.id} type="subnet" />,
    },
    {
      key: "state",
      title: "状态",
      width: 120,
      render: (_, subnet) => <StatusBadge status={subnet.state} />,
    },
    {
      key: "vpc",
      title: "VPC",
      width: 200,
      render: (_, subnet) => (
        <Link
          onClick={() => navigateToResourceDetail(navigate, { type: "vpc", id: subnet.vpc_id })}
        >
          {vpcNames.get(subnet.vpc_id) || subnet.vpc_id}
        </Link>
      ),
    },
    {
      key: "cidr",
      title: "CIDR",
      width: 150,
      dataIndex: "cidr",
    },
    {
      key: "gateway",
      title: "网关",
      width: 150,
      dataIndex: "gateway",
    },
    {
      key: "createdAt",
      title: "创建时间",
      width: 180,
      render: (_, subnet) => formatDateTime(subnet.created_at),
    },
  ];

  return (
    <>
      <ListPageFrame
        header={{
          iconClassName: "icon-VPCwangluo",
          title: "子网",
          subtitle: "在 VPC 内划分相互隔离的私有网络地址空间",
          actions: [
            {
              key: "create",
              label: "创建子网",
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
          filters: (
            <div className="flex flex-wrap gap-3">
              <Select
                aria-label="按 VPC 筛选"
                value={filterVpcId || undefined}
                onChange={setFilterVpcId}
                allowClear
                placeholder="全部 VPC"
                loading={vpcs.isLoading}
                style={{
                  width: 220,
                }}
              >
                {((vpcs.data?.items ?? []) as Vpc[]).map((vpc) => (
                  <Select.Option key={vpc.id} value={vpc.id}>
                    {vpc.name}
                  </Select.Option>
                ))}
              </Select>
            </div>
          ),
          refresh: {
            label: "刷新",
            spinning: subnets.isFetching || vpcs.isFetching,
            onClick: () => {
              refresh();
              vpcs.refetch();
            },
          },
        }}
      >
        <ListDataTable
          data={items}
          columns={columns}
          rowActions={actions}
          loading={subnets.isFetching || vpcs.isFetching}
          tableLabel="子网列表"
          pagination={pagination}
        />
      </ListPageFrame>
      {createVisible && (
        <CreateSubnetModal
          onCancel={() => setCreateVisible(false)}
          onCreated={() => {
            resetPagination();
            qc.invalidateQueries({ queryKey: ["network-subnets"] });
          }}
        />
      )}
    </>
  );
}
