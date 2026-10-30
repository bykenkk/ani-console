import { Form, Select, Spin } from "@arco-design/web-react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getInferencePolicy, listInferencePolicies } from "@/api/inference-policies";
import { withFirst100 } from "@/api/pagination";
import InferencePolicyRules from "@/components/ai-inference-policies/InferencePolicyRules";
import { withId } from "@/lib/id";

type ModelApiKeyPolicyFieldProps = { disabled?: boolean; showRules?: boolean };
type ModelApiKeyPolicyInputProps = {
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  showRules?: boolean;
};
const listPolicyOptions = withFirst100(listInferencePolicies);

function ModelApiKeyPolicyInput({
  value,
  onChange,
  disabled,
  showRules,
}: ModelApiKeyPolicyInputProps) {
  const policies = useQuery({
    queryKey: ["governance-inference-policies", "options"],
    queryFn: ({ signal }) => listPolicyOptions({}, signal),
    meta: { errorNotification: { id: "inference-policies", action: "访问策略列表加载" } },
  });
  // 单个详情用于策略摘要及前 100 项之外的原绑定回显。
  const selected = useQuery({
    queryKey: ["governance-inference-policy", value],
    queryFn: ({ signal }) => getInferencePolicy(value!, signal),
    enabled: Boolean(value),
    meta: {
      errorNotification: {
        id: withId("inference-policy", value),
        action: "访问策略详情加载",
      },
    },
  });
  const options = (policies.data?.items ?? []).map((policy) => ({
    value: policy.id,
    label: `${policy.name} / ${policy.id}`,
  }));
  if (value && !options.some((option) => option.value === value)) {
    options.push({ value, label: selected.data ? `${selected.data.name} / ${value}` : value });
  }
  return (
    <div className="flex flex-col gap-3">
      <Select
        aria-label="访问策略"
        value={value}
        onChange={onChange}
        disabled={disabled}
        placeholder="请选择访问策略"
        showSearch={false}
        filterOption={false}
        options={options}
        loading={policies.isFetching}
      />
      {policies.data?.total === "0" && (
        <div>
          暂无访问策略，请先<Link to="/ai-inference-policies">前往策略管理创建</Link>。
        </div>
      )}
      {showRules && value && (
        <Spin loading={selected.isFetching}>
          {selected.data && <InferencePolicyRules policy={selected.data} />}
        </Spin>
      )}
    </div>
  );
}

export default function ModelApiKeyPolicyField({
  disabled,
  showRules = true,
}: ModelApiKeyPolicyFieldProps) {
  return (
    <Form.Item
      field="policy_id"
      label="访问策略"
      rules={[{ required: true, message: "请选择访问策略" }]}
    >
      <ModelApiKeyPolicyInput disabled={disabled} showRules={showRules} />
    </Form.Item>
  );
}
