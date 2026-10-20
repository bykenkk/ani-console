import type { ModelCapability, ModelFormat } from "@/api/models";
import type { EngineType, ModelSourceValue } from "@/components/ai-models";

export interface ImportModelFormValues {
  model_source: ModelSourceValue;
  model_name: string;
  display_name: string;
  description: string;
  revision: string;
  format: ModelFormat;
  capabilities: ModelCapability[];
  engine_type: EngineType;
  engine_image: string;
  startup_command: string;
}

export interface ImportModelModalProps {
  onCancel: () => void;
}
