import type { NetworkLoadBalancer } from "@/api/network/types";

const labels: Record<string, string> = {
  LOAD_BALANCER_EXPOSURE_PRIVATE: "私网",
  LOAD_BALANCER_EXPOSURE_PUBLIC: "公网",
  LOAD_BALANCER_EXPOSURE_PUBLIC_PRIVATE: "公网+私网",
  LOAD_BALANCER_LISTENER_PROTOCOL_HTTP: "HTTP",
  LOAD_BALANCER_ALGORITHM_ROUND_ROBIN: "轮询",
  LOAD_BALANCER_HEALTH_CHECK_PROTOCOL_TCP: "TCP",
  LOAD_BALANCER_CONFIGURATION_STATE_PENDING: "待应用",
  LOAD_BALANCER_CONFIGURATION_STATE_APPLYING: "应用中",
  LOAD_BALANCER_CONFIGURATION_STATE_CONFIGURED: "已配置",
  LOAD_BALANCER_CONFIGURATION_STATE_DEGRADED: "配置异常",
  LOAD_BALANCER_CONFIGURATION_STATE_UNKNOWN: "未知",
  LOAD_BALANCER_DATA_PLANE_STATE_UNKNOWN: "未知",
  LOAD_BALANCER_DATA_PLANE_STATE_HEALTHY: "健康",
  LOAD_BALANCER_DATA_PLANE_STATE_UNHEALTHY: "不健康",
};
export function loadBalancerLabel(value?: string): string {
  if (!value || value.endsWith("_UNSPECIFIED")) return "-";
  return labels[value] ?? value;
}
export function isLoadBalancerChanging(item?: NetworkLoadBalancer): boolean {
  return (
    !!item &&
    (item.state === "provisioning" ||
      item.state === "deleting" ||
      item.configuration_state === "LOAD_BALANCER_CONFIGURATION_STATE_PENDING" ||
      item.configuration_state === "LOAD_BALANCER_CONFIGURATION_STATE_APPLYING")
  );
}
