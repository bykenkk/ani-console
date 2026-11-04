import { useState } from "react";
import { Alert, Form, Modal, Radio } from "@arco-design/web-react";
import { useQuery } from "@tanstack/react-query";
import type { NetworkVnic, VnicConsumerKind, VnicBindingTarget } from "@/api/network";
import { getVmNetworkInterfaces } from "@/api/vms";
import { getInstanceNetworkInterfaces } from "@/api/instances";
import { useInstanceNetworkActions } from "@/hooks/useInstanceNetworkActions";
import { validateForm } from "@/lib/form";
import { withId } from "@/lib/id";
import VnicBindingTargetSelect from "../VnicBindingTargetSelect";

type BindVnicModalProps = { vnic: NetworkVnic; onCancel: () => void };
export default function BindVnicModal({ vnic, onCancel }: BindVnicModalProps) {
  const [form] = Form.useForm();
  const [kind, setKind] = useState<VnicConsumerKind>("vm");
  const [id, setId] = useState("");
  const [selected, setSelected] = useState<VnicBindingTarget>();
  const network = useQuery({
    queryKey: ["network-interfaces", kind, id],
    queryFn: ({ signal }) =>
      kind === "vm" ? getVmNetworkInterfaces(id, signal) : getInstanceNetworkInterfaces(id, signal),
    enabled: Boolean(id),
    meta: {
      errorNotification: { id: withId("network-interfaces", kind, id), action: "实例网卡配置加载" },
    },
  });
  const current = network.data?.items.find((item) => item.slot === "primary");
  const save = useInstanceNetworkActions(kind, id, onCancel);
  return (
    <Modal
      visible
      title="绑定实例"
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
        <Form.Item label="实例类型">
          <Radio.Group
            value={kind}
            onChange={(value) => {
              setKind(value);
              setId("");
              setSelected(undefined);
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
          <VnicBindingTargetSelect
            key={kind}
            vnicId={vnic.id}
            consumerKind={kind}
            value={id || undefined}
            onChange={setId}
            onSelected={setSelected}
          />
        </Form.Item>
        <div className="mb-4 flex flex-col gap-2">
          <div>当前网卡：{current?.current_vnic_name || "无已确认在线端点"}</div>
          <div>当前地址：{current?.current_ips?.join(" · ") || "-"}</div>
          <div>
            目标网卡：{vnic.name} · {vnic.ips?.join(" · ") || vnic.primary_ip || "-"}
          </div>
          <div>
            继承安全组：
            {selected
              ? selected.security_group_ids?.join(" · ") || "无安全组，将清空网卡原安全组"
              : "-"}
          </div>
        </div>
        <Alert
          type="info"
          content="保存配置不会重启实例。运行实例需重启生效，停止实例在下次启动使用；目标网卡将被预留。"
        />
      </Form>
    </Modal>
  );
}
