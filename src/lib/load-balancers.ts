import type {
  NetworkLoadBalancer,
  NetworkLoadBalancerListener,
  NetworkLoadBalancerListenerResource,
} from "@/api/network";

const labels: Record<string, string> = {
  LOAD_BALANCER_EXPOSURE_PRIVATE: "私网",
  LOAD_BALANCER_EXPOSURE_PUBLIC: "公网",
  LOAD_BALANCER_EXPOSURE_PUBLIC_PRIVATE: "公网+私网",
  LOAD_BALANCER_LISTENER_PROTOCOL_HTTP: "HTTP",
  LOAD_BALANCER_LISTENER_PROTOCOL_HTTPS: "HTTPS",
  LOAD_BALANCER_LISTENER_PROTOCOL_TCP: "TCP",
  LOAD_BALANCER_LISTENER_PROTOCOL_UDP: "UDP",
  LOAD_BALANCER_LISTENER_PROTOCOL_SSL: "SSL",
  LOAD_BALANCER_ALGORITHM_LEAST_REQUEST: "最少请求",
  LOAD_BALANCER_ALGORITHM_SOURCE_IP: "源 IP 哈希",
  LOAD_BALANCER_SESSION_MODE_DISABLED: "停用",
  LOAD_BALANCER_SESSION_MODE_COOKIE_TIMEOUT: "Cookie（指定有效期）",
  LOAD_BALANCER_SESSION_MODE_COOKIE_SESSION: "Cookie（会话期）",
  LOAD_BALANCER_HEALTH_CHECK_PROTOCOL_HTTP: "HTTP",
  LOAD_BALANCER_ALGORITHM_ROUND_ROBIN: "轮询",
  LOAD_BALANCER_HEALTH_CHECK_PROTOCOL_TCP: "TCP",
  LOAD_BALANCER_CONFIGURATION_STATE_WAITING_FOR_BACKENDS: "等待后端成员",
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

export function loadBalancerListeners(
  item: NetworkLoadBalancer,
): NetworkLoadBalancerListenerResource[] {
  if (item.listeners !== undefined) return item.listeners;
  return item.listener
    ? [
        {
          ...item.listener,
          backends: item.listener.backends ?? item.backends,
          health_check:
            item.listener.health_check ??
            (item.health_check as NetworkLoadBalancerListener["health_check"]),
        },
      ]
    : [];
}

export function listenerInput(
  listener: NetworkLoadBalancerListener | NetworkLoadBalancerListenerResource,
): NetworkLoadBalancerListener {
  const http = [
    "LOAD_BALANCER_LISTENER_PROTOCOL_HTTP",
    "LOAD_BALANCER_LISTENER_PROTOCOL_HTTPS",
  ].includes(listener.protocol);
  const tls = [
    "LOAD_BALANCER_LISTENER_PROTOCOL_HTTPS",
    "LOAD_BALANCER_LISTENER_PROTOCOL_SSL",
  ].includes(listener.protocol);
  const redirect =
    listener.protocol === "LOAD_BALANCER_LISTENER_PROTOCOL_HTTP"
      ? (listener.https_redirect_status_code ?? 0)
      : 0;
  return {
    id: listener.id,
    name: listener.name.trim(),
    protocol: listener.protocol,
    port: listener.port,
    backends: redirect
      ? []
      : (listener.backends ?? []).map(({ id, subnet_id, address, port, weight }) => ({
          id,
          subnet_id,
          address: address.trim(),
          port,
          weight,
        })),
    health_check: redirect
      ? undefined
      : listener.health_check
        ? {
            ...listener.health_check,
            protocol:
              listener.protocol === "LOAD_BALANCER_LISTENER_PROTOCOL_UDP"
                ? "LOAD_BALANCER_HEALTH_CHECK_PROTOCOL_TCP"
                : listener.health_check.protocol,
            path:
              listener.protocol !== "LOAD_BALANCER_LISTENER_PROTOCOL_UDP" &&
              listener.health_check.protocol === "LOAD_BALANCER_HEALTH_CHECK_PROTOCOL_HTTP"
                ? listener.health_check.path
                : undefined,
            hostname:
              listener.protocol !== "LOAD_BALANCER_LISTENER_PROTOCOL_UDP" &&
              listener.health_check.protocol === "LOAD_BALANCER_HEALTH_CHECK_PROTOCOL_HTTP"
                ? listener.health_check.hostname
                : undefined,
          }
        : undefined,
    certificate_ref: tls ? listener.certificate_ref : undefined,
    algorithm: listener.algorithm,
    session_persistence: http
      ? {
          mode: listener.session_persistence?.mode ?? "LOAD_BALANCER_SESSION_MODE_DISABLED",
          cookie_expiry_seconds:
            listener.session_persistence?.mode === "LOAD_BALANCER_SESSION_MODE_COOKIE_TIMEOUT"
              ? listener.session_persistence.cookie_expiry_seconds
              : undefined,
        }
      : undefined,
    max_connections:
      listener.protocol === "LOAD_BALANCER_LISTENER_PROTOCOL_UDP"
        ? undefined
        : listener.max_connections,
    gzip_enabled: http && !!listener.gzip_enabled,
    https_redirect_status_code: redirect,
  };
}

export function listenerSetError(
  listeners: NetworkLoadBalancerListener[] = [],
): string | undefined {
  if (!listeners.length) return "请至少保留一个监听器；删除最后一个监听器请删除负载均衡";
  if (new Set(listeners.map((item) => item.name.trim())).size !== listeners.length)
    return "监听器名称不能重复";
  if (new Set(listeners.map((item) => item.port)).size !== listeners.length)
    return "监听端口不能重复";
  const https = listeners.filter(
    (item) => item.protocol === "LOAD_BALANCER_LISTENER_PROTOCOL_HTTPS",
  );
  if (
    listeners.some(
      (item) =>
        item.protocol === "LOAD_BALANCER_LISTENER_PROTOCOL_HTTP" && item.https_redirect_status_code,
    ) &&
    !https.some((item) => item.port === 443) &&
    https.length !== 1
  ) {
    return "HTTPS 重定向需要端口为 443 的 HTTPS 监听器，或唯一的 HTTPS 监听器";
  }
}
