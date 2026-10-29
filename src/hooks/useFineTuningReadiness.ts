import { skipToken, useQuery } from "@tanstack/react-query";
import { checkFineTuningReadiness, type CheckFineTuningReadinessInput } from "@/api/modeldev";

export function useFineTuningReadiness(input: CheckFineTuningReadinessInput | undefined) {
  return useQuery({
    queryKey: ["finetuning-readiness", input],
    queryFn: input ? ({ signal }) => checkFineTuningReadiness(input, signal) : skipToken,
    retry: false,
    meta: {
      errorNotification: {
        id: "finetuning-readiness",
        action: "微调适用性检查",
        fallback: "请稍后重试",
      },
    },
  });
}
