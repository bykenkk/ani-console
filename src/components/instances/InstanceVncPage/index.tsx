import InstanceVnc from "@/components/instances/InstanceVnc";

export default function InstanceVncPage({ instanceId }: { instanceId: string }) {
  return (
    <main className="h-dvh min-h-0 w-screen overflow-hidden bg-[#0b0e16]">
      <InstanceVnc instanceId={instanceId} />
    </main>
  );
}
