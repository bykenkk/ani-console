import { withFirst100 } from "@/api/pagination";
import { Select, Space, Typography } from "@arco-design/web-react";
import { useQuery } from "@tanstack/react-query";

import { listInferenceServices, type InferenceListParams } from "@/api/inference";
import { withId } from "@/lib/id";

const listInferenceOptions = withFirst100(listInferenceServices);

export default function KnowledgeModelSelect({
  capability,
  value,
  onChange,
  required = false,
}: {
  capability: NonNullable<InferenceListParams["capability"]>;
  value?: string;
  onChange?: (value: string | undefined) => void;
  required?: boolean;
}) {
  // FIXME(inference-contract): 目标推理路由待确认，用户同意保留原分支调用。
  // TODO(inference-contract): 路由恢复后验证 capability/status 筛选及可调用模型选项。
  const models = useQuery({
    queryKey: ["governance-inference-services", "options", capability, "running"],
    queryFn: ({ signal }) => listInferenceOptions({ capability, status: "running" }, signal),
    meta: {
      errorNotification: {
        id: withId("inference-models", capability),
        action: capability === "embedding" ? "向量化模型列表加载" : "推理模型列表加载",
        fallback: "请求失败，请稍后重试",
      },
    },
  });
  const options = (models.data?.items ?? []).map((service) => ({
    value: service.served_model_name,
    label: service.served_model_name,
  }));

  return (
    <Space direction="vertical" className="w-full">
      <Select
        aria-label={capability === "embedding" ? "向量化模型" : "默认推理模型"}
        value={value || undefined}
        onChange={onChange}
        onVisibleChange={(visible) => {
          if (visible) models.refetch({ cancelRefetch: false });
        }}
        loading={models.isFetching}
        allowClear={!required}
        placeholder={
          required
            ? capability === "embedding"
              ? "请选择向量化模型"
              : "请选择推理模型"
            : "使用服务端默认模型"
        }
        showSearch
        options={options}
        filterOption={(input, option) =>
          String(option.props.children).toLowerCase().includes(input.trim().toLowerCase())
        }
      />
      {models.isSuccess && options.length === 0 ? (
        <Typography.Text type="secondary">
          {required
            ? capability === "embedding"
              ? "暂无可用模型，请先部署向量化服务。"
              : "暂无可用模型，请先部署文本生成推理服务。"
            : "暂无可选模型，将使用服务端默认模型。"}
        </Typography.Text>
      ) : null}
    </Space>
  );
}
