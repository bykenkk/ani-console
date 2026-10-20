import { Form, Modal } from "@arco-design/web-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { registerImage } from "@/api/images";
import { validateForm } from "@/lib/form";
import ImageRegistrationFields from "../ImageRegistrationFields";

type RegisterImageModalProps = {
  onCancel: () => void;
  onCreated: () => void;
};

type RegisterImageFormValues = {
  imageReference: string;
  displayName: string;
  description?: string;
  purposes: string[];
  accelerator?: string;
};

export default function RegisterImageModal({ onCancel, onCreated }: RegisterImageModalProps) {
  const [form] = Form.useForm<RegisterImageFormValues>();
  const client = useQueryClient();
  const mutation = useMutation({
    mutationFn: (input: RegisterImageFormValues) =>
      registerImage({
        accelerator: input.accelerator,
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
