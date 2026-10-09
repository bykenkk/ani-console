import { useClientPaginatedQuery } from "@/hooks/useClientPaginatedQuery";
import { listNetworkSecurityGroupRules, deleteNetworkSecurityGroupRule } from "@/api/network";
import { DataTable, type RowAction } from "@/components/common";
import SecurityGroupRuleModal from "@/components/network/SecurityGroupRuleModal";
import { type SecurityGroupRuleResource } from "@/components/network/SecurityGroupRuleModal";
import { withId } from "@/lib/id";
import { Button, Empty, Space, Tag, Typography, Modal } from "@arco-design/web-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

export default function SecurityGroupRules({
  securityGroupId,
  direction,
}: {
  securityGroupId: string;
  direction: SecurityGroupRuleResource["direction"];
}) {
  const {
    query: rules,
    items: pageItems,
    pagination,
  } = useClientPaginatedQuery({
    errorNotification: {
      id: withId("security-group-rules", securityGroupId),
      action: `安全组规则加载`,
      fallback: "请求失败，请稍后重试",
    },
    queryKey: ["network-security-group-rules", securityGroupId],
    filterScope: direction,
    filter: (rule) => rule.direction === direction,
    queryFn: () => listNetworkSecurityGroupRules(securityGroupId),
  });

  const qc = useQueryClient();
  const [ruleEditor, setRuleEditor] = useState<SecurityGroupRuleResource | null | undefined>();
  const deleteRule = useMutation({
    meta: {
      feedback: {
        channel: "notification",
        id: "security-group-rule-delete",
        action: "删除",
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
    { key: "edit", label: "编辑", onClick: setRuleEditor },
    {
      key: "delete",
      label: "删除",
      intent: "danger",
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
          rule={ruleEditor}
          onCancel={() => setRuleEditor(undefined)}
        />
      )}
    </>
  );
  const openCreate = () => setRuleEditor(null);
  const items = (rules.data?.items ?? []) as SecurityGroupRuleResource[];
  const directionRules = items.filter((rule) => rule.direction === direction);

  return (
    <Space direction="vertical" size={12} className="w-full">
      <div className="flex items-center justify-between">
        <Typography.Text>
          共 <Typography.Text bold>{directionRules.length}</Typography.Text> 条
          {direction === "ingress" ? "入站" : "出站"}规则
        </Typography.Text>
        <Button type="primary" onClick={openCreate}>
          添加规则
        </Button>
      </div>
      <DataTable<SecurityGroupRuleResource>
        loading={rules.isLoading}
        rowActions={actions}
        columns={[
          { title: "优先级", dataIndex: "priority" },
          {
            title: "协议",
            render: (_, rule) => (rule.protocol === "all" ? "全部" : rule.protocol.toUpperCase()),
          },
          { title: "端口范围", dataIndex: "port_range" },
          {
            title: direction === "ingress" ? "来源 CIDR" : "目标 CIDR",
            dataIndex: "cidr",
          },
          {
            title: "策略",
            render: (_, rule) => (
              <Tag color={rule.action === "allow" ? "green" : "red"}>
                {rule.action === "allow" ? "允许" : "拒绝"}
              </Tag>
            ),
          },
          { title: "描述", dataIndex: "description", placeholder: "-" },
        ]}
        data={pageItems}
        pagination={pagination}
        noDataElement={
          <Empty description={`暂无${direction === "ingress" ? "入站" : "出站"}规则`} />
        }
      />
      {dialogNode}
    </Space>
  );
}
