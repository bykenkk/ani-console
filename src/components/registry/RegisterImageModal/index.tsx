import { Form, Modal } from "@arco-design/web-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { registerImage, type RegisterImageInput } from "@/api/images";
import { validateForm } from "@/lib/form";
import ImageRegistrationFields from "../ImageRegistrationFields";

export default function RegisterImageModal({
  onCancel,
  onCreated,
}: {
  onCancel: () => void;
  onCreated: () => void;
}) {
  const [form] = Form.useForm<RegisterImageInput>();
  const client = useQueryClient();
  const mutation = useMutation({
    mutationFn: (input: RegisterImageInput) =>
      registerImage({
        ...input,
        imageReference: input.imageReference.trim(),
        displayName: input.displayName.trim(),
        description: input.description?.trim() || "",
        purposes: input.purposes ?? [],
      }),
    meta: {
      feedback: {
        channel: "message",
        action: "登记镜像",
        successText: "镜像已登记",
        errorFallback: "登记失败",
      },
    },
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ["image-registrations"] });
      onCreated();
    },
  });
  return (
    <Modal
      visible
      title="登记镜像"
      onCancel={onCancel}
      maskClosable={!mutation.isPending}
      escToExit={!mutation.isPending}
      closable={!mutation.isPending}
      cancelButtonProps={{ disabled: mutation.isPending }}
      confirmLoading={mutation.isPending}
      onOk={async () => mutation.mutateAsync(await validateForm(form))}
    >
      <Form
        form={form}
        layout="vertical"
        disabled={mutation.isPending}
        initialValues={{ purposes: [], accelerator: "undeclared" }}
      >
        <ImageRegistrationFields creating />
      </Form>
    </Modal>
  );
}
