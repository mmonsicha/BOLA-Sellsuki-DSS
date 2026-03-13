import { useState, useEffect } from "react";
import { authApi, type AdminProfile } from "@/api/auth";
import { getWorkspaceId } from "@/lib/auth";

// Module-level cache so multiple callers share a single in-flight request.
let cachedAdmin: AdminProfile | null = null;
let cacheWorkspaceId: string | null = null;

interface UseCurrentAdminResult {
  currentAdmin: AdminProfile | null;
  loading: boolean;
}

/**
 * useCurrentAdmin fetches and caches the authenticated admin's profile.
 * The result is cached at module level — subsequent hook instances in the
 * same session reuse the cached value without firing a new request.
 */
export function useCurrentAdmin(): UseCurrentAdminResult {
  const workspaceId = getWorkspaceId() ?? "";

  const [currentAdmin, setCurrentAdmin] = useState<AdminProfile | null>(
    cachedAdmin && cacheWorkspaceId === workspaceId ? cachedAdmin : null
  );
  const [loading, setLoading] = useState<boolean>(
    !(cachedAdmin && cacheWorkspaceId === workspaceId)
  );

  useEffect(() => {
    if (!workspaceId) {
      setLoading(false);
      return;
    }

    // Return cached value immediately if available for this workspace.
    if (cachedAdmin && cacheWorkspaceId === workspaceId) {
      setCurrentAdmin(cachedAdmin);
      setLoading(false);
      return;
    }

    let cancelled = false;
    authApi.getCurrentAdmin(workspaceId)
      .then((admin) => {
        if (cancelled) return;
        cachedAdmin = admin;
        cacheWorkspaceId = workspaceId;
        setCurrentAdmin(admin);
      })
      .catch(() => {
        // Silently swallow — the admin may not be authenticated yet,
        // or the endpoint may not be available (e.g. older backend).
        if (!cancelled) setCurrentAdmin(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [workspaceId]);

  return { currentAdmin, loading };
}

/** Clears the module-level cache. Call on logout. */
export function clearCurrentAdminCache(): void {
  cachedAdmin = null;
  cacheWorkspaceId = null;
}
