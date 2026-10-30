import { ResourceNameId } from "@/components/common";
import { getInferencePolicy } from "@/api/inference-policies";
import { useQuery } from "@tanstack/react-query";
import { withId } from "@/lib/id";

type ModelApiKeyPolicyProps = { policyId?: string | null };

export default function ModelApiKeyPolicy({ policyId }: ModelApiKeyPolicyProps) {
  // 当前页每个实际引用的 ID 共用详情缓存，不扫描全部策略分页建立映射。
  const policy = useQuery({
    queryKey: ["governance-inference-policy", policyId],
    queryFn: ({ signal }) => getInferencePolicy(policyId!, signal),
    enabled: Boolean(policyId),
    meta: {
      errorNotification: {
        id: withId("inference-policy", policyId),
        action: "访问策略详情加载",
      },
    },
  });
  if (!policyId) return <>未绑定策略</>;
  return (
    <ResourceNameId name={policy.data?.name ?? policyId} id={policyId} type="inference-policy" />
  );
}
