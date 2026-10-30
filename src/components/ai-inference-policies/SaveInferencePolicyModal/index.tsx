import { useRef, useState } from "react";
import { Alert, Form, Modal } from "@arco-design/web-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createInferencePolicy,
  updateInferencePolicy,
  type InferencePolicy,
  type InferencePolicyInput,
} from "@/api/inference-policies";
import { validateForm } from "@/lib/form";
import InferencePolicyFormFields, {
  type InferencePolicyFormValues,
} from "../InferencePolicyFormFields";
import type { InferencePolicyLimit } from "../InferencePolicyLimitField";

type SaveInferencePolicyModalProps = {
  policy?: InferencePolicy;
  onCancel: () => void;
  onSaved: () => void;
};

function policyFormValues(policy?: InferencePolicy): InferencePolicyFormValues {
  const limit = (value = 0): InferencePolicyLimit => ({
    enabled: value > 0,
    limit: value || undefined,
  });
  return {
    name: policy?.name ?? "",
    scope: { modelNames: [...(policy?.allowed_model_names ?? [])] },
    requests_per_second: limit(policy?.requests_per_second),
    requests_per_minute: limit(policy?.requests_per_minute),
    requests_per_hour: limit(policy?.requests_per_hour),
  };
}

function policyFormInput(values: InferencePolicyFormValues): InferencePolicyInput {
  const limit = (value: InferencePolicyLimit) => (value.enabled ? value.limit! : 0);
  return {
    name: values.name.trim(),
    allowed_model_names: values.scope.modelNames,
    requests_per_second: limit(values.requests_per_second),
    requests_per_minute: limit(values.requests_per_minute),
    requests_per_hour: limit(values.requests_per_hour),
  };
}

export default function SaveInferencePolicyModal({
  policy,
  onCancel,
  onSaved,
}: SaveInferencePolicyModalProps) {
  const [form] = Form.useForm<InferencePolicyFormValues>();
  const [emptyModelInput, setEmptyModelInput] = useState<InferencePolicyInput>();
  const submitting = useRef(false);
  const queryClient = useQueryClient();
  const save = useMutation({
    mutationFn: (input: InferencePolicyInput) =>
      policy ? updateInferencePolicy(policy.id, input) : createInferencePolicy(input),
    meta: {
      feedback: {
        channel: "message",
        action: policy ? "编辑访问策略" : "创建访问策略",
        successText: policy ? "访问策略已更新" : "访问策略已创建",
      },
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["governance-inference-policies"] }),
        ...(policy
          ? [
              queryClient.invalidateQueries({
                queryKey: ["governance-inference-policy", policy.id],
                exact: true,
              }),
            ]
          : []),
        queryClient.resetQueries({ queryKey: ["governance-inference-keys", "options"] }),
      ]);
      onSaved();
    },
  });

  const submit = async (confirmedInput?: InferencePolicyInput) => {
    if (submitting.current) return;
    submitting.current = true;
    try {
      const input =
        confirmedInput ?? policyFormInput(await validateForm<InferencePolicyFormValues>(form));
      if (!confirmedInput && !input.allowed_model_names.length) {
        setEmptyModelInput(input);
        return;
      }
      await save.mutateAsync(input);
    } catch {
      // 表单校验和请求失败使用统一反馈，保留当前输入。
    } finally {
      submitting.current = false;
    }
  };

  return (
    <>
      <Modal
        visible
        title={policy ? "编辑访问策略" : "创建访问策略"}
        okText={policy ? "保存" : "创建"}
        onOk={() => submit()}
        onCancel={() => {
          if (!submitting.current) onCancel();
        }}
        confirmLoading={save.isPending}
        closable={!save.isPending}
        escToExit={!save.isPending}
        maskClosable={false}
        cancelButtonProps={{ disabled: save.isPending }}
        style={{ width: 680, maxWidth: "calc(100vw - 48px)" }}
      >
        {policy && (
          <Alert
            className="mb-4"
            type="warning"
            content="修改将影响所有绑定此策略的 API Key；各 API Key 仍分别计数，已有计数不会清零。"
          />
        )}
        <Form
          form={form}
          layout="vertical"
          disabled={save.isPending}
          autoComplete="off"
          initialValues={policyFormValues(policy)}
        >
          <InferencePolicyFormFields disabled={save.isPending} />
        </Form>
      </Modal>
      {emptyModelInput && (
        <Modal
          visible
          title="确认拒绝全部模型"
          okText="确认保存"
          okButtonProps={{ status: "danger" }}
          confirmLoading={save.isPending}
          onOk={() => submit(emptyModelInput)}
          onCancel={() => {
            if (!submitting.current) setEmptyModelInput(undefined);
          }}
          closable={!save.isPending}
          escToExit={!save.isPending}
          maskClosable={false}
          cancelButtonProps={{ disabled: save.isPending }}
        >
          未选择授权模型，保存后将拒绝全部模型调用。是否继续？
        </Modal>
      )}
    </>
  );
}
