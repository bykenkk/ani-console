import { createInstance } from "@/api/instances/legacy";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import SandboxCreateForm from "./SandboxCreateForm";
import { buildCreateRequest, type FormValues, type SandboxTemplate } from "./types";

type Props = {
  onCancel: () => void;
  onCreated: () => void;
};

export default function SandboxCreateModal({ onCancel, onCreated }: Props) {
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
    mutationFn: async ({ values, template }: { values: FormValues; template: SandboxTemplate }) => {
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
