import type {
  AIChatbotConfig,
  ChatSession,
  ChatMessage,
  KnowledgeBase,
  UnansweredQuestion,
  QuestionStatus,
  ApiResponse,
} from "@/types";

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
  async get(lineOAId: string): Promise<AIChatbotConfig> {
    const res = await fetch(`${BASE}/ai-chatbot/config?line_oa_id=${encodeURIComponent(lineOAId)}`);
    if (!res.ok) throw new Error(`Failed to fetch config: ${res.status}`);
    return res.json();
  },

  async upsert(data: UpsertConfigRequest): Promise<AIChatbotConfig> {
    const res = await fetch(`${BASE}/ai-chatbot/config`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.message || `Failed to save config: ${res.status}`);
    }
    return res.json();
  },

  async toggle(lineOAId: string, isEnabled: boolean): Promise<void> {
    const res = await fetch(`${BASE}/ai-chatbot/config/toggle?line_oa_id=${encodeURIComponent(lineOAId)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_enabled: isEnabled }),
    });
    if (!res.ok) throw new Error(`Failed to toggle config: ${res.status}`);
  },
};

// ---- Chat Sessions ----

export const chatSessionApi = {
  async list(workspaceId: string, page = 1, pageSize = 20): Promise<ApiResponse<ChatSession[]>> {
    const params = new URLSearchParams({
      workspace_id: workspaceId,
      page: String(page),
      page_size: String(pageSize),
    });
    const res = await fetch(`${BASE}/chat-sessions?${params}`);
    return res.json();
  },

  async get(id: string): Promise<ChatSession> {
    const res = await fetch(`${BASE}/chat-sessions/${id}`);
    if (!res.ok) throw new Error(`Failed to fetch session: ${res.status}`);
    return res.json();
  },

  async listMessages(id: string, page = 1, pageSize = 50): Promise<ApiResponse<ChatMessage[]>> {
    const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
    const res = await fetch(`${BASE}/chat-sessions/${id}/messages?${params}`);
    return res.json();
  },

  async handoff(id: string, adminId: string): Promise<void> {
    const res = await fetch(`${BASE}/chat-sessions/${id}/handoff`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ admin_id: adminId }),
    });
    if (!res.ok) throw new Error(`Failed to handoff: ${res.status}`);
  },

  async handback(id: string): Promise<void> {
    const res = await fetch(`${BASE}/chat-sessions/${id}/handback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) throw new Error(`Failed to handback: ${res.status}`);
  },

  async sendMessage(id: string, data: {
    content?: string;
    image_url?: string;
    image_preview_url?: string;
    admin_id?: string;
    workspace_id?: string;
    save_as_knowledge?: boolean;
    kb_title?: string;
  }): Promise<import("@/types").ChatMessage> {
    const res = await fetch(`${BASE}/chat-sessions/${id}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`Failed to send message: ${res.status}`);
    return res.json();
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
  async list(workspaceId: string, page = 1, pageSize = 20): Promise<ApiResponse<KnowledgeBase[]>> {
    const params = new URLSearchParams({
      workspace_id: workspaceId,
      page: String(page),
      page_size: String(pageSize),
    });
    const res = await fetch(`${BASE}/knowledge-base?${params}`);
    return res.json();
  },

  async get(id: string): Promise<KnowledgeBase> {
    const res = await fetch(`${BASE}/knowledge-base/${id}`);
    if (!res.ok) throw new Error(`Failed to fetch entry: ${res.status}`);
    return res.json();
  },

  async create(data: CreateKBRequest): Promise<KnowledgeBase> {
    const res = await fetch(`${BASE}/knowledge-base`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.message || `Failed to create entry: ${res.status}`);
    }
    return res.json();
  },

  async update(id: string, data: CreateKBRequest): Promise<KnowledgeBase> {
    const res = await fetch(`${BASE}/knowledge-base/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.message || `Failed to update entry: ${res.status}`);
    }
    return res.json();
  },

  async delete(id: string): Promise<void> {
    const res = await fetch(`${BASE}/knowledge-base/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error(`Failed to delete entry: ${res.status}`);
  },

  async search(workspaceId: string, query: string, topK = 5): Promise<ApiResponse<KnowledgeBase[]>> {
    const res = await fetch(`${BASE}/knowledge-base/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspace_id: workspaceId, query, top_k: topK }),
    });
    return res.json();
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
    const res = await fetch(`${BASE}/ai-chatbot/test-connection`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.message || `Server returned ${res.status}`);
    }
    const body = await res.json().catch(() => ({}));
    return { ok: true, message: body.message || "Connection successful ✓" };
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : "Connection failed" };
  }
}

// ---- Unanswered Questions ----

export const unansweredQuestionApi = {
  async list(workspaceId: string, status?: QuestionStatus, page = 1, pageSize = 20): Promise<ApiResponse<UnansweredQuestion[]>> {
    const params = new URLSearchParams({
      workspace_id: workspaceId,
      page: String(page),
      page_size: String(pageSize),
    });
    if (status) params.set("status", status);
    const res = await fetch(`${BASE}/unanswered-questions?${params}`);
    return res.json();
  },

  async get(id: string): Promise<UnansweredQuestion> {
    const res = await fetch(`${BASE}/unanswered-questions/${id}`);
    if (!res.ok) throw new Error(`Failed to fetch question: ${res.status}`);
    return res.json();
  },

  async resolve(id: string, data: { title: string; answer: string; workspace_id: string; admin_id?: string }): Promise<void> {
    const res = await fetch(`${BASE}/unanswered-questions/${id}/resolve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`Failed to resolve question: ${res.status}`);
  },

  async dismiss(id: string, adminId = ""): Promise<void> {
    const res = await fetch(`${BASE}/unanswered-questions/${id}/dismiss`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ admin_id: adminId }),
    });
    if (!res.ok) throw new Error(`Failed to dismiss question: ${res.status}`);
  },
};
