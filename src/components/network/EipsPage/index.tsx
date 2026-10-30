import ChangeSecurityGroupsModal from "@/components/security-groups/ChangeSecurityGroupsModal";
import { useState } from "react";
import { listNetworkEips, type NetworkEip, type NetworkResourceStateFilter } from "@/api/network";
import {
  ListPageFrame,
  ListDataTable,
  ResourceNameId,
  StatusBadge,
  type ListColumn,
} from "@/components/common";
import { useCursorPaginatedQuery } from "@/hooks/useCursorPaginatedQuery";
import { formatDateTime } from "@/lib/format";
import CreateEipModal from "../CreateEipModal";

export default function EipsPage() {
  const [securityGroupsEip, setSecurityGroupsEip] = useState<NetworkEip>();
  const [createVisible, setCreateVisible] = useState(false);
  const [status, setStatus] = useState<"" | NetworkResourceStateFilter>("");
  const [searchText, setSearchText] = useState("");
  // TODO(pagination-migration): EIP 后端仍为 limit/cursor；完成 page/pageSize 改造后改用 useListPagination 和真实 total。
  // TODO: 部署后验证列表筛选、游标翻页及创建后的状态更新。
  const { query, items, pagination, resetPagination, refresh } =
    useCursorPaginatedQuery<NetworkEip>({
      queryKey: ["network-eips", { status, name: searchText.trim() }],
      errorNotification: {
        id: "eips",
        action: "公网 IP 列表加载",
        fallback: "请求失败，请稍后重试",
      },
      queryFn: ({ cursor, limit }, signal) =>
        listNetworkEips(
          {
            cursor,
            limit,
            state: status || undefined,
            name: searchText.trim() || undefined,
          },
          signal,
        ),
    });
  const columns: Array<ListColumn<NetworkEip>> = [
    {
      key: "name",
      title: "名称 / ID",
      width: 200,
      fixed: "left",
      render: (_, item) => <ResourceNameId name={item.name} id={item.id} openable={false} />,
    },
    {
      key: "state",
      title: "状态",
      width: 120,
      render: (_, item) => <StatusBadge status={item.state} reason={item.reason} />,
    },
    { key: "address", title: "公网 IP", dataIndex: "address", ellipsis: true, width: 160 },
    // TODO: EIP 契约提供网络关联字段后展示网络；不根据绑定目标拼接 VPC 信息。
    { key: "network", title: "网络", render: () => "-", width: 120 },
    {
      key: "resource",
      title: "关联资源",
      dataIndex: "binding_target.id",
      ellipsis: true,
      width: 200,
    },
    {
      key: "description",
      title: "简介",
      dataIndex: "description",
      ellipsis: true,
      width: 200,
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
          iconClassName: "icon-wangluo",
          title: "公网 IP",
          subtitle: "创建和管理公网 IP",
          actions: [
            {
              key: "create",
              label: "创建公网 IP",
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
            { value: "", label: "全部" },
            { value: "RESOURCE_STATE_AVAILABLE", label: "可用" },
            { value: "RESOURCE_STATE_PROVISIONING", label: "创建中" },
            { value: "RESOURCE_STATE_FAILED", label: "异常" },
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
          refresh: { label: "刷新", spinning: query.isFetching, onClick: refresh },
        }}
      >
        <ListDataTable
          data={items}
          columns={columns}
          loading={query.isFetching}
          pagination={pagination}
          rowActions={[
            {
              key: "security-groups",
              label: "更换安全组",
              disabled: (eip) => ["deleted", "deleting"].includes(eip.state),
              onClick: setSecurityGroupsEip,
            },
          ]}
          tableLabel="公网 IP 列表"
        />
      </ListPageFrame>
      {securityGroupsEip && (
        <ChangeSecurityGroupsModal
          targetType="eip"
          id={securityGroupsEip.id}
          name={securityGroupsEip.name}
          onCancel={() => setSecurityGroupsEip(undefined)}
        />
      )}
      {createVisible && (
        <CreateEipModal
          onCancel={() => setCreateVisible(false)}
          onCreated={() => {
            setCreateVisible(false);
            resetPagination();
          }}
        />
      )}
    </>
  );
}
