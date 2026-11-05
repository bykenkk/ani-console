import type { NavigateFn } from "@tanstack/react-router";

export type ResourceDetailType =
  | "model"
  | "training-task"
  | "finetuning-task"
  | "inference-service"
  | "inference-policy"
  | "vm-instance"
  | "container-instance"
  | "gpu-instance"
  | "sandbox-instance"
  | "k8s-cluster"
  | "knowledge-base"
  | "vpc"
  | "subnet"
  | "security-group"
  | "load-balancer"
  | "volume"
  | "filesystem"
  | "bucket"
  | "vector-store";

export type ResourceDetailTarget = {
  type: ResourceDetailType;
  id: string;
};

export function navigateToResourceDetail(
  navigate: NavigateFn,
  resource: ResourceDetailTarget,
): void {
  switch (resource.type) {
    case "training-task":
      navigate({ to: "/ai-training/$executionId", params: { executionId: resource.id } });
      return;
    case "finetuning-task":
      navigate({ to: "/ai-finetuning/$executionId", params: { executionId: resource.id } });
      return;
    case "model":
      navigate({ to: "/ai-models/$modelId", params: { modelId: resource.id } });
      return;
    case "inference-service":
      navigate({ to: "/ai-inference/$serviceId", params: { serviceId: resource.id } });
      return;
    case "inference-policy":
      navigate({ to: "/ai-inference-policies/$policyId", params: { policyId: resource.id } });
      return;
    case "vm-instance":
      navigate({ to: "/vms/$instanceId", params: { instanceId: resource.id } });
      return;
    case "container-instance":
      navigate({
        to: "/containers/$instanceId",
        params: { instanceId: resource.id },
      });
      return;
    case "gpu-instance":
      navigate({ to: "/gpu-containers/$instanceId", params: { instanceId: resource.id } });
      return;
    case "sandbox-instance":
      navigate({ to: "/sandboxes/$instanceId", params: { instanceId: resource.id } });
      return;
    case "k8s-cluster":
      navigate({ to: "/k8s-clusters/$clusterId", params: { clusterId: resource.id } });
      return;
    case "knowledge-base":
      navigate({
        to: "/kb/$kbId",
        params: { kbId: resource.id },
      });
      return;
    case "vpc":
      navigate({ to: "/vpcs/$vpcId", params: { vpcId: resource.id } });
      return;
    case "subnet":
      navigate({ to: "/subnets/$subnetId", params: { subnetId: resource.id } });
      return;
    case "security-group":
      navigate({
        to: "/security-groups/$securityGroupId",
        params: { securityGroupId: resource.id },
      });
      return;
    case "load-balancer":
      navigate({
        to: "/load-balancers/$loadBalancerId",
        params: { loadBalancerId: resource.id },
      });
      return;
    case "volume":
      navigate({ to: "/volumes/$volumeId", params: { volumeId: resource.id } });
      return;
    case "filesystem":
      navigate({
        to: "/filesystems/$filesystemId",
        params: { filesystemId: resource.id },
      });
      return;
    case "bucket":
      navigate({ to: "/objects/$bucketId", params: { bucketId: resource.id } });
      return;
    case "vector-store":
      navigate({
        to: "/vector-stores/$vectorStoreId",
        params: { vectorStoreId: resource.id },
      });
      return;
  }
}
