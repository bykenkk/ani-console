import { Button, Form, Input, Space, Typography } from "@arco-design/web-react";
import { IconSend } from "@arco-design/web-react/icon";
import { useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  getInferenceRuntime,
  invokeInferenceChat,
  type InferenceChatResponse,
  type InferenceService,
} from "@/api/inference";
import { getInferenceKey, getInferenceKeyUnavailableReason } from "@/api/inference-keys";
import LogViewer from "@/components/common/LogViewer";
import { showMessage } from "@/lib/feedback";
import { validateForm } from "@/lib/form";
import InferenceInvocationFields from "./InferenceInvocationFields";

type InferenceInvocationTestProps = { service: InferenceService };
interface InferenceInvocationFormValues {
  keyId: string;
  input: string;
}
type InvocationAttempt = {
  controller: AbortController;
  service: InferenceService;
  keyId: string;
  input: string;
};
type InvocationResult = { response: InferenceChatResponse; elapsedMs: number };

export default function InferenceInvocationTest({ service }: InferenceInvocationTestProps) {
  const [form] = Form.useForm<InferenceInvocationFormValues>();
  const [result, setResult] = useState<InvocationResult>();
  const active = useRef<AbortController | null>(null);
  const submitting = useRef(false);

  useEffect(() => () => active.current?.abort(), []);

  const invocation = useMutation({
    retry: false,
    networkMode: "always",
    mutationFn: async (attempt: InvocationAttempt) => {
      const { controller, service: target, keyId, input } = attempt;
      try {
        const runtime = await getInferenceRuntime(target.id, controller.signal);
        if (controller.signal.aborted) throw new Error("调用测试已取消");
        // 每次发送都读详情，使用重置后的最新 secret；密钥不进入表单或 mutation 参数。
        const key = await getInferenceKey(keyId, controller.signal);
        if (controller.signal.aborted) throw new Error("调用测试已取消");
        const unavailable = getInferenceKeyUnavailableReason(
          key,
          target.served_model_name,
          target.id,
        );
        if (unavailable) throw new Error(`API Key ${unavailable}，请重新选择`);
        const startedAt = performance.now();
        const response = await invokeInferenceChat(
          runtime.invocation_endpoint,
          {
            model: target.served_model_name,
            messages: [{ role: "user", content: input.trim() }],
            max_tokens: 1024,
            stream: false,
          },
          key.secret!,
          controller.signal,
        );
        if (controller.signal.aborted) throw new Error("调用测试已取消");
        if (!response.choices?.length) throw new Error("模型未返回响应内容");
        return { response, elapsedMs: Math.round(performance.now() - startedAt) };
      } catch (error) {
        if (controller.signal.aborted) throw new Error("调用测试已取消");
        throw error;
      }
    },
    meta: { feedback: { channel: "message", action: "调用测试", successText: "调用测试完成" } },
    onSuccess: (response, attempt) => {
      if (active.current === attempt.controller && !attempt.controller.signal.aborted)
        setResult(response);
    },
    onSettled: (_data, _error, attempt) => {
      if (active.current === attempt.controller) active.current = null;
    },
  });

  const submit = async () => {
    if (submitting.current || active.current) return;
    if (typeof AbortController === "undefined") {
      showMessage({ type: "error", content: "当前浏览器不支持调用测试，请升级浏览器" });
      return;
    }
    submitting.current = true;
    const controller = new AbortController();
    active.current = controller;
    try {
      const values = await validateForm<InferenceInvocationFormValues>(form);
      if (controller.signal.aborted) return;
      setResult(undefined);
      await invocation.mutateAsync({
        controller,
        service,
        keyId: values.keyId,
        input: values.input,
      });
    } catch {
      // 字段校验及调用失败统一反馈；不自动重试产生推理请求。
    } finally {
      if (active.current === controller) active.current = null;
      submitting.current = false;
    }
  };

  const choice = result?.response.choices[0];
  const usage = result?.response.usage;
  const responseText = choice
    ? [choice.message.reasoning_content, choice.message.content || "-"].filter(Boolean).join("\n\n")
    : "";

  return (
    <div className="flex flex-col gap-6">
      <Form
        form={form}
        layout="vertical"
        initialValues={{ input: "" }}
        disabled={invocation.isPending}
      >
        <Form.Item
          field="input"
          label="输入内容"
          rules={[
            { required: true, message: "请输入要测试的内容" },
            {
              validator: (value: string | undefined, callback) =>
                callback(value && !value.trim() ? "请输入要测试的内容" : undefined),
            },
          ]}
        >
          <Input.TextArea
            aria-label="模型测试输入内容"
            autoSize={{ minRows: 5, maxRows: 12 }}
            placeholder="请输入要测试的内容"
          />
        </Form.Item>
        <div className="flex flex-wrap items-start gap-2">
          <InferenceInvocationFields
            service={service}
            onKeyChange={() => {
              active.current?.abort();
              setResult(undefined);
            }}
          />
          <Button
            type="primary"
            icon={<IconSend />}
            loading={invocation.isPending}
            onClick={submit}
          >
            发送
          </Button>
          {invocation.isPending && <Button onClick={() => active.current?.abort()}>取消</Button>}
        </div>
      </Form>
      <section className="flex min-w-0 flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Typography.Title heading={6} className="m-0!">
            响应结果
          </Typography.Title>
          <Space wrap>
            <Typography.Text type="secondary">
              耗时：{result ? `${result.elapsedMs} ms` : "-"}
            </Typography.Text>
            {usage && (
              <Typography.Text type="secondary">
                Token：输入 {usage.prompt_tokens} / 输出 {usage.completion_tokens} / 合计{" "}
                {usage.total_tokens}
              </Typography.Text>
            )}
          </Space>
        </div>
        <LogViewer
          text={responseText}
          loading={invocation.isPending}
          emptyDescription="暂无测试结果"
          ariaLabel="推理调用响应结果"
          className="min-h-[240px]"
        />
        {choice?.finish_reason === "length" && (
          <Typography.Text type="secondary">已达到本次输出上限</Typography.Text>
        )}
      </section>
    </div>
  );
}
