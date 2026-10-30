import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Form, Input, Modal, Select, Typography } from "@arco-design/web-react";
import { createNetworkSecurityGroup, type NetworkSecurityGroupRule } from "@/api/network";
import { validateForm } from "@/lib/form";

type CreateSecurityGroupModalProps = { onCancel: () => void };
type RuleTemplate = "common" | "open" | "custom";
type CreateSecurityGroupFormValues = {
  name: string;
  description?: string;
  rule_template: RuleTemplate;
};
const RULE_TEMPLATES: Record<RuleTemplate, NetworkSecurityGroupRule[]> = {
  common: [
    {
      direction: "ingress",
      protocol: "tcp",
      port_ranges: [{ min: 22, max: 22 }],
      remote_addresses: ["0.0.0.0/0"],
      action: "allow",
      priority: 100,
    },
    {
      direction: "ingress",
      protocol: "tcp",
      port_ranges: [{ min: 3389, max: 3389 }],
      remote_addresses: ["0.0.0.0/0"],
      action: "allow",
      priority: 101,
    },
    {
      direction: "ingress",
      protocol: "icmp",
      port_ranges: [],
      remote_addresses: ["0.0.0.0/0"],
      action: "allow",
      priority: 102,
    },
  ],
  open: [
    {
      direction: "ingress",
      protocol: "all",
      port_ranges: [],
      remote_addresses: [],
      action: "allow",
      priority: 100,
    },
  ],
  custom: [],
};
export default function CreateSecurityGroupModal({ onCancel }: CreateSecurityGroupModalProps) {
  const [form] = Form.useForm<CreateSecurityGroupFormValues>();
  const qc = useQueryClient();
  const create = useMutation({
    meta: { feedback: { channel: "message", action: "创建安全组", successText: "创建已提交" } },
    mutationFn: ({ name, description, rule_template }: CreateSecurityGroupFormValues) =>
      createNetworkSecurityGroup({
        name: name.trim(),
        description: description?.trim() || undefined,
        rules: RULE_TEMPLATES[rule_template],
      }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["network-security-groups"] });
      onCancel();
    },
  });
  return (
    <Modal
      visible
      title="创建安全组"
      onCancel={onCancel}
      onOk={async () => create.mutateAsync(await validateForm(form))}
      confirmLoading={create.isPending}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{ rule_template: "custom" }}
        disabled={create.isPending}
      >
        <Form.Item
          field="name"
          label="名称"
          rules={[{ required: true, message: "请输入安全组名称" }, { maxLength: 64 }]}
        >
          <Input maxLength={64} showWordLimit />
        </Form.Item>
        <Form.Item field="description" label="描述">
          <Input.TextArea maxLength={200} showWordLimit />
        </Form.Item>
        <Form.Item field="rule_template" label="规则模板" rules={[{ required: true }]}>
          <Select
            options={[
              { value: "common", label: "常用远程端口（22 / 3389 / ICMP），拒绝其他入站流量" },
              { value: "open", label: "放通全部（仅试验）" },
              { value: "custom", label: "自定义（仅默认入站拒绝）" },
            ]}
          />
        </Form.Item>
        <Typography.Text type="secondary">
          默认拒绝入站流量，出站保持放行。常用模板允许指定远程端口；同组成员也按规则匹配。
        </Typography.Text>
      </Form>
    </Modal>
  );
}
