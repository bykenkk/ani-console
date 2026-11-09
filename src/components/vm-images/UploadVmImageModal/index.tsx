import { useEffect, useRef, useState } from "react";
import { Form, Modal, Progress, Radio, Typography } from "@arco-design/web-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createVmImage,
  uploadVmImageFile,
  type VmImage,
  type VmImageKind,
  type VmImageOS,
  type VmImageUploadPhase,
} from "@/api/vm-images";
import { validateForm } from "@/lib/form";
import VmImageFileSelect from "../VmImageFileSelect";
import VmImageFormFields from "../VmImageFormFields";

interface UploadVmImageModalProps {
  image?: VmImage;
  onCancel: () => void;
  onSubmitted: () => void;
}

interface UploadVmImageFormValues {
  name: string;
  description?: string;
  kind: VmImageKind;
  osFamily: VmImageOS["osFamily"];
  osVersion: string;
  sourceCapacityGb: string;
  supportsCloudInit?: boolean;
  file: File;
}

export default function UploadVmImageModal({
  image,
  onCancel,
  onSubmitted,
}: UploadVmImageModalProps) {
  const [form] = Form.useForm<UploadVmImageFormValues>();
  const client = useQueryClient();
  const controller = useRef<AbortController | null>(null);
  const submitted = useRef(false);
  const target = useRef(image);
  const [registered, setRegistered] = useState(Boolean(image));
  const [phase, setPhase] = useState<VmImageUploadPhase>("preparing");
  const [percent, setPercent] = useState(0);
  useEffect(() => () => controller.current?.abort(), []);
  const upload = useMutation({
    retry: false,
    meta: {
      feedback: {
        channel: "message",
        action: "上传镜像",
        successText: "镜像上传已提交",
        errorFallback: "镜像上传失败",
      },
    },
    mutationFn: async (values: UploadVmImageFormValues) => {
      const current = new AbortController();
      controller.current = current;
      setPhase("preparing");
      setPercent(0);
      try {
        if (!target.current) {
          target.current = await createVmImage(
            {
              name: values.name.trim(),
              description: values.description?.trim() ?? "",
              kind: values.kind,
              format: values.kind === "DISK_IMAGE" ? "qcow2" : "iso",
              source_capacity_gb: values.sourceCapacityGb,
              initialization_capability:
                values.kind === "DISK_IMAGE" &&
                values.osFamily === "linux" &&
                values.supportsCloudInit
                  ? "CLOUD_INIT_NOCLOUD"
                  : undefined,
              os: { os_family: values.osFamily, os_version: values.osVersion.trim() },
            },
            values.file,
            current.signal,
          );
          setRegistered(true);
          await client.invalidateQueries({ queryKey: ["vm-images", "list"] });
        }
        await uploadVmImageFile({
          imageId: target.current.imageId,
          file: values.file,
          signal: current.signal,
          onPhase: setPhase,
          onProgress: setPercent,
        });
      } catch (error) {
        if (current.signal.aborted) throw new Error("镜像上传已取消，可从列表继续上传");
        throw error;
      } finally {
        controller.current = null;
      }
    },
    onSuccess: onSubmitted,
    onSettled: () => client.invalidateQueries({ queryKey: ["vm-images", "list"] }),
  });
  const submit = async () => {
    if (submitted.current) return;
    submitted.current = true;
    try {
      await upload.mutateAsync(await validateForm(form));
    } finally {
      submitted.current = false;
    }
  };
  return (
    <Modal
      visible
      title={image ? "上传镜像文件" : "添加镜像"}
      style={{ width: 600 }}
      okText={registered ? "上传文件" : "开始上传"}
      cancelText={upload.isPending ? "取消上传" : "取消"}
      confirmLoading={upload.isPending}
      closable={!upload.isPending}
      escToExit={!upload.isPending}
      maskClosable={!upload.isPending}
      onCancel={() => {
        if (upload.isPending) controller.current?.abort();
        else onCancel();
      }}
      onOk={submit}
    >
      <Form
        form={form}
        layout="vertical"
        disabled={upload.isPending}
        initialValues={{
          kind: image?.kind ?? "DISK_IMAGE",
          osFamily: "linux",
          description: "",
          supportsCloudInit: false,
        }}
        onValuesChange={(_, values) => {
          if (
            values.supportsCloudInit &&
            (values.kind !== "DISK_IMAGE" || values.osFamily !== "linux")
          ) {
            form.setFieldValue("supportsCloudInit", false);
          }
        }}
      >
        {image ? (
          <Typography.Paragraph>镜像：{image.name}</Typography.Paragraph>
        ) : (
          <VmImageFormFields disabled={upload.isPending || registered} />
        )}
        <Form.Item label="镜像来源" extra="链接导入暂未开放">
          {/* TODO: 后端提供链接导入契约后接入链接来源，不复用上传目标地址作为来源地址。 */}
          <Radio.Group value="file" disabled={upload.isPending}>
            <Radio value="file">本地文件</Radio>
            <Radio value="url" disabled>
              镜像链接
            </Radio>
          </Radio.Group>
        </Form.Item>
        <Form.Item
          field="file"
          label="镜像文件"
          required
          rules={[
            {
              validator: (file: File | undefined, callback) =>
                callback(!file ? "请选择镜像文件" : !file.size ? "不能上传空文件" : undefined),
            },
          ]}
        >
          <VmImageFileSelect disabled={upload.isPending} />
        </Form.Item>
        {upload.isPending ? (
          <div className="flex flex-col gap-2" aria-live="polite">
            <Typography.Text>
              {phase === "preparing"
                ? "正在准备上传目标…"
                : percent < 100
                  ? "正在上传文件…"
                  : "文件已发送，正在确认上传结果…"}
            </Typography.Text>
            {phase === "uploading" ? <Progress percent={percent} /> : null}
          </div>
        ) : registered && !image ? (
          <Typography.Paragraph type="secondary">
            镜像记录已创建，再次提交将继续上传文件。
          </Typography.Paragraph>
        ) : null}
      </Form>
    </Modal>
  );
}
