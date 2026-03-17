import type {
  AIChatbotConfig,
  ChatSession,
  ChatMessage,
  KnowledgeBase,
  UnansweredQuestion,
  QuestionStatus,
  ApiResponse,
} from "@/types";
import { api } from "./client";

const BASE = "/v1";

// ---- Config ----

export interface UpsertConfigRequest {
  workspace_id: string;
  line_oa_id: string;
  is_enabled: boolean;
  enable_group_chat: boolean;
  group_chat_trigger_prefix: string;
  llm_provider: string;
  llm_model: string;
  llm_api_key?: string;
  llm_api_base_url: string;
  llm_temperature: number;
  system_prompt: string;
  confidence_threshold: number;
  max_context_turns: number;
  fallback_message: string;
}

export const aiChatbotConfigApi = {
  get(lineOAId: string): Promise<AIChatbotConfig> {
    return api.get(`${BASE}/ai-chatbot/config`, { line_oa_id: lineOAId });
  },

  upsert(data: UpsertConfigRequest): Promise<AIChatbotConfig> {
    return api.post(`${BASE}/ai-chatbot/config`, data);
  },

  toggle(lineOAId: string, isEnabled: boolean): Promise<void> {
    return api.post(`${BASE}/ai-chatbot/config/toggle`, { is_enabled: isEnabled, line_oa_id: lineOAId });
  },
};

// ---- Chat Sessions ----

export const chatSessionApi = {
  list(workspaceId: string, page = 1, pageSize = 20): Promise<ApiResponse<ChatSession[]>> {
    return api.get(`${BASE}/chat-sessions`, { workspace_id: workspaceId, page, page_size: pageSize });
  },

  get(id: string): Promise<ChatSession> {
    return api.get(`${BASE}/chat-sessions/${id}`);
  },

  listMessages(id: string, page = 1, pageSize = 50): Promise<ApiResponse<ChatMessage[]>> {
    return api.get(`${BASE}/chat-sessions/${id}/messages`, { page, page_size: pageSize });
  },

  handoff(id: string, adminId: string): Promise<void> {
    return api.post(`${BASE}/chat-sessions/${id}/handoff`, { admin_id: adminId });
  },

  handback(id: string): Promise<void> {
    return api.post(`${BASE}/chat-sessions/${id}/handback`, {});
  },

  sendMessage(id: string, data: {
    content?: string;
    image_url?: string;
    image_preview_url?: string;
    admin_id?: string;
    workspace_id?: string;
    save_as_knowledge?: boolean;
    kb_title?: string;
  }): Promise<import("@/types").ChatMessage> {
    return api.post(`${BASE}/chat-sessions/${id}/messages`, data);
  },
};

// ---- Knowledge Base ----

export interface CreateKBRequest {
  workspace_id: string;
  title: string;
  content: string;
  source_type?: string;
  tags?: string[];
  created_by_admin_id?: string;
}

export const knowledgeBaseApi = {
  list(workspaceId: string, page = 1, pageSize = 20): Promise<ApiResponse<KnowledgeBase[]>> {
    return api.get(`${BASE}/knowledge-base`, { workspace_id: workspaceId, page, page_size: pageSize });
  },

  get(id: string): Promise<KnowledgeBase> {
    return api.get(`${BASE}/knowledge-base/${id}`);
  },

  create(data: CreateKBRequest): Promise<KnowledgeBase> {
    return api.post(`${BASE}/knowledge-base`, data);
  },

  update(id: string, data: CreateKBRequest): Promise<KnowledgeBase> {
    return api.put(`${BASE}/knowledge-base/${id}`, data);
  },

  delete(id: string): Promise<void> {
    return api.delete(`${BASE}/knowledge-base/${id}`);
  },

  search(workspaceId: string, query: string, topK = 5): Promise<ApiResponse<KnowledgeBase[]>> {
    return api.post(`${BASE}/knowledge-base/search`, { workspace_id: workspaceId, query, top_k: topK });
  },
};

// ---- Test LLM Connection ----

export interface TestLLMConnectionParams {
  workspace_id: string;
  llm_provider?: string;
  llm_model?: string;
  llm_api_key?: string;
  llm_api_base_url?: string;
}

export async function testLLMConnection(
  params: TestLLMConnectionParams
): Promise<{ ok: boolean; message: string }> {
  try {
    const body = await api.post<{ message?: string }>(`${BASE}/ai-chatbot/test-connection`, params);
    return { ok: true, message: body?.message || "Connection successful ✓" };
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : "Connection failed" };
  }
}

// ---- Unanswered Questions ----

export const unansweredQuestionApi = {
  list(workspaceId: string, status?: QuestionStatus, page = 1, pageSize = 20): Promise<ApiResponse<UnansweredQuestion[]>> {
    const params: Record<string, string | number> = { workspace_id: workspaceId, page, page_size: pageSize };
    if (status) params["status"] = status;
    return api.get(`${BASE}/unanswered-questions`, params);
  },

  get(id: string): Promise<UnansweredQuestion> {
    return api.get(`${BASE}/unanswered-questions/${id}`);
  },

  resolve(id: string, data: { title: string; answer: string; workspace_id: string; admin_id?: string }): Promise<void> {
    return api.post(`${BASE}/unanswered-questions/${id}/resolve`, data);
  },

  dismiss(id: string, adminId = ""): Promise<void> {
    return api.post(`${BASE}/unanswered-questions/${id}/dismiss`, { admin_id: adminId });
  },
};
