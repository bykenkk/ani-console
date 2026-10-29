import { useRouter } from "@tanstack/react-router";
import { useCallback } from "react";
import type { ResourceDetailType } from "@/lib/resources";

const resourceListRoutes = {
  model: "/ai-models",
  "training-task": "/ai-training",
  "inference-service": "/ai-inference",
  "vm-instance": "/vms",
  "container-instance": "/containers",
  "gpu-instance": "/gpu-containers",
  "sandbox-instance": "/sandboxes",
  "k8s-cluster": "/k8s-clusters",
  // TODO(feature-visibility): 待知识库管理支持后恢复列表返回目标。
  // "knowledge-base": "/kb",
  "knowledge-base": "/",
  vpc: "/vpcs",
  subnet: "/subnets",
  // TODO(feature-visibility): 待安全组支持后恢复列表返回目标。
  // "security-group": "/security-groups",
  "security-group": "/",
  // TODO(feature-visibility): 待路由支持后恢复列表返回目标。
  // "network-route": "/routes",
  "network-route": "/",
  "load-balancer": "/load-balancers",
  volume: "/volumes",
  // TODO(feature-visibility): 待文件存储支持后恢复列表返回目标。
  // filesystem: "/filesystems",
  filesystem: "/",
  bucket: "/objects",
  // TODO(feature-visibility): 待向量存储支持后恢复列表返回目标。
  // "vector-store": "/vector-stores",
  "vector-store": "/",
} as const satisfies Record<ResourceDetailType, string>;

export function useBackOrFallback(
  ...[resourceType, bucketId]:
    | [resourceType: ResourceDetailType]
    | [resourceType: "object", bucketId: string]
) {
  const router = useRouter();

  return useCallback(() => {
    // TODO(feature-visibility): 待隐藏功能支持后移除此分支，恢复下方原返回逻辑。
    // 暂直接返回概览，避免旧浏览历史再次进入这些功能的列表或详情。
    if (resourceType !== "object" && resourceListRoutes[resourceType] === "/") {
      router.navigate({ to: "/", replace: true });
      return;
    }
    if (router.history.canGoBack()) {
      router.history.back();
      return;
    }
    if (resourceType === "object") {
      router.navigate({ to: "/objects/$bucketId", params: { bucketId }, replace: true });
      return;
    }
    router.navigate({ to: resourceListRoutes[resourceType], replace: true });
  }, [router, resourceType, bucketId]);
}
