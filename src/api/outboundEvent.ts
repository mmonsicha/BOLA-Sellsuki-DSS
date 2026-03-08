import { api } from "./client";
import type { OutboundDeliveryLog } from "@/types";

export const outboundEventApi = {
  listLogs: (params: { workspace_id: string; page?: number; page_size?: number }) =>
    api.get<{ data: OutboundDeliveryLog[] }>("/v1/outbound-events/logs", params),
};
