import type { InferenceService } from "@/api/inference/legacy";
import { StatusBadge } from "@/components/common";

type InferenceStatusTagProps = Pick<
  InferenceService,
  "status" | "status_reason" | "status_message"
>;

export default function InferenceStatusTag({
  status,
  status_reason,
  status_message,
}: InferenceStatusTagProps) {
  return (
    <StatusBadge
      status={status}
      reason={status === "failed" ? status_reason : undefined}
      message={status === "failed" ? status_message : undefined}
    />
  );
}
