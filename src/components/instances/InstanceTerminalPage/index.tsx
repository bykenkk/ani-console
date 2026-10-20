import InstanceTerminal from "@/components/instances/InstanceTerminal";

type InstanceTerminalPageProps = { instanceId: string };

export default function InstanceTerminalPage({ instanceId }: InstanceTerminalPageProps) {
  return (
    <main className="h-dvh min-h-0 w-screen overflow-hidden bg-app-bg p-4 box-border">
      <InstanceTerminal className="h-full" instanceId={instanceId} />
    </main>
  );
}
