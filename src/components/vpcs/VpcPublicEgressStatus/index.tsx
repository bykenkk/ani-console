import type { NetworkVpcPublicEgress } from "@/api/network";
import { StatusBadge } from "@/components/common";

type VpcPublicEgressStatusProps = { binding?: NetworkVpcPublicEgress };

export default function VpcPublicEgressStatus({ binding }: VpcPublicEgressStatusProps) {
  if (!binding) return <StatusBadge tone="neutral">未绑定</StatusBadge>;
  if (binding.state === "failed" || binding.state === "degraded") {
    return (
      <StatusBadge status={binding.state} reason={binding.reason} message={binding.reason_message}>
        绑定异常
      </StatusBadge>
    );
  }
  if (binding.state === "deleting") {
    return <StatusBadge status="deleting">解绑中</StatusBadge>;
  }
  if (binding.binding_state === "reserved") {
    return <StatusBadge status="provisioning">绑定中</StatusBadge>;
  }
  if (binding.observation_stale) {
    return <StatusBadge tone="warning">观测过期</StatusBadge>;
  }
  if (binding.applied_enabled === undefined) {
    return <StatusBadge tone="warning">待观测</StatusBadge>;
  }
  if (binding.applied_enabled !== binding.desired_enabled) {
    return (
      <StatusBadge status="provisioning">
        {binding.desired_enabled ? "启用中" : "停用中"}
      </StatusBadge>
    );
  }
  return (
    <StatusBadge tone={binding.applied_enabled ? "success" : "neutral"}>
      {binding.applied_enabled ? "已绑定" : "已停用"}
    </StatusBadge>
  );
}
