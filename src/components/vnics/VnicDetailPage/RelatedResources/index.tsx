import type { NetworkVnicBinding } from "@/api/network";
import AssociatedInstances from "./AssociatedInstances";

type RelatedResourcesProps = { bindings: NetworkVnicBinding[] };

export default function RelatedResources({ bindings }: RelatedResourcesProps) {
  return (
    <section className="flex flex-col gap-6">
      <AssociatedInstances bindings={bindings} />
    </section>
  );
}
