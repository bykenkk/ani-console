import {
  Checkbox,
  Form,
  Grid,
  Input,
  InputNumber,
  Radio,
  Select,
  Space,
} from "@arco-design/web-react";
import type { FormInstance } from "@arco-design/web-react/es/Form";
import { useState } from "react";
import HealthCheckFields from "./HealthCheckFields";

export type LoadBalancerListenerValues = {
  name: string;
  protocol: "http" | "https" | "tcp" | "udp" | "ssl";
  port: number;
  target_port: number;
  sessionPersistence: "disabled" | "source_ip" | "cookie";
  algorithm: "round_robin" | "least_connections" | "source_ip";
  healthCheckProtocol: "TCP" | "HTTP" | "HTTPS";
  interval: number;
  timeout: number;
  healthyThreshold: number;
  unhealthyThreshold: number;
  healthCheckPort: number;
  maxConnections: number;
  clientIp: boolean;
  compression: boolean;
  httpsRedirect: boolean;
  http2: boolean;
  webSocket: boolean;
};

export default function LoadBalancerListenerForm({
  form,
  usedPorts = [],
  initialValues,
}: {
  form: FormInstance<LoadBalancerListenerValues>;
  usedPorts?: number[];
  initialValues?: LoadBalancerListenerValues;
}) {
  const [protocol, setProtocol] = useState(initialValues?.protocol ?? "http");
  const isHttp = protocol === "http" || protocol === "https";
  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={{
        name: "",
        protocol: "http",
        port: 80,
        target_port: 80,
        sessionPersistence: "disabled",
        algorithm: "round_robin",
        healthCheckProtocol: "TCP",
        interval: 5,
        timeout: 60,
        healthyThreshold: 2,
        unhealthyThreshold: 2,
        healthCheckPort: 0,
        maxConnections: 20000,
        clientIp: true,
        compression: false,
        httpsRedirect: false,
        http2: true,
        webSocket: true,
        ...initialValues,
      }}
    >
      <Form.Item
        label="名称"
        field="name"
        rules={[
          { required: true, message: "请输入监听器名称" },
          {
            validator: (value, callback) => {
              if (!value?.trim()) callback("请输入监听器名称");
            },
          },
        ]}
      >
        <Input placeholder="请输入名称" maxLength={64} showWordLimit />
      </Form.Item>
      <Form.Item
        label="监听协议"
        field="protocol"
        rules={[{ required: true, message: "请选择监听协议" }]}
      >
        <Radio.Group
          type="button"
          onChange={setProtocol}
          options={["http", "https", "tcp", "udp", "ssl"].map((value) => ({
            label: value.toUpperCase(),
            value,
          }))}
        />
      </Form.Item>
      <Form.Item label="会话保持" field="sessionPersistence" rules={[{ required: true }]}>
        <Select
          options={[
            { label: "停用", value: "disabled" },
            { label: "源 IP", value: "source_ip" },
            { label: "Cookie", value: "cookie" },
          ]}
        />
      </Form.Item>
      <Grid.Row gutter={16}>
        <Grid.Col span={12}>
          <Form.Item
            label="负载均衡端口"
            field="port"
            rules={[
              {
                required: true,
                type: "number",
                min: 1,
                max: 65535,
                message: "请输入 1–65535 之间的端口",
              },
              {
                validator: (value, callback) => {
                  if (!Number.isInteger(value)) callback("端口必须是整数");
                  else if (usedPorts.includes(value)) callback("该监听端口已存在");
                },
              },
            ]}
          >
            <InputNumber min={1} max={65535} precision={0} className="w-full" />
          </Form.Item>
        </Grid.Col>
        <Grid.Col span={12}>
          <Form.Item
            label="目标端口"
            field="target_port"
            rules={[
              {
                required: true,
                type: "number",
                min: 1,
                max: 65535,
                message: "请输入 1–65535 之间的端口",
              },
              {
                validator: (value, callback) => {
                  if (!Number.isInteger(value)) callback("端口必须是整数");
                },
              },
            ]}
          >
            <InputNumber min={1} max={65535} precision={0} className="w-full" />
          </Form.Item>
        </Grid.Col>
      </Grid.Row>
      <Form.Item label="负载均衡算法" field="algorithm" rules={[{ required: true }]}>
        <Select
          options={[
            { label: "轮询", value: "round_robin" },
            { label: "最少连接", value: "least_connections" },
            { label: "源 IP 哈希", value: "source_ip" },
          ]}
        />
      </Form.Item>
      <HealthCheckFields />
      {isHttp && (
        <Form.Item label="附加选项">
          <Space direction="vertical">
            <Form.Item field="clientIp" triggerPropName="checked" noStyle>
              <Checkbox disabled>获取客户端 IP（X-Forwarded-For）</Checkbox>
            </Form.Item>
            <Form.Item field="compression" triggerPropName="checked" noStyle>
              <Checkbox>数据压缩（gzip）</Checkbox>
            </Form.Item>
            {protocol === "http" && (
              <Form.Item field="httpsRedirect" triggerPropName="checked" noStyle>
                <Checkbox>启用 HTTPS 重定向</Checkbox>
              </Form.Item>
            )}
            <Form.Item field="http2" triggerPropName="checked" noStyle>
              <Checkbox disabled>HTTP2</Checkbox>
            </Form.Item>
            <Form.Item field="webSocket" triggerPropName="checked" noStyle>
              <Checkbox disabled>WebSocket</Checkbox>
            </Form.Item>
          </Space>
        </Form.Item>
      )}
    </Form>
  );
}
