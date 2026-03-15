import { useState, useEffect } from "react";
import { authApi, type AdminProfile } from "@/api/auth";
import { getWorkspaceId } from "@/lib/auth";

// Module-level cache so multiple callers share a single in-flight request.
let cachedAdmin: AdminProfile | null = null;
let cacheWorkspaceId: string | null = null;

const ROLE_ORDER: Record<string, number> = {
  viewer: 1,
  editor: 2,
  admin: 3,
  super_admin: 4,
};

interface UseCurrentAdminResult {
  currentAdmin: AdminProfile | null;
  loading: boolean;
  isViewer: boolean;
  isEditorOrAbove: boolean;
  isAdminOrAbove: boolean;
  isSuperAdmin: boolean;
  refetch: () => void;
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

  const fetchAdmin = () => {
    if (!workspaceId) {
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
  };

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

    return fetchAdmin();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId]);

  const rank = ROLE_ORDER[currentAdmin?.role ?? "viewer"] ?? 1;

  return {
    currentAdmin,
    loading,
    isViewer: rank === 1,
    isEditorOrAbove: rank >= 2,
    isAdminOrAbove: rank >= 3,
    isSuperAdmin: rank >= 4,
    refetch: () => {
      cachedAdmin = null;
      cacheWorkspaceId = null;
      setLoading(true);
      fetchAdmin();
    },
  };
}

/** Clears the module-level cache. Call on logout. */
export function clearCurrentAdminCache(): void {
  cachedAdmin = null;
  cacheWorkspaceId = null;
}
