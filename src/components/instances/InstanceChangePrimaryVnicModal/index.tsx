import { useMutation, useQueryClient } from "@tanstack/react-query";
import { setInstanceNetworkInterface } from "@/api/instances";
import { setVmNetworkInterface } from "@/api/vms";
import { useState } from "react";
import { Alert, Form, Modal, Radio } from "@arco-design/web-react";
import type {
  InstanceNetworkInterface,
  NetworkInterfaceChoice,
  SetNetworkInterfaceInput,
  VnicConsumerKind,
} from "@/api/network";
import { validateForm } from "@/lib/form";
import { VnicSelect } from "@/components/common";

type InstanceChangePrimaryVnicModalProps = {
  instanceKind: VnicConsumerKind;
  instanceId: string;
  version: string;
  current?: InstanceNetworkInterface;
  onCancel: () => void;
};
export default function InstanceChangePrimaryVnicModal({
  instanceKind,
  instanceId,
  version,
  current,
  onCancel,
}: InstanceChangePrimaryVnicModalProps) {
  const [form] = Form.useForm();
  const [mode, setMode] = useState<NetworkInterfaceChoice["mode"]>(
    current?.desired.mode ?? "automatic",
  );
  const [vnicId, setVnicId] = useState(current?.desired.vnic_id);
  const qc = useQueryClient();
  const networkQueryKey = [
    instanceKind === "vm" ? "vm-network-interfaces" : "container-network-interfaces",
    instanceId,
  ];
  const save = useMutation({
    mutationKey: [instanceKind === "vm" ? "vm-write" : "instance-command", "network", instanceId],
    mutationFn: (input: SetNetworkInterfaceInput) =>
      instanceKind === "vm"
        ? setVmNetworkInterface(instanceId, "primary", input)
        : setInstanceNetworkInterface(instanceId, "primary", input),
    meta: {
      feedback: {
        channel: "message",
        action: "保存网卡配置",
        successText: "网卡配置已提交",
        errorFallback: "保存失败，请刷新后检查配置版本",
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
      title="修改主网卡配置"
      okText="保存配置"
      onCancel={onCancel}
      confirmLoading={save.isPending}
      onOk={async () => {
        await validateForm(form);
        await save.mutateAsync({
          mode,
          vnic_id: mode === "manual" ? vnicId : undefined,
          expected_version: version,
        });
      }}
    >
      <Form form={form} layout="vertical">
        <Alert
          className="mb-4"
          type="info"
          content={
            mode === "automatic"
              ? "自动分配可能改变 IP 地址，原网卡及其 IP 地址将保留。配置将在实例重启或下次启动时生效，不会自动重启实例。"
              : "所选网卡将继承实例的安全组配置，待实例重启或下次启动时生效。此操作不会自动重启实例。"
          }
        />
        <Form.Item label="网卡分配方式">
          <Radio.Group type="button" value={mode} onChange={setMode}>
            <Radio value="automatic">自动分配</Radio>
            <Radio value="manual">选择已有网卡</Radio>
          </Radio.Group>
        </Form.Item>
        {mode === "manual" && (
          <Form.Item
            field="vnic"
            label="选择网卡"
            initialValue={vnicId}
            rules={[{ required: true, message: "请选择已有网卡" }]}
          >
            <VnicSelect
              instanceKind={instanceKind}
              instanceId={instanceId}
              value={vnicId}
              onChange={setVnicId}
            />
          </Form.Item>
        )}
      </Form>
    </Modal>
  );
}
