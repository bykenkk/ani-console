import type { ExternalModelCandidate, ImportModelInput } from "@/api/models";

export interface ModelSourceValue {
  source: ImportModelInput["source"];
  repo_id: string;
}

export interface ModelSourceInputProps {
  value?: ModelSourceValue;
  onChange?: (value: ModelSourceValue, candidate?: ExternalModelCandidate) => void;
  disabled?: boolean;
}
