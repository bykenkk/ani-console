import type { CreateInstanceInput } from "@/api/instances/legacy";
import { CPU_INSTANCE_COMPUTE_SPECS, type CpuInstanceComputeSpec } from "@/lib/instances";
import { INITIAL_VALUES } from "./constants";
import type { SandboxCreateFormValues, SandboxTemplate } from ".";

export function parseEgressAllowlist(value: string) {
  return value
    .split(/\r?\n/)
    .map((host) => host.trim())
    .filter(Boolean);
}

export function getTemplateComputeSpec(template?: SandboxTemplate): CpuInstanceComputeSpec {
  if (!template?.cpu_cores || !template.memory_gb) {
    return INITIAL_VALUES.compute_spec;
  }

  return (
    CPU_INSTANCE_COMPUTE_SPECS.find(
      (option) =>
        option.cpu === String(template.cpu_cores) && option.memory === `${template.memory_gb}Gi`,
    )?.value ?? INITIAL_VALUES.compute_spec
  );
}

export function buildCreateRequest(
  values: SandboxCreateFormValues,
  template: SandboxTemplate,
): CreateInstanceInput {
  const computeSpec =
    CPU_INSTANCE_COMPUTE_SPECS.find((option) => option.value === values.compute_spec) ??
    CPU_INSTANCE_COMPUTE_SPECS[1];

  return {
    name: values.name.trim(),
    kind: "sandbox",
    instance_type: "sandbox",
    image: template.image,
    cpu: computeSpec.cpu,
    memory: computeSpec.memory,
    auto_start: values.auto_start,
    termination_protection: false,
    replicas: 1,
    ssh_username: null,
    sandbox_config: {
      runtime_class: "sandbox-kata",
      template_id: template.id,
      session_timeout: values.session_timeout,
      idle_timeout: values.idle_timeout,
      on_timeout: values.on_timeout,
      network_egress_policy: values.egress_policy,
      egress_allowlist:
        values.egress_policy === "allowlist" ? parseEgressAllowlist(values.egress_allowlist) : [],
    },
  };
}
