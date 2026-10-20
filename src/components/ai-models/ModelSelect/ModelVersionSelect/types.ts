import type { ModelPageParams, ModelVersion } from "@/api/models";

export interface ModelVersionSelectProps {
  modelId: string;
  value?: string;
  onChange?: (value: string, version?: ModelVersion, modelName?: string) => void;
  disabled?: boolean;
}

export type ModelVersionOptionsParams = ModelPageParams & { modelId: string };
