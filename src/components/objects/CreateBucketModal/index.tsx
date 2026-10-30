import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Form, Input, Modal, Select, Typography } from "@arco-design/web-react";
import { createBucket } from "@/api/storage/buckets";
import { validateForm } from "@/lib/form";

type CreateBucketModalProps = { onCancel: () => void; onCreated?: () => void };
type CreateBucketFormValues = { name: string };

export default function CreateBucketModal({ onCancel, onCreated }: CreateBucketModalProps) {
  const [form] = Form.useForm<CreateBucketFormValues>();
  const queryClient = useQueryClient();
  const create = useMutation({
    meta: {
      feedback: {
        channel: "message",
        action: "创建存储桶",
        successText: "存储桶已创建",
        errorFallback: "创建失败",
      },
    },
    mutationFn: (values: CreateBucketFormValues) => createBucket({ name: values.name.trim() }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["storage", "buckets"] });
      onCreated?.();
      onCancel();
    },
  });
  return (
    <Modal
      visible
      title="创建存储桶"
      onCancel={onCancel}
      onOk={async () => {
        const values = await validateForm<CreateBucketFormValues>(form);
        await create.mutateAsync(values);
      }}
      confirmLoading={create.isPending}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          label="名称"
          field="name"
          required
          rules={[
            { required: true, message: "请输入存储桶名称" },
            {
              validator: (value, callback) => {
                const name = typeof value === "string" ? value.trim() : "";
                callback(
                  !/^[a-z0-9](?:[a-z0-9-]{0,30}[a-z0-9])?$/.test(name) || name.includes("--")
                    ? "名称需为 1–32 位小写字母、数字或连字符，首尾为字母或数字，不能连续使用连字符"
                    : undefined,
                );
              },
            },
          ]}
        >
          <Input
            placeholder="1–32 位小写字母、数字或连字符"
            maxLength={32}
            disabled={create.isPending}
          />
        </Form.Item>
        <Form.Item label="权限" required>
          <Select value="private" disabled>
            <Select.Option value="private">私有</Select.Option>
          </Select>
        </Form.Item>
        <Form.Item label="存储类型" required>
          <Select value="STANDARD" disabled>
            <Select.Option value="STANDARD">标准</Select.Option>
          </Select>
        </Form.Item>
        <Typography.Text type="secondary">创建后可在存储桶详情页上传对象。</Typography.Text>
      </Form>
    </Modal>
  );
}
