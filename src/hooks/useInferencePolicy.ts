import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getInferencePolicy } from "@/api/inference-policies";
import { withId } from "@/lib/id";

export function useInferencePolicy(policyId?: string | null) {
  return useQuery({
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
}

export function useRefreshInferencePolicies() {
  const qc = useQueryClient();
  return async (deletedId?: string) => {
    await Promise.all([
      qc.invalidateQueries({ queryKey: ["governance-inference-policies"] }),
      qc.invalidateQueries({
        queryKey: ["governance-inference-policy"],
        predicate: (query) => query.queryKey[1] !== deletedId,
      }),
      ...(deletedId
        ? [
            qc.invalidateQueries({
              queryKey: ["governance-inference-policy", deletedId],
              refetchType: "none",
            }),
          ]
        : []),
      qc.resetQueries({ queryKey: ["governance-inference-keys", "options"] }),
    ]);
  };
}
