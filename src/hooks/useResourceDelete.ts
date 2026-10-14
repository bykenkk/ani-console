import { Modal } from "@arco-design/web-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteNetworkVpc } from "@/api/network";
import { deleteNetworkSubnet } from "@/api/network";
import { deleteNetworkSecurityGroup } from "@/api/network";
import { deleteNetworkRoute } from "@/api/network";
import { deleteNetworkLoadBalancer } from "@/api/network";
import { deleteVolume } from "@/api/storage/volumes";
import { deleteFilesystem } from "@/api/storage/filesystems";
import { deleteVectorStore } from "@/api/storage/vector-stores";
import { deleteModel } from "@/api/ai-services/models";
import { deleteInferenceService } from "@/api/ai-services/inference";
import { deleteKnowledgeBase } from "@/api/knowledge";
import { deleteK8sCluster } from "@/api/k8s-clusters";
import type { MutationFeedbackMeta } from "@/vite-env";
type ResourceDeleteTarget = {
  id?: string;
  name?: string;
  description?: string | null;
  destination_cidr?: string;
};
type DeleteConfig = {
  listQueryKey: string;
  detailQueryKey: string;
  feedback: MutationFeedbackMeta;
  title: string;
  content: (item: ResourceDeleteTarget) => string;
  remove: (id: string) => Promise<unknown>;
};
const resourceDeletion = {
  vpc: {
    listQueryKey: "network-vpcs",
    detailQueryKey: "network-vpc",
    feedback: {
      channel: "notification",
      id: "vpc-delete",
      action: "删除 VPC",
      successText: "删除 VPC 已提交",
      errorFallback: "请求失败",
    },
    title: "删除 VPC",
    content: (item) => `确定删除「${item.name}」？存在子网或关联资源时无法删除，请先清理相关资源。`,
    remove: deleteNetworkVpc,
  },
  subnet: {
    listQueryKey: "network-subnets",
    detailQueryKey: "network-subnet",
    feedback: {
      channel: "notification",
      id: "subnet-delete",
      action: "删除子网",
      successText: "删除子网已提交",
      errorFallback: "请求失败",
    },
    title: "删除子网",
    content: (item) => `确定删除「${item.name}」？存在关联实例时无法删除，请先清理相关资源。`,
    remove: deleteNetworkSubnet,
  },
  "security-group": {
    listQueryKey: "network-security-groups",
    detailQueryKey: "network-security-group",
    feedback: {
      channel: "notification",
      id: "security-group-delete",
      action: "删除安全组",
      errorFallback: "请求失败",
    },
    title: "删除安全组",
    content: (item) => `确定删除「${item.name}」？安全组被实例使用时无法删除，请先解除关联。`,
    remove: deleteNetworkSecurityGroup,
  },
  "network-route": {
    listQueryKey: "network-routes",
    detailQueryKey: "network-route",
    feedback: {
      channel: "notification",
      id: "route-delete",
      action: "删除路由",
      errorFallback: "请求失败",
    },
    title: "删除路由",
    content: (item) =>
      `确定删除「${item.description?.trim() || item.destination_cidr}」？删除后该转发规则将立即失效。`,
    remove: deleteNetworkRoute,
  },
  "load-balancer": {
    listQueryKey: "network-load-balancers",
    detailQueryKey: "network-load-balancer",
    feedback: {
      channel: "notification",
      id: "load-balancer-delete",
      action: "删除",
      successText: "删除请求已受理，资源将异步清理",
      errorFallback: "请求失败",
    },
    title: "删除负载均衡",
    content: (item) => `确定删除「${item.name}」？`,
    remove: deleteNetworkLoadBalancer,
  },
  volume: {
    listQueryKey: "volumes",
    detailQueryKey: "volume",
    feedback: {
      channel: "notification",
      id: "volume-delete",
      action: "删除块存储卷",
      errorFallback: "请求失败",
    },
    title: "删除块存储卷",
    content: (item) => `确定删除「${item.name}」？卷被实例挂载时无法删除。`,
    remove: deleteVolume,
  },
  filesystem: {
    listQueryKey: "filesystems",
    detailQueryKey: "filesystem",
    feedback: {
      channel: "notification",
      id: "filesystem-delete",
      action: "删除文件存储",
      errorFallback: "请求失败",
    },
    title: "删除文件存储",
    content: (item) => `确定删除「${item.name}」？请先确认没有实例正在使用该文件系统。`,
    remove: deleteFilesystem,
  },
  "vector-store": {
    listQueryKey: "vector-stores",
    detailQueryKey: "vector-store",
    feedback: {
      channel: "notification",
      id: "vector-store-delete",
      action: "删除向量存储",
      errorFallback: "请求失败",
    },
    title: "删除向量存储",
    content: (item) => `确定删除「${item.name}」？其中的向量数据将不可恢复。`,
    remove: deleteVectorStore,
  },
  model: {
    listQueryKey: "models",
    detailQueryKey: "model",
    feedback: {
      channel: "notification",
      id: "model-delete",
      action: "删除模型",
      errorFallback: "删除模型失败",
    },
    title: "删除模型",
    content: (item) => `确定删除「${item.name}」？有关联推理服务时后端将拒绝删除。`,
    remove: deleteModel,
  },
  "inference-service": {
    listQueryKey: "inference-services",
    detailQueryKey: "inference-service",
    feedback: {
      channel: "notification",
      id: "inference-delete",
      action: "删除推理服务",
      successText: "删除推理服务已提交",
      errorFallback: "请求失败",
    },
    title: "删除推理服务",
    content: (item) => `确定删除「${item.name}」？删除请求提交后将异步停止并清理该服务。`,
    remove: deleteInferenceService,
  },
  "knowledge-base": {
    listQueryKey: "knowledge-bases",
    detailQueryKey: "knowledge-base",
    feedback: {
      channel: "notification",
      id: "knowledge-base-delete",
      action: "删除知识库",
      errorFallback: "删除知识库失败",
    },
    title: "删除知识库",
    content: (item) => `确定删除「${item.name}」？知识库及其文档将不可恢复。`,
    remove: deleteKnowledgeBase,
  },
  "k8s-cluster": {
    listQueryKey: "k8s-clusters",
    detailQueryKey: "k8s-cluster",
    feedback: {
      channel: "notification",
      id: "k8s-cluster-delete",
      action: "删除集群",
      errorFallback: "请求失败",
    },
    title: "删除集群",
    content: (item) => `确定删除「${item.name ?? item.id}」？此操作不可恢复。`,
    remove: deleteK8sCluster,
  },
} satisfies Record<string, DeleteConfig>;
type ResourceDeleteKind = keyof typeof resourceDeletion;

export function useResourceDelete<T extends ResourceDeleteTarget = ResourceDeleteTarget>(
  kind: ResourceDeleteKind,
  onDeleted?: (item: T) => void | Promise<void>,
  options: { isDisabled?: (item: T) => boolean } = {},
) {
  const qc = useQueryClient();
  const config = resourceDeletion[kind];
  const mutation = useMutation({
    meta: { feedback: config.feedback },
    mutationFn: async (item: T) => {
      if (!item.id) throw new Error("缺少资源 ID");
      await config.remove(item.id);
    },
    onSuccess: async (_, item) => {
      await qc.invalidateQueries({
        queryKey: [config.detailQueryKey, item.id],
        exact: true,
        refetchType: "none",
      });
      await qc.invalidateQueries({ queryKey: [config.listQueryKey] });
      await onDeleted?.(item);
    },
  });
  const isDisabled = (item: T) => mutation.isPending || Boolean(options.isDisabled?.(item));
  const confirm = (item: T) => {
    if (isDisabled(item)) return;
    Modal.confirm({
      title: config.title,
      content: config.content(item),
      okButtonProps: { status: "danger" },
      onOk: () => mutation.mutateAsync(item),
    });
  };
  return { ...mutation, confirm, isDisabled };
}
