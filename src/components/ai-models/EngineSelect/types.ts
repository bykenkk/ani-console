import type { CSSProperties } from "react";

export type EngineType = "vllm" | "sglang";

export interface EngineSelectProps {
  value?: string;
  onChange?: (value: EngineType) => void;
  disabled?: boolean;
  style?: CSSProperties;
}
