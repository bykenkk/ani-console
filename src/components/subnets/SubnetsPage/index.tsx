import { StatusBadge, VpcSelect } from "@/components/common";
import CreateSubnetModal from "@/components/subnets/CreateSubnetModal";
import { useSubnetActions } from "@/hooks/useSubnetActions";

import { useQueryClient } from "@tanstack/react-query";
import { Tag } from "@arco-design/web-react";
import { useState } from "react";
import { listNetworkSubnets, type NetworkSubnet } from "@/api/network";

import {
  ResourceIdentity,
  ListPageFrame,
  type ListColumn,
  ListDataTable,
} from "@/components/common";
import { formatDateTime } from "@/lib/format";
import { useCursorPaginatedQuery } from "@/hooks/useCursorPaginatedQuery";

type Subnet = NetworkSubnet;
type SubnetStatusFilter = "all" | Subnet["state"];

export default function SubnetsPage() {
  const qc = useQueryClient();
  const [createVisible, setCreateVisible] = useState(false);
  const [status, setStatus] = useState<SubnetStatusFilter>("all");
  const [searchText, setSearchText] = useState("");
  const [filterVpcId, setFilterVpcId] = useState("");

  // TODO(pagination-migration): 子网继续按后端 limit/cursor 查询当前页，待正式页码契约后迁移。
  const {
    query: subnets,
    resetPagination,
    refresh,
    items,
    pagination,
  } = useCursorPaginatedQuery<Subnet>({
    errorNotification: {
      id: "subnets",
      action: "子网列表加载",
      fallback: "请求失败，请稍后重试",
    },
    queryKey: ["network-subnets", { status, searchText, filterVpcId }],
    queryFn: async (params, signal) => {
      const keyword = searchText.trim();
      return listNetworkSubnets(
        {
          ...params,
          vpc_id: filterVpcId || undefined,
          state: status === "all" ? undefined : status,
          name: keyword || undefined,
        },
        signal,
      );
    },
  });
  const { actions } = useSubnetActions(resetPagination);

  const columns: Array<ListColumn<Subnet>> = [
    {
      key: "name",
      title: "名称 / ID",
      width: 200,
      fixed: "left",
      render: (_, subnet) => (
        <ResourceIdentity
          name={subnet.name}
          id={subnet.id}
          type="subnet"
          nameSuffix={
            subnet.owner_scope === "platform" && (
              <Tag size="small" title="由平台提供并统一管理">
                平台
              </Tag>
            )
          }
        />
      ),
    },
    {
      key: "state",
      title: "状态",
      width: 120,
      render: (_, subnet) => (
        <StatusBadge status={subnet.state} reason={subnet.reason} message={subnet.reason_message} />
      ),
    },
    {
      key: "vpc",
      title: "VPC",
      width: 200,
      ellipsis: true,
      render: (_, subnet) => <ResourceIdentity display="id" id={subnet.vpc_id} />,
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
              value: "provisioning",
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
            ],
            field: "name",
            value: searchText,
            onFieldChange: () => {},
            onChange: setSearchText,
          },
          filters: (
            <div className="flex flex-wrap gap-3">
              <VpcSelect
                aria-label="按 VPC 筛选"
                value={filterVpcId || undefined}
                onChange={(id) => setFilterVpcId(id ?? "")}
                allowClear
                placeholder="全部 VPC"
                style={{ width: 220 }}
              />
            </div>
          ),
          refresh: {
            label: "刷新",
            spinning: subnets.isRefetching,
            onClick: () => {
              refresh();
              qc.invalidateQueries({ queryKey: ["network-vpcs", "options"] });
            },
          },
        }}
      >
        <ListDataTable
          data={items}
          columns={columns}
          rowActions={actions}
          loading={subnets.isFetching}
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
