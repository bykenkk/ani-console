import { Descriptions } from "@arco-design/web-react";

type InferenceInvocationTestProps = {
  servedModelName: string;
  status: string;
  endpointUrl?: string | null;
};

export default function InferenceInvocationTest({
  servedModelName,
  status,
  endpointUrl,
}: InferenceInvocationTestProps) {
  return (
    <div>
      <Descriptions
        column={1}
        data={[
          { label: "服务状态", value: status },
          { label: "服务模型名", value: servedModelName },
          { label: "调用地址", value: endpointUrl ?? "-" },
        ]}
      />
    </div>
  );
}
