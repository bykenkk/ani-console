import { useState } from "react";
import { Alert, Form, Modal, Radio } from "@arco-design/web-react";
import type { InstanceNetworkInterface, NetworkInterfaceChoice } from "@/api/network";
import { useInstanceNetworkActions } from "@/hooks/useInstanceNetworkActions";
import { validateForm } from "@/lib/form";
import VnicSelect from "@/components/vnics/VnicSelect";

type ChangePrimaryVnicModalProps = {
  consumerId: string;
  version: string;
  current?: InstanceNetworkInterface;
  onCancel: () => void;
};
export default function ChangePrimaryVnicModal({
  consumerId,
  version,
  current,
  onCancel,
}: ChangePrimaryVnicModalProps) {
  const [form] = Form.useForm();
  const [mode, setMode] = useState<NetworkInterfaceChoice["mode"]>(
    current?.desired.mode ?? "automatic",
  );
  const [vnicId, setVnicId] = useState(current?.desired.vnic_id);
  const save = useInstanceNetworkActions("container", consumerId, onCancel);
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
        <Form.Item label="网卡分配方式">
          <Radio.Group value={mode} onChange={setMode}>
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
              consumerKind="container"
              consumerId={consumerId}
              value={vnicId}
              onChange={setVnicId}
            />
          </Form.Item>
        )}
        <div className="mb-4">
          当前网卡：{current?.current_vnic_name || "暂未获取"}
          <br />
          当前 IP 地址：{current?.current_ips?.join(" · ") || "-"}
        </div>
        <Alert
          type="info"
          content={
            mode === "automatic"
              ? "自动分配时，IP 地址可能变化，原网卡及其 IP 地址将保留。配置将在实例重启或下次启动时生效。保存配置不会自动重启实例。"
              : "配置将在实例重启后生效；已停止的实例将在下次启动时生效。保存配置不会自动重启实例。所选网卡将继承实例的安全组配置。"
          }
        />
      </Form>
    </Modal>
  );
}
