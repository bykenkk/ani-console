import { Checkbox, Form, InputNumber, Select } from "@arco-design/web-react";

type ListenerOptionsProps = {
  http: boolean;
  udp: boolean;
  redirectAllowed: boolean;
};

export default function ListenerOptions({ http, udp, redirectAllowed }: ListenerOptionsProps) {
  return (
    <>
      {!udp && (
        <Form.Item
          label="最大连接数"
          field="max_connections"
          rules={[{ type: "number", min: 1, max: 4294967295 }]}
        >
          <InputNumber min={1} max={4294967295} precision={0} placeholder="使用后端默认值" />
        </Form.Item>
      )}
      {http && (
        <>
          <Form.Item label="会话保持" field="session_persistence.mode">
            <Select
              options={[
                { label: "停用", value: "LOAD_BALANCER_SESSION_MODE_DISABLED" },
                {
                  label: "Cookie（指定有效期）",
                  value: "LOAD_BALANCER_SESSION_MODE_COOKIE_TIMEOUT",
                },
                { label: "Cookie（会话期）", value: "LOAD_BALANCER_SESSION_MODE_COOKIE_SESSION" },
              ]}
            />
          </Form.Item>
          <Form.Item
            noStyle
            shouldUpdate={(prev, next) =>
              prev.session_persistence?.mode !== next.session_persistence?.mode
            }
          >
            {(values) =>
              values.session_persistence?.mode === "LOAD_BALANCER_SESSION_MODE_COOKIE_TIMEOUT" && (
                <Form.Item
                  label="Cookie 有效期（秒）"
                  field="session_persistence.cookie_expiry_seconds"
                  rules={[{ required: true, type: "number", min: 1, max: 4294967295 }]}
                >
                  <InputNumber min={1} max={4294967295} precision={0} />
                </Form.Item>
              )
            }
          </Form.Item>
          <Form.Item field="gzip_enabled" triggerPropName="checked">
            <Checkbox>启用 gzip 压缩</Checkbox>
          </Form.Item>
        </>
      )}
      {redirectAllowed && (
        <Form.Item label="HTTPS 重定向" field="https_redirect_status_code">
          <Select
            options={[
              { label: "关闭", value: 0 },
              { label: "301 永久重定向", value: 301 },
              { label: "302 临时重定向", value: 302 },
            ]}
          />
        </Form.Item>
      )}
    </>
  );
}
