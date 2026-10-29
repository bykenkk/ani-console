import { ResourceNameId } from "@/components/common";
import { useInferencePolicy } from "@/hooks/useInferencePolicy";

type ModelApiKeyPolicyProps = { policyId?: string | null };

export default function ModelApiKeyPolicy({ policyId }: ModelApiKeyPolicyProps) {
  // 当前页每个实际引用的 ID 共用详情缓存，不扫描全部策略分页建立映射。
  const policy = useInferencePolicy(policyId);
  if (!policyId) return <>未绑定策略</>;
  return (
    <ResourceNameId name={policy.data?.name ?? policyId} id={policyId} type="inference-policy" />
  );
}
