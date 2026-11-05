import { useState } from "react";
import { Alert, Form, Modal, Radio } from "@arco-design/web-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { NetworkVnic, VnicConsumerKind, SetNetworkInterfaceInput } from "@/api/network";
import { getVmNetworkInterfaces, setVmNetworkInterface } from "@/api/vms";
import { getInstanceNetworkInterfaces, setInstanceNetworkInterface } from "@/api/instances";
import { validateForm } from "@/lib/form";
import { withId } from "@/lib/id";
import BindableInstanceSelect from "./BindableInstanceSelect";

type BindVnicModalProps = { vnic: NetworkVnic; onCancel: () => void };
export default function BindVnicModal({ vnic, onCancel }: BindVnicModalProps) {
  const [form] = Form.useForm();
  const [kind, setKind] = useState<VnicConsumerKind>("vm");
  const [id, setId] = useState("");
  const networkQueryKey = [
    kind === "vm" ? "vm-network-interfaces" : "container-network-interfaces",
    id,
  ];
  const network = useQuery({
    queryKey: networkQueryKey,
    queryFn: ({ signal }) =>
      kind === "vm" ? getVmNetworkInterfaces(id, signal) : getInstanceNetworkInterfaces(id, signal),
    enabled: Boolean(id),
    meta: {
      errorNotification: { id: withId(networkQueryKey[0], id), action: "实例网卡配置加载" },
    },
  });
  const qc = useQueryClient();
  const save = useMutation({
    mutationKey: [kind === "vm" ? "vm-write" : "instance-command", "network", id],
    mutationFn: (input: SetNetworkInterfaceInput) =>
      kind === "vm"
        ? setVmNetworkInterface(id, "primary", input)
        : setInstanceNetworkInterface(id, "primary", input),
    meta: {
      feedback: {
        channel: "message",
        action: "绑定虚拟网卡",
        successText: "绑定已提交",
        errorFallback: "绑定失败，请刷新后重试",
      },
    },
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: networkQueryKey }),
        qc.invalidateQueries({ queryKey: ["network-vnics"] }),
        qc.invalidateQueries({ queryKey: ["network-vnic"] }),
      ]);
      onCancel();
    },
    onError: () => qc.invalidateQueries({ queryKey: networkQueryKey }),
  });
  return (
    <Modal
      visible
      title={`绑定实例：${vnic.name}`}
      okText="绑定"
      onCancel={onCancel}
      confirmLoading={save.isPending}
      okButtonProps={{ disabled: !network.data?.supported }}
      onOk={async () => {
        await validateForm(form);
        if (!network.data?.supported) return;
        await save.mutateAsync({
          mode: "manual",
          vnic_id: vnic.id,
          expected_version: network.data.version,
        });
      }}
    >
      <Form form={form} layout="vertical">
        <Alert
          className="mb-4"
          type="info"
          content="绑定后，网卡将被预留，待实例重启或下次启动时生效。此操作不会自动重启实例。"
        />
        <Form.Item label="实例类型">
          <Radio.Group
            type="button"
            value={kind}
            onChange={(value) => {
              setKind(value);
              setId("");
              form.setFieldValue("instance", undefined);
            }}
          >
            <Radio value="vm">云主机</Radio>
            <Radio value="container">容器</Radio>
          </Radio.Group>
        </Form.Item>
        <Form.Item
          field="instance"
          label="绑定实例"
          rules={[{ required: true, message: "请选择实例" }]}
        >
          <BindableInstanceSelect
            key={kind}
            vnicId={vnic.id}
            instanceKind={kind}
            value={id || undefined}
            onChange={(value) => setId(value ?? "")}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
