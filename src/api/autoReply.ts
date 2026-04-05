import { api } from "./client";
import type { AutoReply, TriggerType, MatchMode, AutoReplyConditionType, AutoReplyTriggerConfig } from "@/types";

export const autoReplyApi = {
  list: (params: { line_oa_id: string; page?: number; page_size?: number }) =>
    api.get<{ data: AutoReply[] }>("/v1/auto-replies", params),

  get: (id: string) =>
    api.get<AutoReply>(`/v1/auto-replies/${id}`),

  create: (body: {
    workspace_id: string;
    line_oa_id: string;
    name: string;
    is_enabled?: boolean;
    priority?: number;
    trigger: TriggerType;
    keywords?: string[];
    match_mode?: MatchMode;
    postback_data?: string;
    condition_type?: AutoReplyConditionType;
    trigger_config?: AutoReplyTriggerConfig;
    quick_reply_id?: string;
    messages: Array<{ type: string; payload: unknown }>;
  }) => api.post<AutoReply>("/v1/auto-replies", body),

  update: (id: string, body: Partial<{
    name: string;
    is_enabled: boolean;
    priority: number;
    keywords: string[];
    match_mode: MatchMode;
    postback_data: string;
    condition_type: AutoReplyConditionType;
    trigger_config: AutoReplyTriggerConfig;
    quick_reply_id: string;
    messages: Array<{ type: string; payload: unknown }>;
  }>) => api.put<AutoReply>(`/v1/auto-replies/${id}`, body),

  delete: (id: string) =>
    api.delete<void>(`/v1/auto-replies/${id}`),
};
