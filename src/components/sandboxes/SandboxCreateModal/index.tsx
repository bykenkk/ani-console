import {
  createInstance,
  type SandboxConfig,
  type SandboxNetworkEgressPolicy,
  type SandboxTemplate as ApiSandboxTemplate,
} from "@/api/instances/legacy";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import SandboxCreateForm from "./SandboxCreateForm";

import { buildCreateRequest } from "./utils";

import type { CpuInstanceComputeSpec } from "@/lib/instances";

export type SandboxTemplate = ApiSandboxTemplate;

type EgressPolicy = SandboxNetworkEgressPolicy;

export type SandboxCreateFormValues = {
  name: string;
  template_id: string;
  compute_spec: CpuInstanceComputeSpec;
  session_timeout: string;
  idle_timeout: string;
  on_timeout: NonNullable<SandboxConfig["on_timeout"]>;
  egress_policy: EgressPolicy;
  egress_allowlist: string;
  auto_start: boolean;
};

type SandboxCreateModalProps = {
  onCancel: () => void;
  onCreated: () => void;
};

export default function SandboxCreateModal({ onCancel, onCreated }: SandboxCreateModalProps) {
  const queryClient = useQueryClient();
  const create = useMutation({
    meta: {
      feedback: {
        channel: "message",
        action: "创建",
        successText: "沙箱创建已提交",
        errorFallback: "创建失败，请检查配置后重试",
      },
    },
    mutationFn: async ({
      values,
      template,
    }: {
      values: SandboxCreateFormValues;
      template: SandboxTemplate;
    }) => {
      const submitData = buildCreateRequest(values, template);
      await createInstance(submitData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sandbox-instances"] });
      onCreated();
    },
  });

  const close = () => {
    if (create.isPending) return;
    onCancel();
  };

  return (
    <SandboxCreateForm
      submitting={create.isPending}
      onCancel={close}
      onSubmit={(values, template) => create.mutate({ values, template })}
    />
  );
}
