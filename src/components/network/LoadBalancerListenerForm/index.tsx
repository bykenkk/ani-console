import { Form, Input, InputNumber, Radio, Select } from "@arco-design/web-react";
import type { FormInstance } from "@arco-design/web-react/es/Form";
import { useState } from "react";
import type { NetworkLoadBalancerListener, NetworkLoadBalancerProtocol } from "@/api/network";
import HealthCheckFields from "./HealthCheckFields";
import ListenerOptions from "./ListenerOptions";

export type LoadBalancerListenerValues = NetworkLoadBalancerListener;
export default function LoadBalancerListenerForm({
  form,
  usedPorts = [],
  initialValues,
}: {
  form: FormInstance<LoadBalancerListenerValues>;
  usedPorts?: number[];
  initialValues?: LoadBalancerListenerValues;
}) {
  const [protocol, setProtocol] = useState<NetworkLoadBalancerProtocol>(
    initialValues?.protocol ?? "LOAD_BALANCER_LISTENER_PROTOCOL_HTTP",
  );
  const http = [
    "LOAD_BALANCER_LISTENER_PROTOCOL_HTTP",
    "LOAD_BALANCER_LISTENER_PROTOCOL_HTTPS",
  ].includes(protocol);
  const tls = [
    "LOAD_BALANCER_LISTENER_PROTOCOL_HTTPS",
    "LOAD_BALANCER_LISTENER_PROTOCOL_SSL",
  ].includes(protocol);
  const udp = protocol === "LOAD_BALANCER_LISTENER_PROTOCOL_UDP";
  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={{
        name: "",
        protocol: "LOAD_BALANCER_LISTENER_PROTOCOL_HTTP",
        port: 80,
        backends: [],
        algorithm: "LOAD_BALANCER_ALGORITHM_ROUND_ROBIN",
        health_check: { protocol: "LOAD_BALANCER_HEALTH_CHECK_PROTOCOL_TCP", port: 0 },
        session_persistence: { mode: "LOAD_BALANCER_SESSION_MODE_DISABLED" },
        https_redirect_status_code: 0,
        ...initialValues,
      }}
    >
      <Form.Item
        label="名称"
        field="name"
        rules={[{ required: true, match: /\S/, message: "请输入监听器名称" }]}
      >
        <Input maxLength={63} />
      </Form.Item>
      <Form.Item label="监听协议" field="protocol" rules={[{ required: true }]}>
        <Radio.Group
          type="button"
          options={["HTTP", "HTTPS", "TCP", "UDP", "SSL"].map((label) => ({
            label,
            value: "LOAD_BALANCER_LISTENER_PROTOCOL_" + label,
          }))}
          onChange={(value: NetworkLoadBalancerProtocol) => {
            setProtocol(value);
            if (value === "LOAD_BALANCER_LISTENER_PROTOCOL_UDP")
              form.setFieldValue("health_check", {
                ...form.getFieldsValue().health_check,
                protocol: "LOAD_BALANCER_HEALTH_CHECK_PROTOCOL_TCP",
              });
          }}
        />
      </Form.Item>
      <Form.Item
        label="监听端口"
        field="port"
        rules={[
          { required: true, type: "number", min: 1, max: 65535 },
          {
            validator: (value, callback) =>
              callback(usedPorts.includes(value) ? "该监听端口已存在" : undefined),
          },
        ]}
      >
        <InputNumber min={1} max={65535} precision={0} />
      </Form.Item>
      {tls && (
        <>
          <Form.Item
            label="TLS 证书名称"
            field="certificate_ref.name"
            rules={[{ required: true, match: /\S/ }]}
          >
            <Input placeholder="请输入证书名称" />
          </Form.Item>
          <Form.Item
            label="证书命名空间"
            field="certificate_ref.namespace"
            rules={[{ required: true, match: /\S/ }]}
          >
            <Input />
          </Form.Item>
        </>
      )}
      <Form.Item label="调度算法" field="algorithm" rules={[{ required: true }]}>
        <Select
          options={[
            { label: "轮询", value: "LOAD_BALANCER_ALGORITHM_ROUND_ROBIN" },
            { label: "最少请求", value: "LOAD_BALANCER_ALGORITHM_LEAST_REQUEST" },
            { label: "源 IP 哈希", value: "LOAD_BALANCER_ALGORITHM_SOURCE_IP" },
          ]}
        />
      </Form.Item>
      <ListenerOptions
        http={http}
        udp={udp}
        redirectAllowed={protocol === "LOAD_BALANCER_LISTENER_PROTOCOL_HTTP"}
      />
      <Form.Item
        noStyle
        shouldUpdate={(prev, next) =>
          prev.https_redirect_status_code !== next.https_redirect_status_code ||
          prev.protocol !== next.protocol
        }
      >
        {(values) =>
          !(
            values.protocol === "LOAD_BALANCER_LISTENER_PROTOCOL_HTTP" &&
            values.https_redirect_status_code
          ) && (
            <>
              <HealthCheckFields udp={udp} />
            </>
          )
        }
      </Form.Item>
    </Form>
  );
}
