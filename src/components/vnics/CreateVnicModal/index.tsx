import { useState } from "react";
import { Alert, Form, Input, Modal } from "@arco-design/web-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createNetworkVnic } from "@/api/network";
import { validateForm } from "@/lib/form";
import VnicNetworkFields from "../VnicNetworkFields";

type CreateVnicModalProps = { onCancel: () => void; onCreated: () => void };

export default function CreateVnicModal({ onCancel, onCreated }: CreateVnicModalProps) {
  const [form] = Form.useForm();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [subnetId, setSubnetId] = useState("");
  const create = useMutation({
    mutationFn: () => {
      if (!name.trim()) throw new Error("请输入名称");
      return createNetworkVnic({
        name: name.trim(),
        description: description.trim() || undefined,
        subnet_id: subnetId,
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
        <Alert type="info" content="地址将自动分配。网卡独立保留，删除实例不会删除这张网卡。" />
      </Form>
    </Modal>
  );
}
