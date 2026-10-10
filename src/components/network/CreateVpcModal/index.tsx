import { useMutation } from "@tanstack/react-query";
import { Form, Input, Modal } from "@arco-design/web-react";
import { useState } from "react";
import { createNetworkVpc } from "@/api/network";
import { Ipv4CidrInput } from "@/components/common";
import { ipv4CidrError, requireIpv4Cidr } from "@/lib/validators";

export default function CreateVpcModal({
  onCancel,
  onCreated,
}: {
  onCancel: () => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState("");
  const [cidr, setCidr] = useState("10.0.0.0/16");
  const [submitted, setSubmitted] = useState(false);
  const cidrError = ipv4CidrError(cidr, "IPv4 CIDR");
  const create = useMutation({
    meta: {
      feedback: {
        channel: "message",
        action: "提交创建",
        successText: "创建请求已受理，请查看 VPC 状态",
        errorFallback: "请求失败",
      },
    },
    mutationFn: async () => {
      setSubmitted(true);
      if (!name.trim()) throw new Error("请输入 VPC 名称");
      return createNetworkVpc({ name: name.trim(), cidr: requireIpv4Cidr(cidr, "IPv4 CIDR") });
    },
    onSuccess: onCreated,
  });
  return (
    <Modal
      visible
      title="创建 VPC"
      onCancel={onCancel}
      onOk={() => create.mutateAsync()}
      confirmLoading={create.isPending}
    >
      <Form layout="vertical">
        <Form.Item
          label="名称"
          required
          validateStatus={submitted && !name.trim() ? "error" : undefined}
          help={submitted && !name.trim() ? "请输入 VPC 名称" : undefined}
        >
          <Input
            value={name}
            onChange={setName}
            placeholder="请输入 VPC 名称"
            maxLength={64}
            showWordLimit
          />
        </Form.Item>
        <Form.Item
          label="IPv4 CIDR"
          required
          validateStatus={cidrError ? "error" : undefined}
          help={cidrError}
        >
          <Ipv4CidrInput value={cidr} onChange={setCidr} placeholder="10.0.0.0" withPrefix />
        </Form.Item>
      </Form>
    </Modal>
  );
}
