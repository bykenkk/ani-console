import { Collapse, Descriptions, Space } from "@arco-design/web-react";
import { useQueryClient } from "@tanstack/react-query";
import type { NetworkEip, NetworkSubnetListResponse, NetworkVPCListResponse } from "@/api/network";
import type { LoadBalancerConfigurationValues } from "@/components/network/CreateLoadBalancerModal";

const sizes = { small: "小型", medium: "中型", large: "大型" };
const schemes = { internal: "私网", public: "公网", both: "公网+私网" };
const sessions = { disabled: "停用", source_ip: "源 IP", cookie: "Cookie" };
const algorithms = { round_robin: "轮询", least_connections: "最少连接", source_ip: "源 IP 哈希" };

export default function LoadBalancerCreateSummary({
  basic,
  configuration,
}: {
  basic: { name: string; description?: string };
  configuration: LoadBalancerConfigurationValues;
}) {
  const qc = useQueryClient();
  // 摘要读取前两步已加载的选项缓存，不额外请求资源。
  const vpc = qc
    .getQueryData<NetworkVPCListResponse>(["network-vpcs", "load-balancer-create"])
    ?.items.find((item) => item.id === configuration.vpc_id);
  const subnet = qc
    .getQueryData<NetworkSubnetListResponse>([
      "network-subnets",
      "load-balancer-create",
      configuration.vpc_id,
    ])
    ?.items.find((item) => item.id === configuration.subnet_id);
  const eip = qc
    .getQueryData<NetworkEip[]>(["network-eips", "load-balancer-create"])
    ?.find((item) => item.id === configuration.publicIp);
  return (
    <Space direction="vertical" size="large" className="w-full break-all">
      <Descriptions
        title="基本信息"
        column={1}
        border
        data={[
          { label: "名称", value: basic.name.trim() },
          {
            label: "描述",
            value: <span className="whitespace-pre-wrap">{basic.description || "-"}</span>,
          },
        ]}
      />
      <Descriptions
        title="配置信息"
        column={1}
        border
        data={[
          { label: "规格", value: sizes[configuration.size] },
          { label: "网络类型", value: schemes[configuration.scheme] },
          ...(configuration.scheme !== "internal"
            ? [
                {
                  label: "公网 IP",
                  value: eip
                    ? `${eip.address || "-"} · ${eip.name}`
                    : configuration.publicIp || "-",
                },
              ]
            : []),
          { label: "VPC", value: vpc ? `${vpc.name} · ${vpc.cidr}` : configuration.vpc_id },
          {
            label: "子网",
            value: subnet ? `${subnet.name} · ${subnet.cidr}` : configuration.subnet_id || "-",
          },
          { label: "指定 IP", value: configuration.vip },
        ]}
      />
      <Collapse defaultActiveKey={configuration.listeners.map((item) => String(item.port))}>
        {configuration.listeners.map((listener) => (
          <Collapse.Item
            key={listener.port}
            name={String(listener.port)}
            header={`监听器：${listener.name} · ${listener.protocol.toUpperCase()} / ${listener.port}`}
          >
            <Descriptions
              column={2}
              border
              data={[
                { label: "名称", value: listener.name },
                { label: "监听协议", value: listener.protocol.toUpperCase() },
                { label: "负载均衡端口", value: listener.port },
                { label: "目标端口", value: listener.target_port },
                { label: "会话保持", value: sessions[listener.sessionPersistence] },
                { label: "负载均衡算法", value: algorithms[listener.algorithm] },
                { label: "健康检查协议", value: listener.healthCheckProtocol },
                { label: "健康检查端口", value: listener.healthCheckPort },
                { label: "检查间隔", value: `${listener.interval} 秒` },
                { label: "超时时间", value: `${listener.timeout} 秒` },
                { label: "健康阈值", value: listener.healthyThreshold },
                { label: "不健康阈值", value: listener.unhealthyThreshold },
                { label: "最大连接数", value: listener.maxConnections },
                ...(listener.protocol === "http" || listener.protocol === "https"
                  ? [
                      { label: "获取客户端 IP", value: listener.clientIp ? "开启" : "关闭" },
                      { label: "数据压缩", value: listener.compression ? "开启" : "关闭" },
                      ...(listener.protocol === "http"
                        ? [
                            {
                              label: "HTTPS 重定向",
                              value: listener.httpsRedirect ? "开启" : "关闭",
                            },
                          ]
                        : []),
                      { label: "HTTP2", value: listener.http2 ? "开启" : "关闭" },
                      { label: "WebSocket", value: listener.webSocket ? "开启" : "关闭" },
                    ]
                  : []),
              ]}
            />
          </Collapse.Item>
        ))}
      </Collapse>
    </Space>
  );
}
