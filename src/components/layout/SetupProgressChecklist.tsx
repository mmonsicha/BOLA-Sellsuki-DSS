import { useState, useEffect, useCallback } from "react";
import { CheckCircle2, Circle, ChevronDown, ChevronUp, ArrowRight } from "lucide-react";
import { api } from "@/api/client";

// ─── localStorage keys ───────────────────────────────────────────────────────
const CACHE_KEY = "bola_setup_progress";
const COLLAPSED_KEY = "bola_setup_collapsed";
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const COMPLETE_HIDE_MS = 3 * 24 * 60 * 60 * 1000; // 3 days

interface CacheData {
  steps: boolean[];
  checkedAt: number;
  completedAt?: number;
}

const STEPS = [
  { label: "Connect LINE OA", href: "/line-oa" },
  { label: "Upload Rich Menu", href: "/rich-menus" },
  { label: "Import Followers", href: "/followers" },
  { label: "Send First Broadcast", href: "/broadcasts" },
  { label: "Enable Auto-Reply", href: "/auto-reply" },
];

async function checkSetupProgress(workspaceId: string): Promise<boolean[]> {
  // Step 1: LINE OA
  const oaRes = await api.get<{ data: { id: string }[] }>("/v1/line-oas", {
    workspace_id: workspaceId,
    page_size: 1,
  }).catch(() => null);
  const hasOA = (oaRes?.data?.length ?? 0) > 0;
  const firstOAId = oaRes?.data?.[0]?.id ?? null;

  // Step 2: Rich Menu (requires a LINE OA ID)
  let hasRichMenu = false;
  if (hasOA && firstOAId) {
    const rmRes = await api.get<{ data: unknown[] }>("/v1/rich-menus", {
      line_oa_id: firstOAId,
      page_size: 1,
    }).catch(() => null);
    hasRichMenu = (rmRes?.data?.length ?? 0) > 0;
  }

  // Step 3: Followers
  const followerRes = await api.get<{ data: unknown[]; total?: number }>("/v1/followers", {
    workspace_id: workspaceId,
    page_size: 1,
  }).catch(() => null);
  const hasFollowers = (followerRes?.data?.length ?? 0) > 0;

  // Step 4: Broadcasts (any status)
  const broadcastRes = await api.get<{ data: unknown[]; total?: number }>("/v1/broadcasts", {
    workspace_id: workspaceId,
    page_size: 1,
  }).catch(() => null);
  const hasBroadcasts = (broadcastRes?.data?.length ?? 0) > 0;

  // Step 5: Auto-replies (requires a LINE OA ID)
  let hasAutoReply = false;
  if (hasOA && firstOAId) {
    const arRes = await api.get<{ data: unknown[] }>("/v1/auto-replies", {
      line_oa_id: firstOAId,
      page_size: 1,
    }).catch(() => null);
    hasAutoReply = (arRes?.data?.length ?? 0) > 0;
  }

  return [hasOA, hasRichMenu, hasFollowers, hasBroadcasts, hasAutoReply];
}

function loadCache(): CacheData | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CacheData;
  } catch {
    return null;
  }
}

function saveCache(data: CacheData) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {
    // ignore storage errors
  }
}

export function SetupProgressChecklist({ collapsed: sidebarCollapsed }: { collapsed: boolean }) {
  const [steps, setSteps] = useState<boolean[]>([false, false, false, false, false]);
  const [loading, setLoading] = useState(true);
  const [widgetCollapsed, setWidgetCollapsed] = useState(() => {
    return localStorage.getItem(COLLAPSED_KEY) === "true";
  });
  const [hidden, setHidden] = useState(false);

  const refresh = useCallback(async (force = false) => {
    const workspaceId = localStorage.getItem("bola_workspace");
    if (!workspaceId) {
      setLoading(false);
      return;
    }

    const cached = loadCache();
    const now = Date.now();

    // Check if we should hide permanently (completed >3 days ago)
    if (cached?.completedAt && now - cached.completedAt > COMPLETE_HIDE_MS) {
      setHidden(true);
      setLoading(false);
      return;
    }

    // Use cached data if fresh
    if (!force && cached && now - cached.checkedAt < CACHE_TTL_MS) {
      setSteps(cached.steps);
      setLoading(false);
      return;
    }

    // Fetch fresh data
    try {
      const result = await checkSetupProgress(workspaceId);
      const allDone = result.every(Boolean);
      const completedAt = allDone ? (cached?.completedAt ?? now) : undefined;
      const newCache: CacheData = { steps: result, checkedAt: now, completedAt };
      saveCache(newCache);
      setSteps(result);
      if (completedAt && now - completedAt > COMPLETE_HIDE_MS) {
        setHidden(true);
      }
    } catch {
      // silently fail — don't show errors for this widget
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const toggleCollapsed = () => {
    const next = !widgetCollapsed;
    setWidgetCollapsed(next);
    localStorage.setItem(COLLAPSED_KEY, String(next));
  };

  if (hidden || loading || sidebarCollapsed) return null;

  const doneCount = steps.filter(Boolean).length;
  const allDone = doneCount === 5;
  const nextStepIdx = steps.findIndex((s) => !s);
  const progressPct = (doneCount / 5) * 100;

  // After 5/5, still show briefly then hide (handled via completedAt)
  return (
    <div className="mx-2 mb-2 rounded-lg bg-gray-800 border border-gray-700 text-xs overflow-hidden">
      {/* Header */}
      <button
        onClick={toggleCollapsed}
        className="w-full flex items-center justify-between px-3 py-2 hover:bg-gray-700 transition-colors"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-semibold text-gray-200 truncate">
            {allDone ? "Setup Complete 🎉" : "Setup Checklist"}
          </span>
          <span className={`font-bold ${allDone ? "text-green-400" : "text-gray-400"}`}>
            {doneCount}/5
          </span>
        </div>
        {widgetCollapsed ? (
          <ChevronDown size={14} className="text-gray-400 flex-shrink-0" />
        ) : (
          <ChevronUp size={14} className="text-gray-400 flex-shrink-0" />
        )}
      </button>

      {/* Progress bar */}
      {!widgetCollapsed && (
        <div className="px-3 pb-1">
          <div className="h-1 rounded-full bg-gray-700 overflow-hidden">
            <div
              className="h-full rounded-full bg-green-500 transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}

      {/* Steps */}
      {!widgetCollapsed && (
        <ul className="px-3 pb-3 space-y-1.5 mt-1">
          {STEPS.map((step, idx) => {
            const done = steps[idx];
            const isNext = idx === nextStepIdx;

            return (
              <li key={idx}>
                <a
                  href={step.href}
                  className={`flex items-center gap-2 rounded px-1 py-0.5 transition-colors ${
                    done
                      ? "text-gray-500 cursor-default pointer-events-none"
                      : isNext
                      ? "text-green-400 font-semibold hover:text-green-300"
                      : "text-gray-400 hover:text-gray-200"
                  }`}
                  onClick={done ? (e) => e.preventDefault() : undefined}
                >
                  {done ? (
                    <CheckCircle2 size={13} className="text-green-500 flex-shrink-0" />
                  ) : (
                    <Circle size={13} className="flex-shrink-0" />
                  )}
                  <span className="truncate">{step.label}</span>
                  {isNext && <ArrowRight size={12} className="ml-auto flex-shrink-0" />}
                </a>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
