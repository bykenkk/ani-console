import type { CoreDevProfileInfo, CursorPageParams, PageParams } from "@/api/types";

export type NetworkResourceState =
  | "pending"
  | "provisioning"
  | "available"
  | "failed"
  | "deleting"
  | "deleted";

// Governance network query values; response states remain lowercase.
export type NetworkResourceStateFilter =
  | "RESOURCE_STATE_PROVISIONING"
  | "RESOURCE_STATE_AVAILABLE"
  | "RESOURCE_STATE_FAILED"
  | "RESOURCE_STATE_DELETING"
  | "RESOURCE_STATE_DELETED";

export interface NetworkVPC {
  id: string;
  tenant_id?: string;
  name: string;
  description?: string;
  cidr: string;
  state: NetworkResourceState;
  reason?: string | null;
  dev_profile?: CoreDevProfileInfo;
  created_at: string;
  updated_at: string;
  version?: string;
  observed_at?: string;
  observation_stale?: boolean;
  last_operation_id?: string;
  subnet_count?: string;
}

export interface NetworkSubnet {
  id: string;
  tenant_id: string;
  vpc_id: string;
  name: string;
  cidr: string;
  gateway?: string | null;
  state: NetworkResourceState;
  reason?: string | null;
  dev_profile?: CoreDevProfileInfo;
  created_at: string;
  updated_at: string;
  description?: string;
  reason_message?: string;
  version?: string;
  observed_at?: string;
  observation_stale?: boolean;
  available_ip_range?: string;
  used_ip_range?: string;
}

// FIXME(subnet-pagination): 后端子网目录仍使用 limit/cursor，不能作为页码分页接口使用。
// TODO(subnet-pagination): 后端完成分页改造后迁移为 PageParams。
export interface NetworkSubnetListParams extends CursorPageParams {
  name?: string;
  vpc_id?: string;
  state?: string;
  search_field?: "name" | "id";
  keyword?: string;
}

export interface NetworkVPCListParams extends PageParams {
  state?: "" | NetworkResourceStateFilter;
  name?: string;
}

export interface NetworkVPCListResponse {
  items: NetworkVPC[];
  total: string;
}

export interface NetworkSubnetListResponse {
  items: NetworkSubnet[];
  total: number;
  next_cursor?: string | null;
}

export interface CreateNetworkVPCInput {
  name: string;
  cidr: string;
  description?: string;
}
export type CreateNetworkVPCRequest = CreateNetworkVPCInput & { idempotency_key: string };

export interface CreateNetworkSubnetInput {
  vpc_id: string;
  name: string;
  cidr: string;
  gateway?: string | null;
}
export type CreateNetworkSubnetRequest = CreateNetworkSubnetInput & { idempotency_key: string };

export interface NetworkSecurityGroupRule {
  direction: "ingress" | "egress";
  protocol: "tcp" | "udp" | "icmp" | "ipip" | "gre" | "all";
  remote_addresses: string[];
  port_ranges: Array<{ min: number; max: number }>;
  action: "allow" | "drop";
  priority: number;
  description?: string;
}
export interface NetworkSecurityGroupRuleResource extends NetworkSecurityGroupRule {
  id: string;
  security_group_id: string;
  is_default: boolean;
}
export interface NetworkSecurityGroup {
  id: string;
  name: string;
  description?: string;
  rules: NetworkSecurityGroupRuleResource[];
  state: string;
  reason?: string;
  version: string;
  bound_resource_count: string;
  last_operation_id?: string;
  created_at: string;
  updated_at: string;
  observed_at?: string;
}
export interface NetworkSecurityGroupListParams extends PageParams {
  name?: string;
  state?: string;
}
export interface NetworkSecurityGroupListResponse {
  items: NetworkSecurityGroup[];
  total: string;
}
export interface CreateNetworkSecurityGroupInput {
  name: string;
  description?: string;
  rules?: NetworkSecurityGroupRule[];
}
export type CreateNetworkSecurityGroupRequest = {
  data: CreateNetworkSecurityGroupInput & {
    idempotency_key: string;
  };
};
export type NetworkSecurityGroupBindingTargetType = "eip" | "container" | "vm";
export interface NetworkSecurityGroupBinding {
  target_type: NetworkSecurityGroupBindingTargetType;
  target_id: string;
  security_group_ids: string[];
  applied_security_group_ids: string[];
  state: string;
  reason?: string;
  version: string;
  last_operation_id?: string;
  observed_at?: string;
}
export interface NetworkSecurityGroupBindingListParams extends PageParams {
  target_type?: NetworkSecurityGroupBindingTargetType;
}
export interface NetworkSecurityGroupBindingListResponse {
  items: NetworkSecurityGroupBinding[];
  total: string;
}
export interface NetworkSecurityGroupRuleListParams extends PageParams {
  direction?: NetworkSecurityGroupRule["direction"];
}
export interface NetworkSecurityGroupRuleListResponse {
  items: NetworkSecurityGroupRuleResource[];
  total: string;
  version: string;
}
export interface SaveNetworkSecurityGroupRuleInput {
  rule: NetworkSecurityGroupRule;
  expected_version: string;
}
export type SaveNetworkSecurityGroupRuleRequest = {
  data: SaveNetworkSecurityGroupRuleInput & {
    idempotency_key: string;
  };
};
export interface SetSecurityGroupsInput {
  security_group_ids: string[];
  expected_version: string;
}
export interface NetworkSecurityGroupBindingResponse {
  binding: NetworkSecurityGroupBinding;
  operation?: NetworkOperation;
}

export type NetworkLoadBalancerProtocol =
  | "LOAD_BALANCER_LISTENER_PROTOCOL_HTTP"
  | "LOAD_BALANCER_LISTENER_PROTOCOL_HTTPS"
  | "LOAD_BALANCER_LISTENER_PROTOCOL_TCP"
  | "LOAD_BALANCER_LISTENER_PROTOCOL_UDP"
  | "LOAD_BALANCER_LISTENER_PROTOCOL_SSL";
export type NetworkLoadBalancerAlgorithm =
  | "LOAD_BALANCER_ALGORITHM_ROUND_ROBIN"
  | "LOAD_BALANCER_ALGORITHM_LEAST_REQUEST"
  | "LOAD_BALANCER_ALGORITHM_SOURCE_IP";
export type NetworkLoadBalancerSessionMode =
  | "LOAD_BALANCER_SESSION_MODE_DISABLED"
  | "LOAD_BALANCER_SESSION_MODE_COOKIE_TIMEOUT"
  | "LOAD_BALANCER_SESSION_MODE_COOKIE_SESSION";
export interface NetworkLoadBalancerHealthCheck {
  protocol?: "LOAD_BALANCER_HEALTH_CHECK_PROTOCOL_TCP" | "LOAD_BALANCER_HEALTH_CHECK_PROTOCOL_HTTP";
  interval_seconds?: number;
  timeout_seconds?: number;
  unhealthy_threshold?: number;
  healthy_threshold?: number;
  port?: number;
  path?: string;
  hostname?: string;
}
export interface NetworkLoadBalancerBackendInput {
  id?: string;
  subnet_id: string;
  address: string;
  port: number;
  weight?: number;
}
export interface NetworkLoadBalancerListener {
  id?: string;
  name: string;
  protocol: NetworkLoadBalancerProtocol;
  port: number;
  backends: NetworkLoadBalancerBackendInput[];
  health_check?: NetworkLoadBalancerHealthCheck;
  certificate_ref?: { name: string; namespace: string };
  algorithm?: NetworkLoadBalancerAlgorithm;
  session_persistence?: { mode: NetworkLoadBalancerSessionMode; cookie_expiry_seconds?: number };
  max_connections?: number;
  gzip_enabled?: boolean;
  https_redirect_status_code?: number;
}
/** Governance read model; int64 values retain their JSON string representation. */
export interface NetworkLoadBalancer {
  id: string;
  name: string;
  description?: string;
  vpc_id: string;
  subnet_id: string;
  exposure: string;
  flavor?: string;
  public_eip_id?: string;
  private_ip?: string;
  public_address?: string;
  listener?: NetworkLoadBalancerListenerResource;
  listeners?: NetworkLoadBalancerListenerResource[];
  backends?: NetworkLoadBalancerBackend[];
  health_check?: {
    protocol?: string;
    interval_seconds?: number;
    timeout_seconds?: number;
    unhealthy_threshold?: number;
    healthy_threshold?: number;
    port?: number;
  };
  algorithm?: string;
  state: NetworkResourceState;
  reason?: string | null;
  reason_message?: string;
  version?: string;
  desired_version?: string;
  applied_version?: string;
  configuration_state?: string;
  data_plane_state?: string;
  observed_at?: string;
  data_plane_observed_at?: string;
  observation_stale?: boolean;
  last_operation_id?: string;
  created_at: string;
  updated_at: string;
}
export interface NetworkLoadBalancerListenerResource extends Omit<
  NetworkLoadBalancerListener,
  "id" | "backends"
> {
  id: string;
  backends?: NetworkLoadBalancerBackend[];
}
export interface NetworkLoadBalancerBackend {
  id: string;
  subnet_id: string;
  address: string;
  port: number;
  weight: number;
  attachment_id?: string;
  state?: string;
  reason?: string;
  observed_at?: string;
  observation_stale?: boolean;
}
// TODO(pagination-migration): governance ListLoadBalancersRequest 仍使用 limit/cursor，保留原分页；待后端改造后迁移 PageParams。
export interface NetworkLoadBalancerListParams extends CursorPageParams {
  vpc_id?: string;
  subnet_id?: string;
  exposure?: string;
  state?: string;
  name?: string;
}
export interface NetworkLoadBalancerListResponse {
  items: NetworkLoadBalancer[];
  total: string;
  next_cursor?: string | null;
}
export interface CreateNetworkLoadBalancerInput {
  name: string;
  description?: string;
  vpc_id: string;
  subnet_id: string;
  exposure:
    | "LOAD_BALANCER_EXPOSURE_PRIVATE"
    | "LOAD_BALANCER_EXPOSURE_PUBLIC"
    | "LOAD_BALANCER_EXPOSURE_PUBLIC_PRIVATE";
  flavor: "small" | "medium" | "large";
  private_ip: string;
  public_eip_id?: string;
  listeners: { items: NetworkLoadBalancerListener[] };
}
export type CreateNetworkLoadBalancerRequest = CreateNetworkLoadBalancerInput & {
  idempotency_key: string;
};

export interface NetworkRoute {
  id: string;
  vpc_id: string;
  destination_cidr: string;
  next_hop_type: "gateway" | "instance" | "nat";
  next_hop_id: string;
  description?: string | null;
  created_at: string;
  dev_profile: CoreDevProfileInfo;
}
export interface NetworkRouteListParams {
  vpc_id?: string;
  subnet_id?: string;
  status?: string;
  search_field?: "description" | "id";
  keyword?: string;
}
export interface NetworkRouteListResponse {
  items: NetworkRoute[];
  total: number;
  next_cursor?: string | null;
}
export interface CreateNetworkRouteInput {
  vpc_id: string;
  destination_cidr: string;
  next_hop_type: "gateway" | "instance" | "nat";
  next_hop_id: string;
  description?: string;
}
export type CreateNetworkRouteRequest = CreateNetworkRouteInput & { idempotency_key: string };

/** Governance network DTOs; int64 fields retain their JSON string representation. */
export interface NetworkEip {
  id: string;
  name: string;
  description?: string;
  state: string;
  reason?: string;
  created_at?: string;
  updated_at?: string;
  version?: string;
  observed_at?: string;
  observation_stale?: boolean;
  last_operation_id?: string;
  address?: string;
  binding_id?: string;
  binding_state?: string;
  scope?: string;
  managed_by?: string;
  binding_target?: { kind?: string; id?: string; state?: string };
}
// TODO(pagination-migration): 后端 ListEIPsRequest 仍仅支持 limit/cursor，暂保留原参数；待后端改造后迁移至 PageParams，不能复用 VPC 页码契约。
export interface NetworkEipListParams extends CursorPageParams {
  state?: "" | NetworkResourceStateFilter;
  name?: string;
}
export interface NetworkEipListResponse {
  items: NetworkEip[];
  next_cursor?: string;
  total: string;
}
export interface CreateNetworkEipInput {
  name: string;
  description?: string;
}
export type CreateNetworkEipRequest = CreateNetworkEipInput & { idempotency_key: string };
export interface NetworkSnat {
  id: string;
  vpc_id: string;
  eip_id?: string;
  eip_address?: string;
  state: string;
  reason?: string;
  created_at?: string;
  updated_at?: string;
  version?: string;
  desired_enabled?: boolean;
  applied_enabled?: boolean;
}
export interface BindNetworkSnatInput {
  eip_id: string;
}
export type BindNetworkSnatRequest = BindNetworkSnatInput & { idempotency_key: string };
export interface NetworkOperation {
  id: string;
  resource_id?: string;
  resource_type?: string;
  kind?: string;
  state: string;
  reason?: string;
  reason_message?: string;
  created_at?: string;
  updated_at?: string;
  completed_at?: string;
  next_attempt_at?: string;
}

export interface NetworkVPCCidrPresetsResponse {
  cidrs: string[];
}
