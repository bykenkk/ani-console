import { Form, Modal, Typography } from "@arco-design/web-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateImageRegistration, type ImageRegistration } from "@/api/images";
import { validateForm } from "@/lib/form";
import ImageRegistrationFields from "../ImageRegistrationFields";

type EditImageRegistrationModalProps = {
  image: ImageRegistration;
  onCancel: () => void;
};

type EditImageRegistrationFormValues = {
  displayName: string;
  description?: string;
  purposes: string[];
  accelerator?: string;
};

export default function EditImageRegistrationModal({
  image,
  onCancel,
}: EditImageRegistrationModalProps) {
  const [form] = Form.useForm<EditImageRegistrationFormValues>();
  const client = useQueryClient();
  const mutation = useMutation({
    mutationFn: (input: EditImageRegistrationFormValues) =>
      updateImageRegistration(image.image_id, {
        accelerator: input.accelerator,
        displayName: input.displayName.trim(),
        description: input.description?.trim() || "",
        purposes: input.purposes ?? [],
        expectedVersion: image.version,
      }),
    meta: {
      feedback: {
        channel: "message",
        action: "更新镜像登记",
        successText: "镜像登记已更新",
        errorFallback: "更新失败；如版本已变化，请关闭后刷新列表重试",
      },
    },
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ["image-registrations"] });
      await client.invalidateQueries({
        queryKey: ["image-registration", image.scope, image.image_id],
        refetchType: "none",
      });
      onCancel();
    },
  });
  return (
    <Modal
      visible
      title="编辑镜像登记"
      onCancel={onCancel}
      escToExit={!mutation.isPending}
      closable={!mutation.isPending}
      cancelButtonProps={{ disabled: mutation.isPending }}
      confirmLoading={mutation.isPending}
      onOk={async () => mutation.mutateAsync(await validateForm(form))}
    >
      <Typography.Paragraph className="break-all" type="secondary">
        {image.resolvedReference}
      </Typography.Paragraph>
      <Form
        form={form}
        layout="vertical"
        disabled={mutation.isPending}
        initialValues={{
          displayName: image.displayName,
          description: image.description ?? "",
          purposes: image.purposes ?? [],
          accelerator: image.accelerator || "undeclared",
        }}
      >
        <ImageRegistrationFields creating={false} />
      </Form>
    </Modal>
  );
}
