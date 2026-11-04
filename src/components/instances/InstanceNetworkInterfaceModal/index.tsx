import { useState } from "react";
import { Alert, Form, Modal, Radio } from "@arco-design/web-react";
import type {
  InstanceNetworkInterface,
  NetworkInterfaceChoice,
  VnicConsumerKind,
} from "@/api/network";
import { useInstanceNetworkActions } from "@/hooks/useInstanceNetworkActions";
import { validateForm } from "@/lib/form";
import VnicSelect from "@/components/vnics/VnicSelect";

type InstanceNetworkInterfaceModalProps = {
  consumerKind: VnicConsumerKind;
  consumerId: string;
  version: string;
  current?: InstanceNetworkInterface;
  onCancel: () => void;
};
export default function InstanceNetworkInterfaceModal({
  consumerKind,
  consumerId,
  version,
  current,
  onCancel,
}: InstanceNetworkInterfaceModalProps) {
  const [form] = Form.useForm();
  const [mode, setMode] = useState<NetworkInterfaceChoice["mode"]>(
    current?.desired.mode ?? "automatic",
  );
  const [vnicId, setVnicId] = useState(current?.desired.vnic_id);
  const save = useInstanceNetworkActions(consumerKind, consumerId, onCancel);
  return (
    <Modal
      visible
      title="切换主网卡"
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
        <Form.Item label="使用模式">
          <Radio.Group value={mode} onChange={setMode}>
            <Radio value="automatic">自动分配</Radio>
            <Radio value="manual">使用手动网卡</Radio>
          </Radio.Group>
        </Form.Item>
        {mode === "manual" && (
          <Form.Item
            field="vnic"
            label="目标网卡"
            initialValue={vnicId}
            rules={[{ required: true, message: "请选择目标网卡" }]}
          >
            <VnicSelect
              consumerKind={consumerKind}
              consumerId={consumerId}
              value={vnicId}
              onChange={setVnicId}
            />
          </Form.Item>
        )}
        <div className="mb-4">
          当前网卡：{current?.current_vnic_name || "无已确认在线端点"}
          <br />
          当前地址：{current?.current_ips?.join(" · ") || "-"}
        </div>
        <Alert
          type="info"
          content={
            mode === "automatic"
              ? "保存后恢复子网自动分配，IP 可能变化。运行实例需重启生效，停止实例在下次启动使用。原手动网卡及地址仍保留。"
              : "保存配置不会重启实例。运行实例需重启生效，停止实例在下次启动使用。目标网卡继承实例安全组。"
          }
        />
      </Form>
    </Modal>
  );
}
