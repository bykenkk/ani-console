import { useSecurityGroupActions } from "@/hooks/useSecurityGroupActions";

import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Link, Select } from "@arco-design/web-react";
import { useMemo, useState } from "react";
import {
  listNetworkSecurityGroups,
  listNetworkVpcs,
  type NetworkSecurityGroup,
  type NetworkVPC,
} from "@/api/network";

import CreateSecurityGroupModal from "@/components/security-groups/CreateSecurityGroupModal";
import {
  ResourceNameId,
  ListPageFrame,
  type ListColumn,
  ListDataTable,
  StatusBadge,
} from "@/components/common";
import { formatDateTime } from "@/lib/format";
import { useClientPaginatedQuery } from "@/hooks/useClientPaginatedQuery";
import { navigateToResourceDetail } from "@/lib/resources";
import { withFirst100 } from "@/api/pagination";

const listVpcOptions = withFirst100(listNetworkVpcs);

type SecurityGroup = NetworkSecurityGroup;
type Vpc = NetworkVPC;
type StatusFilter = "all" | SecurityGroup["state"];
type SearchField = "name" | "id";

export default function SecurityGroupsPage() {
  const navigate = useNavigate();
  const [createVisible, setCreateVisible] = useState(false);
  const [status, setStatus] = useState<StatusFilter>("all");
  const [searchField, setSearchField] = useState<SearchField>("name");
  const [searchText, setSearchText] = useState("");
  const [filterVpcId, setFilterVpcId] = useState("");
  const {
    query: securityGroups,
    resetPagination,
    refresh,
    items,
    pagination,
  } = useClientPaginatedQuery<SecurityGroup>({
    errorNotification: {
      id: "security-groups",
      action: "安全组列表加载",
      fallback: "请求失败，请稍后重试",
    },
    queryKey: ["network-security-groups", { status, searchField, searchText, filterVpcId }],
    queryFn: async () => {
      const keyword = searchText.trim();
      return listNetworkSecurityGroups({
        vpc_id: filterVpcId || undefined,
        state: status === "all" ? undefined : status,
        search_field: keyword ? searchField : undefined,
        keyword: keyword || undefined,
      });
    },
  });
  const vpcs = useQuery({
    meta: {
      errorNotification: {
        id: "vpcs",
        action: "VPC 列表加载",
        fallback: "请求失败，请稍后重试",
      },
    },
    queryKey: ["network-vpcs", "security-group-create", "options"],
    queryFn: () => listVpcOptions({}),
  });

  const { actions } = useSecurityGroupActions(resetPagination, resetPagination);

  const vpcNames = useMemo(
    () => new Map(((vpcs.data?.items ?? []) as Vpc[]).map((vpc) => [vpc.id, vpc.name])),
    [vpcs.data?.items],
  );
  const columns: Array<ListColumn<SecurityGroup>> = [
    {
      key: "name",
      title: "名称 / ID",
      render: (_, item) => <ResourceNameId name={item.name} id={item.id} type="security-group" />,
    },
    {
      key: "vpc",
      title: "VPC",
      render: (_, item) => {
        const vpcId = item.vpc_id;
        return vpcId ? (
          <Link onClick={() => navigateToResourceDetail(navigate, { type: "vpc", id: vpcId })}>
            {vpcNames.get(vpcId) || vpcId}
          </Link>
        ) : (
          "-"
        );
      },
    },
    {
      key: "state",
      title: "状态",
      width: 100,
      render: (_, item) => <StatusBadge status={item.state} />,
    },
    {
      key: "rules",
      title: "规则数",
      render: (_, item) => item.rule_count ?? item.rules.length,
    },
    {
      key: "instances",
      title: "关联实例",
      dataIndex: "bound_instance_count",
      placeholder: 0,
    },
    {
      key: "createdAt",
      title: "创建时间",
      width: 150,
      render: (_, item) => formatDateTime(item.created_at),
    },
  ];

  return (
    <>
      <ListPageFrame
        header={{
          iconClassName: "icon-anquanzu",
          title: "安全组",
          subtitle: "通过入方向和出方向规则控制实例网络访问",
          actions: [
            {
              key: "create",
              label: "创建安全组",
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
            spinning: securityGroups.isFetching || vpcs.isFetching,
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
          loading={securityGroups.isFetching || vpcs.isFetching}
          tableLabel="安全组列表"
          pagination={pagination}
        />
      </ListPageFrame>
      {createVisible && <CreateSecurityGroupModal onCancel={() => setCreateVisible(false)} />}
    </>
  );
}
