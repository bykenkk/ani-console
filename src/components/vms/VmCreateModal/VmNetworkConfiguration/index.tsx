import { Button, Checkbox, Form, Input } from "@arco-design/web-react";
import { IconDelete, IconPlus } from "@arco-design/web-react/icon";
import SecurityGroupSelect from "@/components/common/SecurityGroupSelect";
import type { NetworkSecurityGroup, NetworkSubnet, NetworkVPC } from "@/api/network";
import VmNetworkFields from "../../VmNetworkFields";
import { optionalIpv4Error } from "@/lib/validators";
import type { VmCreateFormValues } from "..";

type VmNetworkConfigurationProps = {
  values: VmCreateFormValues;
  onVpcChange: (vpc: NetworkVPC | undefined) => void;
  onSubnetChange: (subnet: NetworkSubnet | undefined) => void;
  onSecurityGroupsChange: (groups: Pick<NetworkSecurityGroup, "id" | "name">[]) => void;
  disabled: boolean;
};

function dnsAddressError(value: string | undefined): string | undefined {
  const address = value?.trim() ?? "";
  if (!address) return "请输入 DNS 服务器 IP 地址";
  if (!address.includes(":")) return optionalIpv4Error(address, "DNS 服务器");
  if (/^[0-9a-f:.]+$/i.test(address)) {
    try {
      // URL 的 IPv6 字面量解析排除端口、域名和带作用域的地址。
      new URL(`http://[${address}]`);
      return undefined;
    } catch {
      // 无效 IPv6 与其他无效输入使用同一字段提示。
    }
  }
  return "请输入有效的 IPv4 或 IPv6 地址";
}

export default function VmNetworkConfiguration({
  values,
  onVpcChange,
  onSubnetChange,
  onSecurityGroupsChange,
  disabled,
}: VmNetworkConfigurationProps) {
  return (
    <>
      <VmNetworkFields
        vpcId={values.vpc_id}
        onVpcChange={onVpcChange}
        onSubnetChange={onSubnetChange}
      />
      <Form.Item field="security_group_ids" label="安全组">
        <SecurityGroupSelect onChange={(_, groups) => onSecurityGroupsChange(groups)} />
      </Form.Item>
      <Form.Item
        field="dns_mode"
        label="DNS 设置"
        triggerPropName="checked"
        formatter={(mode) => mode === "CUSTOM"}
        getValueFromEvent={(checked: boolean) => (checked ? "CUSTOM" : "PLATFORM_DEFAULT")}
        extra={
          values.dns_mode === "PLATFORM_DEFAULT"
            ? "默认使用平台 DNS，无需填写。"
            : "填写 1–3 个 DNS 服务器 IP 地址。"
        }
      >
        <Checkbox>自定义 DNS 服务器</Checkbox>
      </Form.Item>
      {values.dns_mode === "CUSTOM" && (
        <Form.List<string>
          field="nameservers"
          rules={[
            { type: "array", minLength: 1, maxLength: 3, message: "请填写 1–3 个 DNS 服务器地址" },
          ]}
        >
          {(fields, { add, remove }) => (
            <>
              {fields.map((item, index) => (
                <Form.Item key={item.key} label={`DNS 服务器 ${index + 1}`} required>
                  <div className="flex items-center gap-2">
                    <Form.Item
                      field={item.field}
                      noStyle={{ showErrorTip: true }}
                      rules={[
                        {
                          validator: (address: string | undefined, callback) =>
                            callback(dnsAddressError(address)),
                        },
                      ]}
                    >
                      <Input
                        className="min-w-0 flex-1"
                        aria-label={`DNS 服务器 ${index + 1}`}
                        placeholder="请输入 IP 地址"
                      />
                    </Form.Item>
                    <Button
                      className="shrink-0"
                      icon={<IconDelete />}
                      disabled={disabled || fields.length <= 1}
                      onClick={() => {
                        if (fields.length > 1) remove(index);
                      }}
                      aria-label={`移除 DNS 服务器 ${index + 1}`}
                      title={`移除 DNS 服务器 ${index + 1}`}
                    />
                  </div>
                </Form.Item>
              ))}
              <div className="flex justify-end">
                <Button
                  type="dashed"
                  icon={<IconPlus />}
                  aria-label="添加 DNS 服务器"
                  disabled={disabled || fields.length >= 3}
                  onClick={() => {
                    if (fields.length < 3) add("");
                  }}
                >
                  添加
                </Button>
              </div>
            </>
          )}
        </Form.List>
      )}
    </>
  );
}
