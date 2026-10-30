import { useListPagination } from "@/hooks/useListPagination";
import { listNetworkSecurityGroupRules, deleteNetworkSecurityGroupRule } from "@/api/network";
import { DataTable, type RowAction } from "@/components/common";
import SecurityGroupRuleModal, {
  type SecurityGroupRuleResource,
} from "@/components/security-groups/SecurityGroupRuleModal";

import { withId } from "@/lib/id";
import { Button, Space, Tag, Typography, Modal } from "@arco-design/web-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

type SecurityGroupRulesProps = {
  securityGroupId: string;
  direction: SecurityGroupRuleResource["direction"];
};

export default function SecurityGroupRules({
  securityGroupId,
  direction,
}: SecurityGroupRulesProps) {
  const paging = useListPagination(`${securityGroupId}:${direction}`, 20);
  const rules = useQuery({
    queryKey: [
      "network-security-group-rules",
      securityGroupId,
      { direction, page: paging.page, pageSize: paging.pageSize },
    ],
    queryFn: ({ signal }) =>
      listNetworkSecurityGroupRules(
        securityGroupId,
        { direction, page: paging.page, pageSize: paging.pageSize },
        signal,
      ),
    meta: {
      errorNotification: {
        id: withId("security-group-rules", securityGroupId),
        action: "安全组规则加载",
      },
    },
  });
  const qc = useQueryClient();
  const [ruleEditor, setRuleEditor] = useState<{
    rule: SecurityGroupRuleResource | null;
    version: string;
  }>();
  const deleteRule = useMutation({
    meta: {
      feedback: {
        channel: "notification",
        id: "security-group-rule-delete",
        action: "删除安全组规则",
        successText: "规则删除已提交",
        errorFallback: "请求失败",
      },
    },
    mutationFn: (rule: SecurityGroupRuleResource) =>
      deleteNetworkSecurityGroupRule(securityGroupId, rule.id),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["network-security-group-rules", securityGroupId],
      });
      qc.invalidateQueries({
        queryKey: ["network-security-group", securityGroupId],
      });
      qc.invalidateQueries({ queryKey: ["network-security-groups"] });
    },
  });
  const actions: RowAction<SecurityGroupRuleResource>[] = [
    {
      key: "edit",
      label: "编辑",
      disabled: (rule) => rule.is_default,
      tooltip: (rule) => (rule.is_default ? "默认规则不可编辑" : undefined),
      onClick: (rule) => setRuleEditor({ rule, version: rules.data!.version }),
    },
    {
      key: "delete",
      label: "删除",
      intent: "danger",
      disabled: (rule) => rule.is_default,
      tooltip: (rule) => (rule.is_default ? "默认规则不可删除" : undefined),
      loading: (rule) => deleteRule.isPending && deleteRule.variables?.id === rule.id,
      onClick: (rule) => {
        Modal.confirm({
          title: "删除规则",
          content: "确定删除这条安全组规则？",
          okButtonProps: { status: "danger" },
          onOk: () => deleteRule.mutateAsync(rule),
        });
      },
    },
  ];
  const dialogNode = (
    <>
      {ruleEditor !== undefined && (
        <SecurityGroupRuleModal
          securityGroupId={securityGroupId}
          direction={direction}
          expectedVersion={ruleEditor.version}
          rule={ruleEditor.rule}
          onCancel={() => setRuleEditor(undefined)}
        />
      )}
    </>
  );
  const openCreate = () => setRuleEditor({ rule: null, version: rules.data!.version });

  return (
    <Space direction="vertical" size={12} className="w-full">
      <div className="flex items-center justify-between">
        <Typography.Text>
          共 <Typography.Text bold>{rules.data?.total ?? "0"}</Typography.Text> 条
          {direction === "ingress" ? "入站" : "出站"}规则
        </Typography.Text>
        <Button type="primary" onClick={openCreate} disabled={!rules.data}>
          添加规则
        </Button>
      </div>
      <DataTable<SecurityGroupRuleResource>
        loading={rules.isLoading}
        rowActions={actions}
        columns={[
          {
            title: "优先级",
            width: 140,
            render: (_, rule) => (
              <Space>
                {rule.priority}
                {rule.is_default && <Tag>默认</Tag>}
              </Space>
            ),
          },
          {
            title: "协议",
            width: 140,
            render: (_, rule) => (rule.protocol === "all" ? "全部" : rule.protocol.toUpperCase()),
          },
          {
            title: "端口范围",
            width: 150,
            render: (_, rule) =>
              rule.port_ranges
                .map(({ min, max }) => (min === max ? String(min) : `${min}-${max}`))
                .join(", ") || "全部",
          },
          {
            title: direction === "ingress" ? "来源 CIDR" : "目标 CIDR",
            width: 200,
            render: (_, rule) => rule.remote_addresses.join(", ") || "全部",
          },
          {
            title: "策略",
            width: 140,
            render: (_, rule) => (
              <Tag color={rule.action === "allow" ? "green" : "red"}>
                {rule.action === "allow" ? "允许" : "拒绝"}
              </Tag>
            ),
          },
          { title: "描述", width: 320, dataIndex: "description" },
        ]}
        data={rules.data?.items ?? []}
        pagination={{
          page: paging.page,
          pageSize: paging.pageSize,
          total: Number(rules.data?.total ?? "0"),
          onPageChange: paging.setPage,
          onPageSizeChange: paging.setPageSize,
        }}
      />
      {dialogNode}
    </Space>
  );
}
