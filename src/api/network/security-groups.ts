import { runIdempotentRequest } from "@/api/idempotency";
import { coreRequest } from "@/api/request";
import { createIdempotencyScope } from "@/lib/idempotency";
import type {
  CreateNetworkSecurityGroupInput,
  CreateNetworkSecurityGroupRequest,
  NetworkSecurityGroup,
  NetworkSecurityGroupBindingListParams,
  NetworkSecurityGroupBindingListResponse,
  NetworkSecurityGroupListParams,
  NetworkSecurityGroupListResponse,
  NetworkSecurityGroupRuleListParams,
  NetworkSecurityGroupRuleListResponse,
  SaveNetworkSecurityGroupRuleInput,
  SaveNetworkSecurityGroupRuleRequest,
} from "./types";

const createScope = createIdempotencyScope("network-security-group-create", ["POST"]);
const createRuleScope = createIdempotencyScope("network-security-group-rule-create", ["POST"]);
const updateRuleScope = createIdempotencyScope("network-security-group-rule-update", ["PATCH"]);
const securityGroupPath = (id: string) => `/networks/security-groups/${encodeURIComponent(id)}`;

// TODO(security-group-live): 部署后核对规则、绑定、版本冲突及幂等重试；静态接入不代表数据面已生效。
export function listNetworkSecurityGroups(
  params: NetworkSecurityGroupListParams = {},
  signal?: AbortSignal,
) {
  return coreRequest<NetworkSecurityGroupListResponse>("/networks/security-groups", {
    method: "GET",
    params,
    signal,
  });
}
export function createNetworkSecurityGroup(input: CreateNetworkSecurityGroupInput): Promise<void> {
  return runIdempotentRequest(createScope, input, async (data) => {
    await coreRequest<void, CreateNetworkSecurityGroupRequest>("/networks/security-groups", {
      method: "POST",
      data: { data },
    });
  });
}
export function copyNetworkSecurityGroup(source: NetworkSecurityGroup): Promise<void> {
  return createNetworkSecurityGroup({
    name: `${source.name}-copy`,
    description: source.description,
    rules: source.rules
      .filter((rule) => !rule.is_default)
      .map(
        ({
          direction,
          protocol,
          remote_addresses,
          port_ranges,
          action,
          priority,
          description,
        }) => ({
          direction,
          protocol,
          remote_addresses,
          port_ranges,
          action,
          priority,
          description,
        }),
      ),
  });
}
export function getNetworkSecurityGroup(id: string, signal?: AbortSignal) {
  return coreRequest<NetworkSecurityGroup>(securityGroupPath(id), { method: "GET", signal });
}
// DELETE 的正式合同未声明客户端幂等字段，不添加 body 或 Header。
export async function deleteNetworkSecurityGroup(id: string): Promise<void> {
  await coreRequest(securityGroupPath(id), { method: "DELETE" });
}
export function listNetworkSecurityGroupBindings(
  id: string,
  params: NetworkSecurityGroupBindingListParams = {},
  signal?: AbortSignal,
) {
  return coreRequest<NetworkSecurityGroupBindingListResponse>(`${securityGroupPath(id)}/bindings`, {
    method: "GET",
    params,
    signal,
  });
}
export function listNetworkSecurityGroupRules(
  id: string,
  params: NetworkSecurityGroupRuleListParams = {},
  signal?: AbortSignal,
) {
  return coreRequest<NetworkSecurityGroupRuleListResponse>(`${securityGroupPath(id)}/rules`, {
    method: "GET",
    params,
    signal,
  });
}
export function createNetworkSecurityGroupRule(
  id: string,
  input: SaveNetworkSecurityGroupRuleInput,
): Promise<void> {
  return runIdempotentRequest(
    createRuleScope,
    input,
    async (data) => {
      await coreRequest<void, SaveNetworkSecurityGroupRuleRequest>(
        `${securityGroupPath(id)}/rules`,
        { method: "POST", data: { data } },
      );
    },
    [id],
  );
}
export function updateNetworkSecurityGroupRule(
  id: string,
  ruleId: string,
  input: SaveNetworkSecurityGroupRuleInput,
): Promise<void> {
  return runIdempotentRequest(
    updateRuleScope,
    input,
    async (data) => {
      await coreRequest<void, SaveNetworkSecurityGroupRuleRequest>(
        `${securityGroupPath(id)}/rules/${encodeURIComponent(ruleId)}`,
        { method: "PATCH", data: { data } },
      );
    },
    [id, ruleId],
  );
}
export async function deleteNetworkSecurityGroupRule(id: string, ruleId: string): Promise<void> {
  await coreRequest(`${securityGroupPath(id)}/rules/${encodeURIComponent(ruleId)}`, {
    method: "DELETE",
  });
}
