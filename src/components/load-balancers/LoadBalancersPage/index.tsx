import { useLoadBalancerActions } from "@/hooks/useLoadBalancerActions";

import { useQuery } from "@tanstack/react-query";
import { Select } from "@arco-design/web-react";
import { useState } from "react";
import {
  listNetworkLoadBalancers,
  listNetworkVpcs,
  type NetworkLoadBalancer,
  type NetworkVPC,
} from "@/api/network";

import CreateLoadBalancerModal from "@/components/load-balancers/CreateLoadBalancerModal";
import {
  ResourceNameId,
  ListPageFrame,
  type ListColumn,
  StatusBadge,
  ListDataTable,
} from "@/components/common";
import { loadBalancerListeners } from "@/lib/load-balancers";
import { formatDateTime } from "@/lib/format";
import { withFirst100 } from "@/api/pagination";

const listVpcOptions = withFirst100(listNetworkVpcs);

type LoadBalancer = NetworkLoadBalancer;
type Vpc = NetworkVPC;
type StatusFilter = "all" | "provisioning" | "available" | "failed";

export default function LoadBalancersPage() {
  const [createVisible, setCreateVisible] = useState(false);
  const [status, setStatus] = useState<StatusFilter>("all");

  const [searchText, setSearchText] = useState("");
  const [vpcId, setVpcId] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [cursors, setCursors] = useState<Array<string | undefined>>([undefined]);
  const resetPagination = () => {
    setPage(1);
    setCursors([undefined]);
  };
  const loadBalancers = useQuery({
    meta: {
      errorNotification: {
        id: "load-balancers",
        action: "负载均衡列表加载",
        fallback: "请求失败，请稍后重试",
      },
    },
    queryKey: [
      "network-load-balancers",
      { status, vpcId, name: searchText.trim(), cursor: cursors[page - 1], limit: pageSize },
    ],
    queryFn: ({ signal }) =>
      listNetworkLoadBalancers(
        {
          vpc_id: vpcId || undefined,
          name: searchText.trim() || undefined,
          cursor: cursors[page - 1],
          limit: pageSize,
          state: status === "all" ? undefined : status,
        },
        signal,
      ),
  });
  const items = loadBalancers.data?.items ?? [];
  const pagination = {
    // TODO(pagination-migration): 后端改为 page/pageSize 后移除此临时游标配置。
    mode: "legacy-cursor" as const,
    page,
    pageSize,
    hasNextPage: !!loadBalancers.data?.next_cursor,
    disabled: loadBalancers.isFetching,
    onPageChange: (next: number) => {
      if (next === page + 1 && loadBalancers.data?.next_cursor) {
        setCursors([...cursors.slice(0, page), loadBalancers.data.next_cursor]);
        setPage(next);
      } else if (next >= 1 && next <= cursors.length) setPage(next);
    },
    onPageSizeChange: (size: number) => {
      setPageSize(size);
      resetPagination();
    },
  };
  const refresh = () => {
    resetPagination();
    if (page === 1) loadBalancers.refetch();
  };
  const vpcs = useQuery({
    meta: {
      errorNotification: {
        id: "vpcs",
        action: "VPC 列表加载",
        fallback: "请求失败，请稍后重试",
      },
    },
    queryKey: ["network-vpcs", "load-balancer-list", "options"],
    queryFn: () => listVpcOptions({}),
  });
  const { actions } = useLoadBalancerActions(resetPagination);

  const columns: Array<ListColumn<LoadBalancer>> = [
    {
      key: "name",
      title: "名称 / ID",
      width: 150,
      render: (_, item) => <ResourceNameId name={item.name} id={item.id} type="load-balancer" />,
    },
    {
      key: "state",
      title: "状态",
      width: 120,
      render: (_, item) => (
        <StatusBadge status={item.state} reason={item.reason} message={item.reason_message} />
      ),
    },
    {
      key: "vip",
      title: "私网 IP",
      dataIndex: "private_ip",
      width: 100,
      ellipsis: true,
      placeholder: "-",
    },
    {
      key: "listeners",
      title: "监听器",
      width: 100,
      ellipsis: true,
      render: (_, item) => loadBalancerListeners(item).length,
    },
    {
      key: "backends",
      title: "后端数",
      width: 100,
      ellipsis: true,
      render: (_, item) =>
        loadBalancerListeners(item).reduce(
          (count, listener) => count + (listener.backends?.length ?? 0),
          0,
        ),
    },
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
          iconClassName: "icon-fuzaijunhengqi",
          title: "负载均衡",
          subtitle: "通过 VIP、监听器和后端组对外提供高可用服务",
          actions: [
            {
              key: "create",
              label: "创建负载均衡",
              iconClassName: "icon-add-1",
              variant: "primary",
              onClick: () => setCreateVisible(true),
            },
          ],
        }}
        tabs={{
          value: status,
          onChange: (value) => {
            setStatus(value);
            resetPagination();
          },
          items: [
            {
              value: "all",
              label: "全部",
            },
            {
              value: "provisioning",
              label: "创建中",
            },
            {
              value: "available",
              label: "可用",
            },
            {
              value: "failed",
              label: "异常",
            },
          ],
        }}
        toolbar={{
          search: {
            fields: [{ value: "name", label: "名称" }],
            field: "name",
            value: searchText,
            onFieldChange: () => {},
            onChange: (value) => {
              setSearchText(value);
              resetPagination();
            },
          },
          filters: (
            <div className="flex flex-wrap gap-3">
              <Select
                aria-label="按 VPC 筛选"
                value={vpcId || undefined}
                onChange={(value) => {
                  setVpcId(value);
                  resetPagination();
                }}
                allowClear
                placeholder="全部 VPC"
                loading={vpcs.isLoading}
                style={{
                  width: 220,
                }}
              >
                {((vpcs.data?.items ?? []) as Vpc[]).map((item) => (
                  <Select.Option key={item.id} value={item.id}>
                    {item.name}
                  </Select.Option>
                ))}
              </Select>
            </div>
          ),
          refresh: {
            label: "刷新",
            spinning: loadBalancers.isFetching || vpcs.isFetching,
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
          loading={loadBalancers.isFetching || vpcs.isFetching}
          tableLabel="负载均衡列表"
          pagination={{ ...pagination, disabled: loadBalancers.isFetching }}
        />
      </ListPageFrame>
      {createVisible && <CreateLoadBalancerModal onCancel={() => setCreateVisible(false)} />}
    </>
  );
}
