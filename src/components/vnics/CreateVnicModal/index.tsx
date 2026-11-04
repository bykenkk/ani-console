import { useState } from "react";
import { Alert, Form, Input, Modal } from "@arco-design/web-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createNetworkVnic } from "@/api/network";
import { validateForm } from "@/lib/form";
import { optionalIpv4, optionalIpv4Error } from "@/lib/validators";
import VnicNetworkFields from "../VnicNetworkFields";

type CreateVnicModalProps = { onCancel: () => void; onCreated: () => void };

export default function CreateVnicModal({ onCancel, onCreated }: CreateVnicModalProps) {
  const [form] = Form.useForm();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [subnetId, setSubnetId] = useState("");
  const [requestedIp, setRequestedIp] = useState("");
  const [requestedMac, setRequestedMac] = useState("");
  const create = useMutation({
    mutationFn: () => {
      if (!name.trim()) throw new Error("请输入名称");
      return createNetworkVnic({
        name: name.trim(),
        description: description.trim() || undefined,
        subnet_id: subnetId,
        requested_ip: optionalIpv4(requestedIp, "申请 IP 地址"),
        requested_mac: requestedMac.trim().toLowerCase() || undefined,
      });
    },
    meta: {
      feedback: {
        channel: "message",
        action: "申请虚拟网卡",
        successText: "创建已提交",
        errorFallback: "申请失败",
      },
    },
    onSuccess: async () => {
      // TODO(resource-task): 资源创建的任务跟踪待统一接入。
      await qc.invalidateQueries({ queryKey: ["network-vnics"] });
      onCreated();
      onCancel();
    },
  });
  return (
    <Modal
      visible
      title="申请虚拟网卡"
      onCancel={onCancel}
      confirmLoading={create.isPending}
      onOk={async () => {
        await validateForm(form);
        await create.mutateAsync();
      }}
    >
      <Form form={form} layout="vertical">
        <Form.Item field="name" label="名称" rules={[{ required: true, message: "请输入名称" }]}>
          <Input value={name} onChange={setName} maxLength={64} />
        </Form.Item>
        <Form.Item label="描述">
          <Input.TextArea value={description} onChange={setDescription} maxLength={256} />
        </Form.Item>
        <VnicNetworkFields form={form} onSubnetChange={setSubnetId} />
        <Form.Item
          field="requested_ip"
          label="申请 IP 地址（可选）"
          extra="填写所选子网内的 IPv4 地址，范围和可用性由系统检查。"
          rules={[
            {
              validator: (value, callback) =>
                callback(optionalIpv4Error(value ?? "", "申请 IP 地址")),
            },
          ]}
        >
          <Input
            value={requestedIp}
            onChange={setRequestedIp}
            placeholder="留空自动分配"
            allowClear
          />
        </Form.Item>
        <Form.Item
          field="requested_mac"
          label="申请 MAC 地址（可选）"
          normalize={(value) => value?.toLowerCase()}
          extra="MAC 地址仅需在同一子网的手动网卡中唯一。"
          rules={[
            {
              validator: (value, callback) => {
                const mac = (value ?? "").trim();
                callback(
                  !mac || /^(?:[0-9a-f]{2}:){5}[0-9a-f]{2}$/i.test(mac)
                    ? undefined
                    : "请输入有效的 MAC 地址，例如 02:00:00:00:00:01",
                );
              },
            },
          ]}
        >
          <Input
            value={requestedMac}
            onChange={(value) => setRequestedMac(value.toLowerCase())}
            placeholder="留空自动分配，例如 02:00:00:00:00:01"
            allowClear
          />
        </Form.Item>
        <Alert
          type="info"
          content="IP 和 MAC 留空时自动分配。网卡独立保留，删除实例不会删除这张网卡。"
        />
      </Form>
    </Modal>
  );
}
