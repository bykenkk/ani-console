import { Form, Input, Switch } from "@arco-design/web-react";
import { Ipv4CidrInput } from "@/components/common";
import { optionalIpv4Error, optionalIpv4WithinCidrError } from "@/lib/validators";
import { parseSubnetDnsServers, parseSubnetExcludedIps } from "./utils";

export type SubnetAddressOptionsFormValues = {
  gateway: string;
  excludeIps: string;
  enableDhcp: boolean;
  dnsServers: string;
};

type SubnetAddressOptionsProps = {
  cidr: string;
  value: SubnetAddressOptionsFormValues;
  onChange: (value: SubnetAddressOptionsFormValues) => void;
};

function validationError(validate: () => unknown): string | undefined {
  try {
    validate();
    return undefined;
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
}

export default function SubnetAddressOptions({ cidr, value, onChange }: SubnetAddressOptionsProps) {
  const gatewayError = cidr
    ? optionalIpv4WithinCidrError(value.gateway, cidr, "网关", "CIDR")
    : optionalIpv4Error(value.gateway, "网关");
  const excludeError = validationError(() => parseSubnetExcludedIps(value.excludeIps, cidr));
  const dnsError = validationError(() => parseSubnetDnsServers(value.dnsServers));
  return (
    <>
      <Form.Item
        label="网关"
        validateStatus={gatewayError ? "error" : undefined}
        help={gatewayError}
      >
        <Ipv4CidrInput
          value={value.gateway}
          onChange={(gateway) => onChange({ ...value, gateway })}
          placeholder="10.0.1.1"
        />
      </Form.Item>
      <Form.Item
        field="excludeIps"
        label="排除 IP（可选）"
        extra="每行一个或用逗号分隔，支持单个 IPv4 或 起始IP..结束IP；地址必须在子网内。"
        validateStatus={excludeError ? "error" : undefined}
        help={excludeError}
        rules={[
          {
            validator: (input, callback) =>
              callback(validationError(() => parseSubnetExcludedIps(input ?? "", cidr))),
          },
        ]}
      >
        <Input.TextArea
          value={value.excludeIps}
          onChange={(excludeIps) => onChange({ ...value, excludeIps })}
          placeholder={"10.0.1.10\n10.0.1.20..10.0.1.30"}
          autoSize={{ minRows: 2, maxRows: 4 }}
        />
      </Form.Item>
      <Form.Item label="DHCP" extra="默认关闭。DNS 服务器配置通过 DHCP 下发，开启 DHCP 后生效。">
        <Switch
          aria-label="启用 DHCP"
          checked={value.enableDhcp}
          onChange={(enableDhcp) => onChange({ ...value, enableDhcp })}
        />
      </Form.Item>
      <Form.Item
        field="dnsServers"
        label="DNS 服务器（可选）"
        extra="每行一个 IPv4 地址，或用逗号分隔。留空不指定 DNS 服务器。"
        validateStatus={dnsError ? "error" : undefined}
        help={dnsError}
        rules={[
          {
            validator: (input, callback) =>
              callback(validationError(() => parseSubnetDnsServers(input ?? ""))),
          },
        ]}
      >
        <Input.TextArea
          value={value.dnsServers}
          onChange={(dnsServers) => onChange({ ...value, dnsServers })}
          placeholder={"223.5.5.5\n8.8.8.8"}
          autoSize={{ minRows: 2, maxRows: 3 }}
        />
      </Form.Item>
    </>
  );
}
