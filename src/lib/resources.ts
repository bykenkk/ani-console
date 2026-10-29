import type { NavigateFn } from "@tanstack/react-router";

export type ResourceDetailType =
  | "model"
  | "training-task"
  | "inference-service"
  | "vm-instance"
  | "container-instance"
  | "gpu-instance"
  | "sandbox-instance"
  | "k8s-cluster"
  | "knowledge-base"
  | "vpc"
  | "subnet"
  | "security-group"
  | "network-route"
  | "load-balancer"
  | "volume"
  | "filesystem"
  | "bucket"
  | "vector-store";

export type KnowledgeBaseDetailSearch = {
  tab: string;
};

export type VectorStoreDetailSearch = {
  tab: string | undefined;
};

export type ResourceDetailSearch = KnowledgeBaseDetailSearch | VectorStoreDetailSearch;

export type ResourceDetailTypeWithoutSearch = Exclude<
  ResourceDetailType,
  "knowledge-base" | "vector-store"
>;

export type ResourceDetailTarget =
  | { type: ResourceDetailTypeWithoutSearch; id: string }
  | { type: "knowledge-base"; id: string; search: KnowledgeBaseDetailSearch }
  | { type: "vector-store"; id: string; search: VectorStoreDetailSearch };

export function navigateToResourceDetail(
  navigate: NavigateFn,
  resource: ResourceDetailTarget,
): void {
  switch (resource.type) {
    case "training-task":
      navigate({ to: "/ai-training/$executionId", params: { executionId: resource.id } });
      return;
    case "model":
      navigate({ to: "/ai-models/$modelId", params: { modelId: resource.id } });
      return;
    case "inference-service":
      navigate({ to: "/ai-inference/$serviceId", params: { serviceId: resource.id } });
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
      // TODO(feature-visibility): 待知识库管理支持后恢复详情跳转。
      // navigate({
      //   to: "/kb/$kbId",
      //   params: { kbId: resource.id },
      //   search: resource.search,
      // });
      return;
    case "vpc":
      navigate({ to: "/vpcs/$vpcId", params: { vpcId: resource.id } });
      return;
    case "subnet":
      navigate({ to: "/subnets/$subnetId", params: { subnetId: resource.id } });
      return;
    case "security-group":
      // TODO(feature-visibility): 待安全组支持后恢复详情跳转。
      // navigate({
      //   to: "/security-groups/$securityGroupId",
      //   params: { securityGroupId: resource.id },
      // });
      return;
    case "network-route":
      // TODO(feature-visibility): 待路由支持后恢复详情跳转。
      // navigate({ to: "/routes/$routeId", params: { routeId: resource.id } });
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
      // TODO(feature-visibility): 待文件存储支持后恢复详情跳转。
      // navigate({
      //   to: "/filesystems/$filesystemId",
      //   params: { filesystemId: resource.id },
      // });
      return;
    case "bucket":
      navigate({ to: "/objects/$bucketId", params: { bucketId: resource.id } });
      return;
    case "vector-store":
      // TODO(feature-visibility): 待向量存储支持后恢复详情跳转。
      // navigate({
      //   to: "/vector-stores/$vectorStoreId",
      //   params: { vectorStoreId: resource.id },
      //   search: resource.search,
      // });
      return;
  }
}
