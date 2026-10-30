import type { NetworkEip } from "@/api/network";
import { StatusBadge } from "@/components/common";

type EipBindingStatusProps = { eip: NetworkEip };

export default function EipBindingStatus({ eip }: EipBindingStatusProps) {
  if (eip.binding_state === "unbound") {
    return <StatusBadge tone="neutral">未绑定</StatusBadge>;
  }
  if (eip.binding_target?.state === "failed") {
    return <StatusBadge status="failed">绑定异常</StatusBadge>;
  }
  if (eip.binding_target?.state === "deleting") {
    return <StatusBadge status="deleting">解绑中</StatusBadge>;
  }
  if (eip.binding_state === "reserved") {
    return <StatusBadge status="provisioning">绑定中</StatusBadge>;
  }
  if (eip.binding_state === "bound") {
    return <StatusBadge tone="success">已绑定</StatusBadge>;
  }
  return <StatusBadge tone="neutral">未知</StatusBadge>;
}
