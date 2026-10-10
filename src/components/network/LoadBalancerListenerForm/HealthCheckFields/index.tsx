import { Form, Grid, InputNumber, Select } from "@arco-design/web-react";

const fields = [
  { field: "interval", label: "检查间隔（秒）", min: 1 },
  { field: "timeout", label: "超时时间（秒）", min: 1 },
  { field: "healthyThreshold", label: "健康阈值", min: 1 },
  { field: "unhealthyThreshold", label: "不健康阈值", min: 1 },
  { field: "healthCheckPort", label: "健康检查端口", min: 0, max: 65535 },
  { field: "maxConnections", label: "最大连接数", min: 1 },
];

export default function HealthCheckFields() {
  return (
    <>
      <Form.Item label="健康检查协议" field="healthCheckProtocol" rules={[{ required: true }]}>
        <Select options={["TCP", "HTTP", "HTTPS"]} />
      </Form.Item>
      <Grid.Row gutter={16}>
        {fields.map(({ field, label, min, max }) => (
          <Grid.Col key={field} span={12}>
            <Form.Item
              label={label}
              field={field}
              rules={[
                { required: true, type: "number", min, max, message: `请输入有效的${label}` },
                {
                  validator: (value, callback) => {
                    if (!Number.isInteger(value)) callback("请输入整数");
                  },
                },
              ]}
            >
              <InputNumber min={min} max={max} precision={0} className="w-full" />
            </Form.Item>
          </Grid.Col>
        ))}
      </Grid.Row>
    </>
  );
}
