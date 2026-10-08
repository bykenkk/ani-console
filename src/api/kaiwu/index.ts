import { servicesRequest } from "@/api/request";
import type { KaiwuEntry } from "./types";

export function getKaiwuConsoleEntry(signal?: AbortSignal): Promise<KaiwuEntry> {
  return servicesRequest<KaiwuEntry>("/integrations/kaiwu/console/entry", {
    method: "GET",
    signal,
  });
}
