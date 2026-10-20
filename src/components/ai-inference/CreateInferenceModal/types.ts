import type { InferenceRuntimeMode } from "@/api/inference";

export interface CreateInferenceFormValues {
  name: string;
  model_id: string;
  model_version_id: string;
  engine_type: string;
  engine_image: string;
  command: string;
  cpu: number;
  memory: number;
  runtime_mode: InferenceRuntimeMode;
  replicas: number;
  worker_replicas?: number;
}

export interface CreateInferenceModalProps {
  onCancel: () => void;
  initialServiceName?: string;
  initialModelId?: string;
  initialModelVersionId?: string;
}
