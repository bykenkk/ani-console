import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Form, Input, InputNumber, InputTag, Modal, Select } from "@arco-design/web-react";
import {
  createNetworkSecurityGroupRule,
  updateNetworkSecurityGroupRule,
  type NetworkSecurityGroupRuleResource,
} from "@/api/network";
import { validateForm } from "@/lib/form";

type SecurityGroupRuleModalProps = {
  securityGroupId: string;
  expectedVersion: string;
  direction: SecurityGroupRuleResource["direction"];
  rule?: SecurityGroupRuleResource | null;
  onCancel: () => void;
};
export type SecurityGroupRuleResource = NetworkSecurityGroupRuleResource;
type SecurityGroupRuleFormValues = {
  direction: SecurityGroupRuleResource["direction"];
  priority: number;
  protocol: SecurityGroupRuleResource["protocol"];
  port_ranges: string[];
  remote_addresses: string[];
  action: SecurityGroupRuleResource["action"];
  description?: string;
};
function parsePortRanges(values: string[] = []) {
  if (!values.length || (values.length === 1 && values[0] === "all")) return [];
  if (values.length > 10) throw new Error("每条规则最多 10 个端口范围");
  return values.map((part) => {
    const match = /^(\d+)(?:-(\d+))?$/.exec(part.trim());
    if (!match) throw new Error("端口格式应为 80 或 80-443");
    const min = Number(match[1]),
      max = Number(match[2] ?? match[1]);
    if (min < 1 || max > 65535 || min > max)
      throw new Error("端口范围必须位于 1–65535，起始端口不能大于结束端口");
    return { min, max };
  });
}
function normalizeAddress(address: string) {
  const trimmed = address.trim();
  return trimmed.includes("/") ? trimmed : `${trimmed}/32`;
}
function validateAddresses(values: string[] = []) {
  if (values.length > 10) return "每条规则最多 10 个远端 CIDR";
  const invalid = values.some((address) => {
    const match = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})\/(\d{1,2})$/.exec(
      normalizeAddress(address),
    );
    if (!match) return true;
    const octets = match.slice(1, 5).map(Number),
      bits = Number(match[5]);
    if (
      octets.some((part, index) => part > 255 || String(part) !== match[index + 1]) ||
      bits > 32 ||
      String(bits) !== match[5]
    )
      return true;
    const ip = octets.reduce((current, part) => ((current << 8) | part) >>> 0, 0);
    const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0;
    return (ip & mask) >>> 0 !== ip;
  });
  return invalid ? "请输入合法的 IPv4 网段或单个 IPv4 地址" : undefined;
}
export default function SecurityGroupRuleModal({
  securityGroupId,
  expectedVersion,
  direction,
  rule,
  onCancel,
}: SecurityGroupRuleModalProps) {
  const [form] = Form.useForm<SecurityGroupRuleFormValues>();
  const [protocol, setProtocol] = useState<SecurityGroupRuleResource["protocol"]>(
    rule?.protocol ?? "tcp",
  );
  const qc = useQueryClient();
  const save = useMutation({
    meta: {
      feedback: {
        channel: "message",
        action: rule ? "更新安全组规则" : "添加安全组规则",
        successText: "规则更新已提交",
      },
    },
    mutationFn: async (values: SecurityGroupRuleFormValues) => {
      const submitData = {
        expected_version: expectedVersion,
        rule: {
          direction: values.direction,
          priority: values.priority,
          protocol: values.protocol,
          action: values.action,
          port_ranges: ["tcp", "udp"].includes(values.protocol)
            ? parsePortRanges(values.port_ranges)
            : [],
          remote_addresses: (values.remote_addresses ?? []).map(normalizeAddress),
          description: values.description?.trim() || undefined,
        },
      };
      if (rule) return updateNetworkSecurityGroupRule(securityGroupId, rule.id, submitData);
      return createNetworkSecurityGroupRule(securityGroupId, submitData);
    },
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["network-security-group-rules", securityGroupId] }),
        qc.invalidateQueries({ queryKey: ["network-security-group", securityGroupId] }),
        qc.invalidateQueries({ queryKey: ["network-security-groups"] }),
      ]);
      onCancel();
    },
  });
  return (
    <Modal
      visible
      title={rule ? "编辑安全组规则" : "添加安全组规则"}
      onCancel={onCancel}
      onOk={async () => save.mutateAsync(await validateForm(form))}
      confirmLoading={save.isPending}
    >
      <Form
        form={form}
        layout="vertical"
        disabled={save.isPending}
        initialValues={{
          direction: rule?.direction ?? direction,
          priority: rule?.priority ?? 100,
          protocol: rule?.protocol ?? "tcp",
          action: rule?.action ?? "allow",
          port_ranges: rule?.port_ranges.map(({ min, max }) =>
            min === max ? String(min) : `${min}-${max}`,
          ) ?? ["22"],
          remote_addresses: rule?.remote_addresses ?? ["0.0.0.0/0"],
          description: rule?.description ?? "",
        }}
      >
        <div className="grid grid-cols-3 gap-4">
          <Form.Item field="direction" label="方向" rules={[{ required: true }]}>
            <Select
              options={[
                { value: "ingress", label: "入站" },
                { value: "egress", label: "出站" },
              ]}
            />
          </Form.Item>
          <Form.Item field="action" label="策略" rules={[{ required: true }]}>
            <Select
              options={[
                { value: "allow", label: "允许" },
                { value: "drop", label: "拒绝" },
              ]}
            />
          </Form.Item>
          <Form.Item field="protocol" label="协议" rules={[{ required: true }]}>
            <Select
              onChange={setProtocol}
              options={[
                { value: "tcp", label: "TCP" },
                { value: "udp", label: "UDP" },
                { value: "icmp", label: "ICMP" },
                { value: "ipip", label: "IPIP" },
                { value: "gre", label: "GRE" },
                { value: "all", label: "全部" },
              ]}
            />
          </Form.Item>
        </div>
        <Form.Item
          field="remote_addresses"
          label="远端地址"
          extra="最多 10 个 IPv4 CIDR；单个 IP 自动补 /32。入站匹配来源、出站匹配目标；留空表示全部地址。"
          rules={[{ validator: (value, callback) => callback(validateAddresses(value)) }]}
        >
          <InputTag
            allowClear
            saveOnBlur
            tokenSeparators={[",", " ", "\n"]}
            placeholder="输入 IP 或 CIDR 后按回车"
            validate={(input) => (input.trim() ? normalizeAddress(input) : false)}
          />
        </Form.Item>
        <Form.Item
          field="port_ranges"
          label="目的端口"
          extra="最多 10 个端口或端口范围，仅 TCP / UDP 生效；留空表示全部端口。"
          rules={[
            {
              validator: (value, callback) => {
                try {
                  if (["tcp", "udp"].includes(protocol)) parsePortRanges(value);
                  callback();
                } catch (error) {
                  callback(error instanceof Error ? error.message : "端口格式错误");
                }
              },
            },
          ]}
        >
          <InputTag
            allowClear
            saveOnBlur
            tokenSeparators={[",", " ", "\n"]}
            disabled={!["tcp", "udp"].includes(protocol)}
            placeholder="例如 80 或 1000-2000，按回车添加"
          />
        </Form.Item>
        <Form.Item
          field="priority"
          label="优先级"
          extra="2–4000，数值越大优先级越高；默认入站拒绝规则固定为 1。"
          rules={[{ required: true }]}
        >
          <InputNumber min={2} max={4000} precision={0} className="w-full" />
        </Form.Item>
        <Form.Item field="description" label="描述">
          <Input.TextArea maxLength={200} showWordLimit />
        </Form.Item>
      </Form>
    </Modal>
  );
}
