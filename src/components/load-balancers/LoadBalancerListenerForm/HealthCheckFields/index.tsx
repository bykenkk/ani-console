import { Form, Grid, Input, InputNumber, Select } from "@arco-design/web-react";

type HealthCheckFieldsProps = { udp: boolean };

const fields = [
  { field: "interval_seconds", label: "检查间隔（秒）", min: 1 },
  { field: "timeout_seconds", label: "超时时间（秒）", min: 1 },
  { field: "healthy_threshold", label: "健康阈值", min: 1 },
  { field: "unhealthy_threshold", label: "不健康阈值", min: 1 },
  { field: "port", label: "健康检查端口（0 使用业务端口）", min: 0, max: 65535 },
];
export default function HealthCheckFields({ udp }: HealthCheckFieldsProps) {
  return (
    <>
      <Form.Item label="健康检查协议" field="health_check.protocol" rules={[{ required: true }]}>
        <Select
          options={(udp ? ["TCP"] : ["TCP", "HTTP"]).map((protocol) => ({
            label: protocol,
            value: "LOAD_BALANCER_HEALTH_CHECK_PROTOCOL_" + protocol,
          }))}
        />
      </Form.Item>
      <Grid.Row gutter={16}>
        {fields.map(({ field, label, min, max }) => (
          <Grid.Col span={12} key={field}>
            <Form.Item
              label={label}
              field={"health_check." + field}
              rules={[{ type: "number", min, max: max ?? 4294967295 }]}
            >
              <InputNumber
                min={min}
                max={max ?? 4294967295}
                precision={0}
                className="w-full"
                placeholder="使用后端默认值"
              />
            </Form.Item>
          </Grid.Col>
        ))}
      </Grid.Row>
      <Form.Item
        noStyle
        shouldUpdate={(prev, next) => prev.health_check?.protocol !== next.health_check?.protocol}
      >
        {(values) =>
          !udp &&
          values.health_check?.protocol === "LOAD_BALANCER_HEALTH_CHECK_PROTOCOL_HTTP" && (
            <>
              <Form.Item
                label="检查路径"
                field="health_check.path"
                rules={[{ required: true, match: /^\//, message: "请输入以 / 开头的路径" }]}
              >
                <Input placeholder="/" />
              </Form.Item>
              <Form.Item label="检查主机名" field="health_check.hostname">
                <Input placeholder="可选" />
              </Form.Item>
            </>
          )
        }
      </Form.Item>
    </>
  );
}
