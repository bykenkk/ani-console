import type { CoreDevProfileInfo, CursorPageParams } from "@/api/types";

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
}

export interface NetworkSubnetListParams {
  vpc_id?: string;
  state?: string;
  search_field?: "name" | "id";
  keyword?: string;
}

export interface NetworkVPCListParams extends CursorPageParams {
  state?: "" | NetworkResourceStateFilter;
  name?: string;
}

export interface NetworkVPCListResponse {
  items: NetworkVPC[];
  /** Safely converted from the Governance int64 JSON string for existing consumers. */
  total: number;
  next_cursor?: string | null;
}

export interface NetworkVPCListWireResponse extends Omit<NetworkVPCListResponse, "total"> {
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
  protocol: "tcp" | "udp" | "icmp" | "all";
  port_range: string;
  cidr: string;
  action: "allow" | "deny";
}

export interface NetworkSecurityGroupRuleResource extends NetworkSecurityGroupRule {
  id: string;
  security_group_id: string;
  priority: number;
  description?: string | null;
  created_at: string;
  updated_at?: string | null;
}

export interface NetworkSecurityGroup {
  id: string;
  tenant_id: string;
  name: string;
  vpc_id?: string | null;
  description?: string | null;
  rules: NetworkSecurityGroupRule[];
  readonly rule_count?: number;
  readonly bound_instance_count?: number;
  state: NetworkResourceState;
  reason?: string | null;
  dev_profile?: CoreDevProfileInfo;
  created_at: string;
  updated_at: string;
}

export interface NetworkSecurityGroupListParams {
  vpc_id?: string;
  state?: string;
  search_field?: "name" | "id";
  keyword?: string;
}
export interface NetworkSecurityGroupListResponse {
  items: NetworkSecurityGroup[];
  total: number;
  next_cursor?: string | null;
}

export interface CreateNetworkSecurityGroupInput {
  name: string;
  vpc_id?: string | null;
  description?: string | null;
  rules?: NetworkSecurityGroupRule[];
}
export type CreateNetworkSecurityGroupRequest = CreateNetworkSecurityGroupInput & {
  idempotency_key: string;
};

export type NetworkSecurityGroupBindingTargetType =
  | "instance"
  | "network_interface"
  | "load_balancer";
export interface NetworkSecurityGroupBinding {
  id: string;
  security_group_id: string;
  target_type: NetworkSecurityGroupBindingTargetType;
  target_id: string;
  created_at: string;
}
export interface NetworkSecurityGroupBindingListParams {
  target_type?: NetworkSecurityGroupBindingTargetType;
}
export interface NetworkSecurityGroupBindingListResponse {
  items: NetworkSecurityGroupBinding[];
  total: number;
  next_cursor?: string | null;
}

export interface NetworkSecurityGroupRuleListResponse {
  items: NetworkSecurityGroupRuleResource[];
  total: number;
  next_cursor?: string | null;
}
export interface SaveNetworkSecurityGroupRuleInput {
  priority: number;
  direction: "ingress" | "egress";
  protocol: "tcp" | "udp" | "icmp" | "all";
  port_range: string;
  cidr: string;
  action: "allow" | "deny";
  description?: string | null;
}
export type SaveNetworkSecurityGroupRuleRequest = SaveNetworkSecurityGroupRuleInput & {
  idempotency_key: string;
};

export interface NetworkLoadBalancerListener {
  protocol: "http" | "https" | "tcp";
  port: number;
  target_port: number;
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
export interface NetworkLoadBalancerListenerResource {
  id: string;
  protocol: string;
  port: number;
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
export interface NetworkLoadBalancerMutationResponse {
  load_balancer: NetworkLoadBalancer;
  operation: NetworkOperation;
}
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
  vpc_id: string;
  subnet_id?: string | null;
  scheme?: "internal" | "public";
  listeners?: NetworkLoadBalancerListener[];
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
export type NetworkEipListParams = NetworkVPCListParams;
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
  created_at?: string;
  updated_at?: string;
  completed_at?: string;
  next_attempt_at?: string;
}
