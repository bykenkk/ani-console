import { Descriptions, Tag } from "@arco-design/web-react";
import type { InferencePolicy } from "@/api/inference-policies";

type InferencePolicyRulesProps = { policy: InferencePolicy };

export default function InferencePolicyRules({ policy }: InferencePolicyRulesProps) {
  return (
    <Descriptions
      column={1}
      data={[
        {
          label: "授权模型",
          value: policy.allowed_model_names.length ? (
            <div className="flex flex-wrap gap-2">
              {policy.allowed_model_names.map((name) => (
                <Tag key={name} className="h-auto! max-w-full whitespace-normal! break-all">
                  {name}
                </Tag>
              ))}
            </div>
          ) : (
            "拒绝全部模型"
          ),
        },
        { label: "QPS（每秒请求上限）", value: policy.requests_per_second || "不限" },
        { label: "RPM（每分钟请求上限）", value: policy.requests_per_minute || "不限" },
        { label: "RPH（每小时请求上限）", value: policy.requests_per_hour || "不限" },
      ]}
    />
  );
}
