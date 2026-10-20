import { DEFAULT_CPU_INSTANCE_COMPUTE_SPEC } from "@/lib/instances";
import type { SandboxCreateFormValues } from ".";

export const INITIAL_VALUES: SandboxCreateFormValues = {
  name: "",
  template_id: "",
  compute_spec: DEFAULT_CPU_INSTANCE_COMPUTE_SPEC,
  session_timeout: "120m",
  idle_timeout: "30m",
  on_timeout: "pause",
  egress_policy: "allowlist",
  egress_allowlist: "pypi.org\ngithub.com\nregistry.npmjs.org",
  auto_start: true,
};

export const SESSION_TIMEOUT_OPTIONS = ["30m", "45m", "60m", "90m", "120m", "240m"];

export const IDLE_TIMEOUT_OPTIONS = ["5m", "10m", "15m", "30m", "60m"];
