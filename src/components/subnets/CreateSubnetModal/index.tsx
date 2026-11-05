import { createNetworkSubnet, type NetworkVPC } from "@/api/network";
import { Ipv4CidrInput, VpcSelect } from "@/components/common";
import { validateForm } from "@/lib/form";
import { Form, Input, Modal } from "@arco-design/web-react";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import {
  ipv4CidrWithinError,
  optionalIpv4WithinCidr,
  requireIpv4CidrWithin,
  subnetFixedOctets,
  suggestGatewayIp,
  suggestSubnetCidr,
} from "@/lib/validators";
import SubnetAddressOptions, { type SubnetAddressOptionsFormValues } from "../SubnetAddressOptions";
import { parseSubnetDnsServers, parseSubnetExcludedIps } from "../SubnetAddressOptions/utils";

type CreateSubnetModalProps = {
  onCancel: () => void;
  onCreated: () => void;
};

export default function CreateSubnetModal({ onCancel, onCreated }: CreateSubnetModalProps) {
  const [form] = Form.useForm();
  const [name, setName] = useState("");
  const [selectedVpc, setSelectedVpc] = useState<NetworkVPC>();
  const vpcId = selectedVpc?.id ?? "";
  const [cidr, setCidr] = useState("10.0.1.0/24");
  const [addressOptions, setAddressOptions] = useState<SubnetAddressOptionsFormValues>({
    gateway: "",
    excludeIps: "",
    enableDhcp: false,
    dnsServers: "",
  });
  const selectedVpcCidr = selectedVpc?.cidr ?? "";
  const cidrError = selectedVpcCidr
    ? ipv4CidrWithinError(cidr, selectedVpcCidr, "CIDR", "VPC CIDR")
    : undefined;
  const fixedOctets = selectedVpcCidr ? subnetFixedOctets(selectedVpcCidr) : [];
  const selectedVpcPrefix = selectedVpcCidr ? Number(selectedVpcCidr.split("/")[1]) : 0;

  const setSubnetCidr = (nextCidr: string) => {
    setCidr(nextCidr);
    try {
      const gateway = suggestGatewayIp(nextCidr);
      setAddressOptions((current) => ({ ...current, gateway }));
    } catch {
      /* Keep the last valid gateway while editing. */
    }
  };
  const createSubnet = useMutation({
    meta: {
      feedback: {
        channel: "message",
        action: "创建子网",
        successText: "子网创建已提交",
        errorFallback: "请求失败",
      },
    },
    mutationFn: async () => {
      const trimmedName = name.trim();
      if (!trimmedName) throw new Error("请输入子网名称");
      if (!selectedVpcCidr) throw new Error("请选择 VPC");
      const submitData = {
        name: trimmedName,
        vpc_id: vpcId,
        cidr: requireIpv4CidrWithin(cidr, selectedVpcCidr, "CIDR", "VPC CIDR"),
        gateway: optionalIpv4WithinCidr(addressOptions.gateway, cidr, "网关", "CIDR"),
        exclude_ips: parseSubnetExcludedIps(addressOptions.excludeIps, cidr),
        enable_dhcp: addressOptions.enableDhcp,
        dns_servers: parseSubnetDnsServers(addressOptions.dnsServers),
      };
      return createNetworkSubnet(submitData);
    },
    onSuccess: () => {
      onCreated();
      onCancel();
    },
  });
  return (
    <Modal
      visible
      title="创建子网"
      onCancel={onCancel}
      onOk={async () => {
        await validateForm(form);
        return createSubnet.mutateAsync();
      }}
      confirmLoading={createSubnet.isPending}
      unmountOnExit
    >
      <Form form={form} layout="vertical">
        <Form.Item
          field="name"
          label="名称"
          rules={[{ required: true, message: "请输入子网名称" }]}
        >
          <Input
            value={name}
            onChange={setName}
            placeholder="请输入子网名称"
            maxLength={64}
            showWordLimit
          />
        </Form.Item>
        <Form.Item field="vpcId" label="VPC" rules={[{ required: true, message: "请选择 VPC" }]}>
          <VpcSelect
            canManage
            value={vpcId || undefined}
            onChange={(_, vpc) => {
              setSelectedVpc(vpc);
              if (vpc) setSubnetCidr(suggestSubnetCidr(vpc.cidr));
            }}
            placeholder="选择 VPC"
          />
        </Form.Item>
        <Form.Item
          label="CIDR"
          required
          validateStatus={cidrError ? "error" : undefined}
          help={cidrError}
        >
          <Ipv4CidrInput
            value={cidr}
            onChange={setSubnetCidr}
            placeholder="10.0.1.0"
            withPrefix
            disabledOctets={fixedOctets}
            minPrefix={selectedVpcPrefix}
          />
        </Form.Item>
        <SubnetAddressOptions cidr={cidr} value={addressOptions} onChange={setAddressOptions} />
      </Form>
    </Modal>
  );
}
