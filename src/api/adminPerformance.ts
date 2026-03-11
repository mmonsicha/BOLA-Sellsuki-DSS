import { api } from "./client";

const WORKSPACE_ID = "00000000-0000-0000-0000-000000000001";

// ---- Interfaces ----

export interface AdminPerformanceSummary {
  admin_id: string;
  admin_name?: string;
  total_sessions: number;
  avg_first_response_ms: number;
  avg_response_ms: number;
  total_messages: number;
  knowledge_saved: number;
  escalation_count: number;
}

export interface AdminLeaderboardEntry {
  rank: number;
  admin_id: string;
  admin_name: string;
  total_sessions: number;
  avg_first_response_ms: number;
  knowledge_saved: number;
}

export interface AdminTeamStats {
  total_sessions: number;
  avg_first_response_ms: number;
  busiest_hour: number; // 0–23
  unassigned_wait_ms: number;
}

export interface AdminPerformanceLog {
  id: string;
  session_id: string;
  follower_id: string;
  first_response_time_ms: number;
  avg_response_time_ms: number;
  total_admin_messages: number;
  total_user_messages: number;
  session_duration_ms: number;
  knowledge_saved_count: number;
  closed_at: string;
}

export interface ReplyTemplate {
  id: string;
  workspace_id: string;
  title: string;
  content: string;
  tags: string[];
  use_count: number;
  created_by_admin_id: string;
  created_at: string;
}

// ---- Admin Performance API ----

export const adminPerformanceApi = {
  getSummary(period: string, adminId?: string): Promise<AdminPerformanceSummary> {
    const params: Record<string, string> = { period };
    if (adminId) params.admin_id = adminId;
    return api.get<AdminPerformanceSummary>("/v1/admin-performance/summary", params);
  },

  getLeaderboard(period: string): Promise<AdminLeaderboardEntry[]> {
    return api.get<AdminLeaderboardEntry[]>("/v1/admin-performance/leaderboard", { period });
  },

  getTeamStats(period: string): Promise<AdminTeamStats> {
    return api.get<AdminTeamStats>("/v1/admin-performance/team", { period });
  },

  listSessions(
    adminId: string,
    page = 1
  ): Promise<{ data: AdminPerformanceLog[]; total: number }> {
    return api.get<{ data: AdminPerformanceLog[]; total: number }>(
      "/v1/admin-performance/sessions",
      { admin_id: adminId, page, page_size: 20 }
    );
  },
};

// ---- Reply Template API ----

export const replyTemplateApi = {
  list(): Promise<ReplyTemplate[]> {
    return api
      .get<{ data: ReplyTemplate[] } | ReplyTemplate[]>("/v1/reply-templates", {
        workspace_id: WORKSPACE_ID,
      })
      .then((res) => (Array.isArray(res) ? res : (res as { data: ReplyTemplate[] }).data ?? []));
  },

  search(q: string): Promise<ReplyTemplate[]> {
    return api
      .get<{ data: ReplyTemplate[] } | ReplyTemplate[]>("/v1/reply-templates/search", {
        q,
        workspace_id: WORKSPACE_ID,
      })
      .then((res) => (Array.isArray(res) ? res : (res as { data: ReplyTemplate[] }).data ?? []))
      .catch(() => []);
  },

  create(title: string, content: string, tags: string[]): Promise<ReplyTemplate> {
    return api.post<ReplyTemplate>("/v1/reply-templates", {
      workspace_id: WORKSPACE_ID,
      title,
      content,
      tags,
    });
  },

  update(id: string, title: string, content: string, tags: string[]): Promise<void> {
    return api.put<void>(`/v1/reply-templates/${id}`, { title, content, tags });
  },

  delete(id: string): Promise<void> {
    return api.delete<void>(`/v1/reply-templates/${id}`);
  },

  use(id: string): Promise<void> {
    return api.post<void>(`/v1/reply-templates/${id}/use`);
  },
};
