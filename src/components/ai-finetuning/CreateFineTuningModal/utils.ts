import type { FineTuningParameters, ModelDevImplementation } from "@/api/modeldev";

export function buildFineTuningParameters(
  implementation: ModelDevImplementation,
  values: string[],
): FineTuningParameters {
  return Object.fromEntries(
    (implementation.parameter_rules ?? []).flatMap((rule, index) => {
      const value = values[index];
      // 留空与显式填写默认值具有不同的幂等意图，不将目录默认值填入请求。
      if (rule.editable === false || value === undefined || value === "") return [];
      return [[rule.name, rule.type === "INTEGER" ? Number(value) : value]];
    }),
  );
}
