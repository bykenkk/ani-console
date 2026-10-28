import { Button, Descriptions, Empty, Input, Space, Typography } from "@arco-design/web-react";
import { useState } from "react";
import { StatusBadge } from "@/components/common";

type InferenceInvocationTestProps = {
  servedModelName: string;
  status?: string;
};

export default function InferenceInvocationTest({
  servedModelName,
  status,
}: InferenceInvocationTestProps) {
  const [input, setInput] = useState("");

  // FIXME(inference-invocation): Governance 尚未提供按服务 ID 执行模型测试的接口。
  // 待确认请求、响应、耗时及流式契约后，通过领域 API 和当前登录态发起测试；
  // 调用目标和凭证由后端处理，不使用 invocation_endpoint、外部 API Key 或 legacy 接口。
  return (
    <div className="flex flex-col gap-6">
      <Descriptions
        column={1}
        data={[
          { label: "服务状态", value: <StatusBadge status={status} /> },
          { label: "服务模型名", value: servedModelName || "-" },
        ]}
      />
      <section className="flex flex-col gap-3">
        <Typography.Title heading={6} className="m-0!">
          输入内容
        </Typography.Title>
        <Input.TextArea
          aria-label="模型测试输入内容"
          value={input}
          onChange={setInput}
          autoSize={{ minRows: 5, maxRows: 12 }}
          placeholder="请输入要测试的内容"
        />
        <Space wrap>
          <Button type="primary" disabled title="调用测试暂未开放">
            发送测试
          </Button>
          <Button disabled={!input} onClick={() => setInput("")}>
            清空
          </Button>
          <Typography.Text type="secondary">调用测试暂未开放</Typography.Text>
        </Space>
      </section>
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <Typography.Title heading={6} className="m-0!">
            响应结果
          </Typography.Title>
          <Typography.Text type="secondary">耗时：-</Typography.Text>
        </div>
        <div className="flex min-h-[240px] items-center justify-center">
          <Empty description="暂无测试结果" />
        </div>
      </section>
    </div>
  );
}
