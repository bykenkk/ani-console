import { listSandboxTemplates } from "@/api/instances/legacy";
import { Button, Form, Input, Modal, Space } from "@arco-design/web-react";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { WizardSteps } from "@/components/common";
import type { SandboxCreateFormValues, SandboxTemplate } from "..";
import { getTemplateComputeSpec } from "../utils";
import SandboxConfirmStep from "./SandboxConfirmStep";
import SandboxResourceStep from "./SandboxResourceStep";
import SandboxRuntimeStep from "./SandboxRuntimeStep";
import SandboxTemplateStep from "./SandboxTemplateStep";
import { validateForm } from "@/lib/form";
import { DEFAULT_CPU_INSTANCE_COMPUTE_SPEC } from "@/lib/instances";

const INITIAL_VALUES: SandboxCreateFormValues = {
  name: "",
  template_id: "",
  compute_spec: DEFAULT_CPU_INSTANCE_COMPUTE_SPEC,
  session_timeout: "120m",
  idle_timeout: "30m",
  on_timeout: "pause",
  egress_policy: "allowlist",
  egress_allowlist: "pypi.org\ngithub.com\nregistry.npmjs.org",
  auto_start: true,
};

const STEP_TITLES = ["基础配置", "资源配置", "摘要信息"];

type SandboxCreateFormProps = {
  submitting: boolean;
  onCancel: () => void;
  onSubmit: (values: SandboxCreateFormValues, template: SandboxTemplate) => void;
};

export default function SandboxCreateForm({
  submitting,
  onCancel,
  onSubmit,
}: SandboxCreateFormProps) {
  const [form] = Form.useForm<SandboxCreateFormValues>();
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<SandboxCreateFormValues>(INITIAL_VALUES);
  const templates = useQuery({
    meta: {
      errorNotification: {
        id: "sandbox-templates",
        action: "数据加载",
        fallback: "请求失败，请稍后重试",
      },
    },
    queryKey: ["sandbox-templates", "create-modal"],
    queryFn: () => listSandboxTemplates(),
  });
  const items = useMemo(
    () => (templates.data as { items?: SandboxTemplate[] } | undefined)?.items ?? [],
    [templates.data],
  );
  const selectedTemplate = items.find((item) => item.id === values.template_id);

  useEffect(() => {
    if (values.template_id || !items[0]) return;
    const nextValues = {
      template_id: items[0].id,
      compute_spec: getTemplateComputeSpec(items[0]),
    };
    form.setFieldsValue(nextValues);
    setValues((current) => ({ ...current, ...nextValues }));
  }, [form, items, values.template_id]);

  const selectTemplate = (templateId: string) => {
    const template = items.find((item) => item.id === templateId);
    const nextValues = {
      template_id: templateId,
      compute_spec: getTemplateComputeSpec(template),
    };
    form.setFieldsValue(nextValues);
    setValues((current) => ({ ...current, ...nextValues }));
  };

  const next = async () => {
    try {
      await validateForm(form);
    } catch {
      return;
    }
    setStep((current) => Math.min(current + 1, STEP_TITLES.length - 1));
  };

  return (
    <Modal
      title="创建沙箱"
      visible
      onCancel={onCancel}
      unmountOnExit
      footer={
        <Space>
          <Button onClick={onCancel} disabled={submitting}>
            取消
          </Button>
          {step > 0 ? (
            <Button onClick={() => setStep((current) => current - 1)} disabled={submitting}>
              上一步
            </Button>
          ) : null}
          <Button
            type="primary"
            onClick={
              step === STEP_TITLES.length - 1 && selectedTemplate
                ? () => onSubmit(values, selectedTemplate)
                : next
            }
            loading={submitting}
            disabled={
              (step === 0 && (templates.isLoading || templates.isError || !items.length)) ||
              (step === STEP_TITLES.length - 1 && !selectedTemplate)
            }
          >
            {step === STEP_TITLES.length - 1 ? "提交创建" : "下一步"}
          </Button>
        </Space>
      }
      style={{ width: 820 }}
    >
      <div className="flex flex-col">
        <WizardSteps
          current={step + 1}
          items={STEP_TITLES}
          size="small"
          className="mx-auto w-full max-w-160 shrink-0"
        />
        <div className="pt-7">
          <Form<SandboxCreateFormValues>
            form={form}
            layout="vertical"
            initialValues={INITIAL_VALUES}
            requiredSymbol={{ position: "end" }}
            onValuesChange={(changedValues) =>
              setValues((current) => ({ ...current, ...changedValues }))
            }
          >
            {step === 0 ? (
              <>
                <Form.Item
                  field="name"
                  label="名称"
                  rules={[{ required: true, message: "请输入名称" }]}
                >
                  <Input allowClear placeholder="例如：agent-dev-sandbox" />
                </Form.Item>
                <SandboxTemplateStep
                  templates={items}
                  loading={templates.isLoading}
                  error={templates.isError}
                  onChange={selectTemplate}
                />
                <SandboxResourceStep />
              </>
            ) : null}
            {step === 1 ? <SandboxRuntimeStep values={values} /> : null}
            {step === 2 && selectedTemplate ? (
              <SandboxConfirmStep values={values} template={selectedTemplate} />
            ) : null}
          </Form>
        </div>
      </div>
    </Modal>
  );
}
