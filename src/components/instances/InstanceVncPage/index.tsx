import InstanceVnc from "@/components/instances/InstanceVnc";
import { createVmConsoleSession } from "@/api/vms";

type InstanceVncPageProps = { instanceId: string; kind?: "vm" };

async function createVmSession(id: string, signal: AbortSignal) {
  const session = await createVmConsoleSession(id, signal);
  return { connect_url: session.wsUrl, expires_at: session.expiresAt };
}

export default function InstanceVncPage({ instanceId, kind }: InstanceVncPageProps) {
  return (
    <main className="h-dvh min-h-0 w-screen overflow-hidden bg-[#0b0e16]">
      <InstanceVnc
        instanceId={instanceId}
        createSession={kind === "vm" ? createVmSession : undefined}
      />
    </main>
  );
}
