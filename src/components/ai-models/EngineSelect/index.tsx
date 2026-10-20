import { Select } from "@arco-design/web-react";
import type { EngineSelectProps } from "./types";

export default function EngineSelect({ value, onChange, disabled, style }: EngineSelectProps) {
  return (
    <Select
      aria-label="引擎类型"
      placeholder="请选择引擎类型"
      value={value}
      onChange={onChange}
      disabled={disabled}
      style={style}
      options={[
        { value: "vllm", label: "vLLM" },
        { value: "sglang", label: "SGLang" },
      ]}
    />
  );
}

export type { EngineSelectProps, EngineType } from "./types";
