import { Form, Input, Modal } from "@arco-design/web-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import {
  getInferenceService,
  updateInferenceService,
  type InferenceService,
  type UpdateInferenceInput,
} from "@/api/inference";
import { getModelVersion } from "@/api/models";
import { EngineSelect, ModelSelect, ModelVersionSelect } from "@/components/ai-models";
import { showMessage } from "@/lib/feedback";
import { validateForm } from "@/lib/form";
import { withId } from "@/lib/id";

type UpdateInferenceFormValues = {
  model_version_id: string;
  engine_type: string;
  engine_image: string;
  command: string;
};
type UpdateInferenceModalProps = {
  serviceId: string;
  onCancel: () => void;
  onSubmitted: () => Promise<void>;
};

export default function UpdateInferenceModal({
  serviceId,
  onCancel,
  onSubmitted,
}: UpdateInferenceModalProps) {
  const [form] = Form.useForm<UpdateInferenceFormValues>();
  const [snapshot, setSnapshot] = useState<InferenceService>();
  const [chosenModelId, setChosenModelId] = useState<string>();
  const submitting = useRef(false);
  const detail = useQuery({
    queryKey: ["governance-inference-service", serviceId],
    queryFn: ({ signal }) => getInferenceService(serviceId, signal),
    meta: {
      errorNotification: { id: withId("inference-service", serviceId), action: "推理服务详情加载" },
    },
  });
  const currentVersion = useQuery({
    queryKey: ["governance-model-version", snapshot?.model_version_id],
    enabled: Boolean(snapshot?.model_version_id),
    queryFn: ({ signal }) => getModelVersion(snapshot!.model_version_id, signal),
    meta: {
      errorNotification: {
        id: withId("inference-version", snapshot?.model_version_id),
        action: "模型版本加载",
      },
    },
  });
  const modelId = chosenModelId ?? currentVersion.data?.model.id ?? "";
  useEffect(() => {
    if (snapshot || !detail.data || detail.isFetching || detail.isError) return;
    const item = detail.data;
    setSnapshot(item);
    form.setFieldsValue({
      model_version_id: item.model_version_id,
      engine_type: item.engine_type,
      engine_image: item.engine_image,
      command: item.command,
    });
  }, [detail.data, detail.isFetching, detail.isError, form, snapshot]);
  const update = useMutation({
    mutationFn: async (input: UpdateInferenceInput) => {
      if (input.model_version_id) {
        const latest = await getModelVersion(input.model_version_id);
        if (latest.version.status.toLowerCase() !== "ready")
          throw new Error("模型版本尚未就绪，请重新选择");
      }
      await updateInferenceService(serviceId, input);
    },
    meta: {
      feedback: {
        channel: "message",
        action: "更新推理服务",
        successText: "更新推理服务已提交",
        errorFallback: "更新推理服务失败",
      },
    },
    onSuccess: onSubmitted,
  });
  const submit = async () => {
    if (submitting.current || !snapshot) return;
    submitting.current = true;
    try {
      const values = await validateForm<UpdateInferenceFormValues>(form);
      const input: UpdateInferenceInput = {
        expected_generation: snapshot.generation,
        update_mask: [],
      };
      if (values.model_version_id !== snapshot.model_version_id) {
        input.model_version_id = values.model_version_id;
        input.update_mask.push("modelVersionId");
      }
      const engineType = values.engine_type.trim();
      const engineImage = values.engine_image.trim();
      if (
        engineType !== snapshot.engine_type ||
        engineImage !== snapshot.engine_image ||
        values.command !== snapshot.command
      ) {
        input.engine_type = engineType;
        input.engine_image = engineImage;
        input.command = values.command;
        input.update_mask.push("engine");
      }
      if (!input.update_mask.length) {
        showMessage({ type: "info", content: "配置未变化" });
        return;
      }
      await update.mutateAsync(input);
    } catch {
      // 字段校验由统一入口提示；请求错误由 mutation feedback 处理。
    } finally {
      submitting.current = false;
    }
  };
  const required = (message: string) => [{ type: "string", required: true, match: /\S/, message }];
  return (
    <Modal
      visible
      title="更新推理服务"
      onCancel={onCancel}
      onOk={submit}
      confirmLoading={update.isPending}
      okButtonProps={{ disabled: !snapshot || !(Number(snapshot.generation) > 0) }}
      cancelButtonProps={{ disabled: update.isPending }}
      closable={!update.isPending}
      escToExit={!update.isPending}
      style={{ width: 720, maxWidth: "calc(100vw - 48px)" }}
    >
      <Form form={form} layout="vertical" disabled={!snapshot || update.isPending}>
        <Form.Item label="模型">
          <ModelSelect
            value={modelId}
            onChange={(id) => {
              setChosenModelId(id);
              form.setFieldsValue({ model_version_id: "" });
            }}
          />
        </Form.Item>
        <Form.Item
          field="model_version_id"
          label="模型版本"
          rules={required("请选择已就绪的模型版本")}
        >
          <ModelVersionSelect key={modelId} modelId={modelId} />
        </Form.Item>
        <Form.Item field="engine_type" label="引擎类型" rules={required("请选择引擎类型")}>
          <EngineSelect />
        </Form.Item>
        <Form.Item field="engine_image" label="运行镜像" rules={required("请输入运行镜像地址")}>
          <Input />
        </Form.Item>
        {/* FIXME(inference-model-name): 命令中的模型名可能与自动生成的服务模型名不一致；若网关未做名称映射，外部调用可能失败，待核对后处理。 */}
        <Form.Item field="command" label="完整启动命令" rules={required("请输入完整启动命令")}>
          <Input.TextArea autoSize={{ minRows: 3, maxRows: 6 }} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
