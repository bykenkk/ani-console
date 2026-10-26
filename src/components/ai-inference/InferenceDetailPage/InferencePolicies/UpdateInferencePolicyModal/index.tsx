import { useRef, useState } from "react";
import { Form, Modal } from "@arco-design/web-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  updateInferencePolicy,
  type InferenceServicePolicy,
  type InferenceRateLimit,
} from "@/api/inference";
import { validateForm } from "@/lib/form";
import InferencePolicyTenantFields, {
  type InferencePolicyTenant,
} from "../InferencePolicyTenantFields";

type UpdateInferencePolicyModalProps = {
  serviceId: string;
  policy: InferenceServicePolicy;
  onCancel: () => void;
};
interface UpdateInferencePolicyFormValues {
  tenants: InferencePolicyTenant[];
}

export default function UpdateInferencePolicyModal({
  serviceId,
  policy,
  onCancel,
}: UpdateInferencePolicyModalProps) {
  const [form] = Form.useForm<UpdateInferencePolicyFormValues>();
  const submitting = useRef(false);
  const qc = useQueryClient();
  const [confirming, setConfirming] = useState(false);
  const save = useMutation({
    mutationFn: (tenants: InferencePolicyTenant[]) => {
      const limits: Record<string, InferenceRateLimit> = {};
      for (const row of tenants) {
        if (row.requests_per_minute || row.requests_per_hour)
          limits[row.tenant_id.trim()] = {
            requests_per_minute: row.requests_per_minute ?? 0,
            requests_per_hour: row.requests_per_hour ?? 0,
          };
      }
      return updateInferencePolicy(serviceId, {
        allowed_tenants: tenants.map((row) => row.tenant_id.trim()),
        ...(Object.keys(limits).length ? { rate_limits: limits } : {}),
      });
    },
    meta: {
      feedback: {
        channel: "message",
        action: "保存推理访问策略",
        successText: "推理访问策略已保存",
        errorFallback: "保存失败",
      },
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["governance-inference-policy", serviceId] });
      onCancel();
    },
  });
  const busy = save.isPending || confirming;
  const submit = async () => {
    if (submitting.current || busy) return;
    submitting.current = true;
    try {
      const { tenants } = await validateForm<UpdateInferencePolicyFormValues>(form);
      if (!tenants.length) {
        setConfirming(true);
        Modal.confirm({
          title: "拒绝所有数据面调用",
          content: "保存空白名单后，所有租户都将无法调用此推理服务。确定保存？",
          okButtonProps: { status: "danger" },
          onCancel: () => setConfirming(false),
          onOk: async () => {
            try {
              await save.mutateAsync(tenants);
            } finally {
              setConfirming(false);
            }
          },
        });
      } else await save.mutateAsync(tenants);
    } catch {
      // 字段校验和请求反馈分别由统一入口处理。
    } finally {
      submitting.current = false;
    }
  };
  return (
    <Modal
      visible
      title="编辑推理访问策略"
      okText="保存"
      onOk={submit}
      onCancel={onCancel}
      confirmLoading={save.isPending}
      closable={!busy}
      escToExit={!busy}
      cancelButtonProps={{ disabled: busy }}
      style={{ width: 860, maxWidth: "calc(100vw - 48px)" }}
    >
      <Form
        form={form}
        layout="vertical"
        disabled={busy}
        initialValues={{
          tenants: policy.allowed_tenants.map((id) => ({
            tenant_id: id,
            requests_per_minute: policy.rate_limits?.[id]?.requests_per_minute ?? 0,
            requests_per_hour: policy.rate_limits?.[id]?.requests_per_hour ?? 0,
          })),
        }}
      >
        <Form.Item
          field="tenants"
          label="允许调用的租户"
          extra="请求上限为 0 表示不限"
          rules={[
            {
              validator: (value: InferencePolicyTenant[] = [], callback) => {
                const seen = new Set<string>();
                for (const [index, row] of value.entries()) {
                  const id = row.tenant_id.trim();
                  if (
                    !/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/.test(id) ||
                    id === "00000000-0000-0000-0000-000000000000"
                  ) {
                    callback(`第 ${index + 1} 项请输入规范的小写租户 UUID`);
                    return;
                  }
                  if (seen.has(id)) {
                    callback(`第 ${index + 1} 项租户重复`);
                    return;
                  }
                  seen.add(id);
                  if (
                    [row.requests_per_minute, row.requests_per_hour].some(
                      (limit) =>
                        typeof limit !== "number" ||
                        !Number.isInteger(limit) ||
                        limit < 0 ||
                        limit > 2147483647,
                    )
                  ) {
                    callback(`第 ${index + 1} 项额度须为 0–2147483647 的整数`);
                    return;
                  }
                }
                callback();
              },
            },
          ]}
        >
          <InferencePolicyTenantFields disabled={busy} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
