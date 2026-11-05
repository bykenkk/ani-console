import { SubnetSelect } from "@/components/common";
import { Form, Input, InputNumber, Modal, Select } from "@arco-design/web-react";
import {
  type NetworkLoadBalancerBackendInput,
  type NetworkLoadBalancerListenerResource,
} from "@/api/network";
import { validateForm } from "@/lib/form";
import { optionalIpv4Error } from "@/lib/validators";

type SaveLoadBalancerBackendModalProps = {
  vpcId: string;
  backend?: NetworkLoadBalancerBackendInput;
  listeners?: NetworkLoadBalancerListenerResource[];
  pending?: boolean;
  onCancel: () => void;
  onSave: (backend: NetworkLoadBalancerBackendInput, listenerId?: string) => void | Promise<void>;
};
type LoadBalancerBackendFormValues = {
  listener_id?: string;
  subnet_id: string;
  address: string;
  port: number;
  weight?: number;
};

export default function SaveLoadBalancerBackendModal({
  vpcId,
  backend,
  listeners,
  pending,
  onCancel,
  onSave,
}: SaveLoadBalancerBackendModalProps) {
  const [form] = Form.useForm<LoadBalancerBackendFormValues>();
  return (
    <Modal
      visible
      confirmLoading={pending}
      closable={!pending}
      maskClosable={!pending}
      cancelButtonProps={{ disabled: pending }}
      title={backend ? "编辑后端成员" : "添加后端成员"}
      onCancel={onCancel}
      onOk={async () => {
        const values = await validateForm<LoadBalancerBackendFormValues>(form);
        const address = values.address.trim();
        const sameIdentity =
          backend?.subnet_id === values.subnet_id &&
          backend.address === address &&
          backend.port === values.port;
        await onSave(
          {
            id: sameIdentity ? backend.id : undefined,
            subnet_id: values.subnet_id,
            address,
            port: values.port,
            weight: values.weight,
          },
          values.listener_id,
        );
      }}
    >
      <Form
        form={form}
        disabled={pending}
        layout="vertical"
        initialValues={{
          subnet_id: backend?.subnet_id,
          address: backend?.address,
          port: backend?.port ?? 80,
          weight: backend?.weight ?? 1,
        }}
      >
        {listeners && (
          <Form.Item
            label="监听器"
            field="listener_id"
            rules={[{ required: true, message: "请选择监听器" }]}
          >
            <Select
              options={listeners.map((listener) => ({
                value: listener.id,
                label: `${listener.name} · ${listener.port}`,
                disabled: !!listener.https_redirect_status_code,
              }))}
            />
          </Form.Item>
        )}
        <Form.Item
          label="子网"
          field="subnet_id"
          rules={[{ required: true, message: "请选择后端实例所在子网" }]}
        >
          <SubnetSelect vpcId={vpcId} />
        </Form.Item>
        <Form.Item
          label="实例受管 IP"
          field="address"
          rules={[
            { required: true },
            {
              validator: (value, callback) =>
                callback(optionalIpv4Error(value ?? "", "实例受管 IP")),
            },
          ]}
        >
          <Input placeholder="请输入所选子网内实例的受管 IP" />
        </Form.Item>
        <Form.Item
          label="后端端口"
          field="port"
          rules={[{ required: true, type: "number", min: 1, max: 65535 }]}
        >
          <InputNumber min={1} max={65535} precision={0} />
        </Form.Item>
        <Form.Item label="权重" field="weight" rules={[{ type: "number", min: 0, max: 1000000 }]}>
          <InputNumber min={0} max={1000000} precision={0} placeholder="默认 1" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
