import { Button, Input, Space, Typography } from "@arco-design/web-react";
import { useQuery } from "@tanstack/react-query";
import { getInferenceRuntime } from "@/api/inference";
import { copyToClipboard } from "@/lib/clipboard";
import { withId } from "@/lib/id";

type InferenceInvocationAddressProps = { serviceId: string };

export default function InferenceInvocationAddress({ serviceId }: InferenceInvocationAddressProps) {
  const runtime = useQuery({
    queryKey: ["governance-inference-runtime", serviceId],
    queryFn: ({ signal }) => getInferenceRuntime(serviceId, signal),
    meta: {
      errorNotification: { id: withId("inference-runtime", serviceId), action: "推理运行诊断加载" },
    },
  });
  const endpoint = runtime.data?.invocation_endpoint;
  return (
    <div className="flex flex-col gap-4">
      <Typography.Title heading={6}>调用地址</Typography.Title>
      <Input
        aria-label="推理调用地址"
        readOnly
        value={endpoint ?? ""}
        placeholder="尚未配置调用地址"
      />
      <Space>
        <Button disabled={!endpoint} onClick={() => copyToClipboard(endpoint!, "调用地址")}>
          复制地址
        </Button>
        <Button loading={runtime.isFetching} onClick={() => runtime.refetch()}>
          刷新
        </Button>
      </Space>
      {/* FIXME(inference-invocation): 调用地址已由 runtime 提供；调用凭证获取和浏览器调用契约仍缺失，补齐前不发起测试请求。 */}
    </div>
  );
}
