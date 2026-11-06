import { Checkbox, Form, Input, Radio, Switch, Typography } from "@arco-design/web-react";
import type { VmCreateFormValues } from "..";

type VmSystemFieldsProps = {
  values: VmCreateFormValues;
  canInitialize: boolean;
};

export default function VmSystemFields({ values, canInitialize }: VmSystemFieldsProps) {
  const passwordFields = (
    <>
      <Form.Item
        field="password"
        label="登录密码"
        extra="密码长度为 8–128 个字符。"
        rules={[
          { required: true, message: "请输入登录密码" },
          { minLength: 8, maxLength: 128, message: "密码长度为 8–128 个字符" },
        ]}
      >
        <Input.Password autoComplete="new-password" placeholder="请输入登录密码" />
      </Form.Item>
    </>
  );
  const publicKeyField = (
    <Form.Item
      field="ssh_public_key"
      label="SSH 公钥"
      extra="填写公钥内容，请勿粘贴私钥。"
      rules={[
        { required: true, message: "请输入 SSH 公钥" },
        { validator: (key, cb) => cb(key && !key.trim() ? "请输入 SSH 公钥" : undefined) },
      ]}
    >
      <Input.TextArea
        placeholder="粘贴 SSH 公钥，例如 ssh-ed25519 AAAA…"
        autoSize={{ minRows: 3, maxRows: 6 }}
      />
    </Form.Item>
  );
  return (
    <>
      {canInitialize ? (
        <>
          <Form.Item
            label="登录方式"
            field="login_method"
            rules={[{ required: true, message: "请选择登录方式" }]}
          >
            <Radio.Group
              options={[
                { value: "PASSWORD", label: "密码" },
                { value: "SSH_PUBLIC_KEY", label: "SSH 公钥" },
                { value: "NONE", label: "不设置" },
              ]}
            />
          </Form.Item>
          {values.login_method !== "NONE" ? (
            <>
              <Form.Item
                field="username"
                label="登录用户名"
                extra="用于登录云主机操作系统。"
                rules={[
                  { required: true, message: "请输入登录用户名" },
                  {
                    validator: (name, cb) =>
                      cb(name && !name.trim() ? "请输入登录用户名" : undefined),
                  },
                ]}
              >
                <Input maxLength={32} placeholder="请输入登录用户名" autoComplete="off" />
              </Form.Item>
              {values.login_method === "PASSWORD" ? passwordFields : publicKeyField}
              <Form.Item field="additional_credential" triggerPropName="checked">
                <Checkbox>
                  {values.login_method === "PASSWORD" ? "同时配置 SSH 公钥" : "同时设置登录密码"}
                </Checkbox>
              </Form.Item>
              {values.additional_credential &&
                (values.login_method === "PASSWORD" ? publicKeyField : passwordFields)}
            </>
          ) : (
            <Typography.Paragraph type="secondary">
              不在创建时初始化登录用户及凭证，请按镜像说明配置登录方式。
            </Typography.Paragraph>
          )}
        </>
      ) : (
        <Typography.Paragraph type="secondary">
          {values.source_kind === "INSTALL_ISO"
            ? "通过 ISO 安装时，请在安装操作系统的过程中配置登录用户。"
            : "当前镜像不支持在创建时初始化登录用户，请按镜像说明配置登录方式。"}
        </Typography.Paragraph>
      )}
      <Form.Item
        field="start_after_create"
        label="创建后自动开机"
        triggerPropName="checked"
        layout="horizontal"
        labelAlign="left"
        labelCol={{ flex: "none" }}
        wrapperCol={{ flex: "auto" }}
      >
        <Switch />
      </Form.Item>
    </>
  );
}
