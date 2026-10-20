// FIXME(governance-migration): 原组件/适配保留供未对齐能力复核，不能作为 governance 契约使用。
// TODO(governance-migration): 后端覆盖原字段后逐项对接，避免删除未支持的能力。
import { applyInstanceLifecycle, getInstance } from "@/api/instances/legacy";
import type { ContainerDetailDataSource, ContainerDetailInstance } from "./types";

function buildDetail(record: Record<string, unknown>): ContainerDetailInstance | undefined {
  const compute = record.compute as Record<string, unknown> | undefined;
  return {
    ...record,
    kind: "container",
    node_name: (compute?.node_name ?? record.node_name) as string | null,
  } as ContainerDetailInstance;
}

export const containerDetailDataSource: ContainerDetailDataSource = {
  async getDetail(instanceId: string) {
    const record = (await getInstance(instanceId)) as unknown as Record<string, unknown>;
    if (!record || record.kind !== "container") return undefined;
    return buildDetail(record);
  },

  async changePowerState(instanceId, body) {
    await applyInstanceLifecycle(instanceId, body);
  },
};
