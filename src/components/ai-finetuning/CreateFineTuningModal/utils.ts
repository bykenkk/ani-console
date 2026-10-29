import type { FineTuningParameters, ModelDevImplementation } from "@/api/modeldev";
import { buildModelDevParameters } from "@/lib/modeldev";

export function buildFineTuningParameters(
  implementation: ModelDevImplementation,
  values: string[],
): FineTuningParameters {
  return buildModelDevParameters(implementation, values);
}
