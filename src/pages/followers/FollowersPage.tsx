import { useState, useEffect, useRef } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Tag, RefreshCw, Users } from "lucide-react";
import type { Follower, LineOA } from "@/types";
import { followerApi } from "@/api/follower";
import { lineOAApi } from "@/api/lineOA";
import { LineOAFilter } from "@/components/common/LineOAFilter";
import { getWorkspaceId } from "@/lib/auth";

const WORKSPACE_ID = getWorkspaceId() ?? "";
const PAGE_SIZE = 20;

type FollowStatus = "" | "following" | "unfollowed" | "blocked";

const STATUS_TABS: { value: FollowStatus; label: string }[] = [
  { value: "", label: "All" },
  { value: "following", label: "Following" },
  { value: "unfollowed", label: "Unfollowed" },
  { value: "blocked", label: "Blocked" },
];

const followStatusVariant = {
  following: "success" as const,
  unfollowed: "secondary" as const,
  blocked: "destructive" as const,
};

export function FollowersPage() {
  // ── Filter state ───────────────────────────────────────────────────────────
  const [lineOAs, setLineOAs] = useState<LineOA[]>([]);
  const [selectedLineOAId, setSelectedLineOAId] = useState<string>("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [followStatus, setFollowStatus] = useState<FollowStatus>("");
  const [tagFilter, setTagFilter] = useState("");
  const [debouncedTag, setDebouncedTag] = useState("");

  // ── Pagination + data state ────────────────────────────────────────────────
  const [followers, setFollowers] = useState<Follower[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [initialLoading, setInitialLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sentinel element for IntersectionObserver
  const sentinelRef = useRef<HTMLDivElement>(null);

  // ── Load LINE OAs once ─────────────────────────────────────────────────────
  useEffect(() => {
    lineOAApi.list({ workspace_id: WORKSPACE_ID })
      .then((res) => setLineOAs(res.data ?? []))
      .catch(console.error);
  }, []);

  // ── Debounce search (300 ms) ───────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  // ── Debounce tag filter (300 ms) ───────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => setDebouncedTag(tagFilter), 300);
    return () => clearTimeout(t);
  }, [tagFilter]);

  // ── Reset list when any filter changes ────────────────────────────────────
  useEffect(() => {
    setFollowers([]);
    setPage(1);
    setHasMore(true);
    setError(null);
  }, [selectedLineOAId, debouncedSearch, followStatus, debouncedTag]);

  // ── Fetch a page of followers ─────────────────────────────────────────────
  useEffect(() => {
    const isFirstPage = page === 1;
    if (isFirstPage) setInitialLoading(true);
    else setLoadingMore(true);

    followerApi.list({
      workspace_id: WORKSPACE_ID,
      line_oa_id: selectedLineOAId || undefined,
      search: debouncedSearch || undefined,
      follow_status: followStatus || undefined,
      tag: debouncedTag || undefined,
      page,
      page_size: PAGE_SIZE,
    })
      .then((res) => {
        const data = res.data ?? [];
        setTotal(res.total ?? 0);
        setFollowers((prev) => (isFirstPage ? data : [...prev, ...data]));
        setHasMore(data.length >= PAGE_SIZE);
        setError(null);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load followers");
        setHasMore(false);
      })
      .finally(() => {
        setInitialLoading(false);
        setLoadingMore(false);
      });
  }, [page, selectedLineOAId, debouncedSearch, followStatus, debouncedTag]);

  // ── Infinite scroll — trigger next page when sentinel is visible ──────────
  useEffect(() => {
    if (!hasMore || loadingMore || initialLoading) return;
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setPage((p) => p + 1);
      },
      { threshold: 0.1, rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, initialLoading]);

  const hasActiveFilter = debouncedSearch || followStatus || debouncedTag;

  return (
    <AppLayout title="Followers">
      <div className="space-y-4">
        {/* ── Description ── */}
        <p className="text-sm text-muted-foreground">
          Followers are automatically added when they follow your LINE OA or send a message.
        </p>

        {/* ── LINE OA Filter ── */}
        <LineOAFilter
          lineOAs={lineOAs}
          selectedId={selectedLineOAId}
          onChange={(id) => setSelectedLineOAId(id)}
          showAll={true}
        />

        {/* ── Search + Tag row ── */}
        <div className="flex flex-col sm:flex-row gap-2">
          {/* Text search */}
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, phone or email…"
              className="w-full pl-8 pr-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          {/* Tag filter */}
          <div className="relative sm:w-52">
            <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
              placeholder="Filter by tag…"
              className="w-full pl-8 pr-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* ── Status tabs ── */}
        <div className="flex gap-1 border-b">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFollowStatus(tab.value)}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                followStatus === tab.value
                  ? "border-green-500 text-green-700"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
          {/* Total count */}
          {!initialLoading && (
            <span className="ml-auto self-center pr-1 text-xs text-muted-foreground">
              {total.toLocaleString()} follower{total !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* ── Error ── */}
        {error && (
          <Card className="border-destructive">
            <CardContent className="text-center py-8">
              <p className="font-medium text-destructive">Error loading followers</p>
              <p className="text-sm text-muted-foreground mt-1">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* ── Initial loading spinner ── */}
        {initialLoading && (
          <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
            <RefreshCw size={16} className="animate-spin" />
            Loading followers…
          </div>
        )}

        {/* ── Empty state ── */}
        {!initialLoading && !error && followers.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Users size={32} className="mx-auto mb-3 text-muted-foreground/40" />
              <p className="font-medium">
                {hasActiveFilter ? "No followers match your filter" : "No followers yet"}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {hasActiveFilter
                  ? "Try adjusting the search or filter."
                  : "Followers appear here when they follow your LINE OA."}
              </p>
            </CardContent>
          </Card>
        )}

        {/* ── Follower list ── */}
        {!initialLoading && followers.length > 0 && (
          <div className="grid gap-2">
            {followers.map((follower) => (
              <FollowerCard key={follower.id} follower={follower} />
            ))}
          </div>
        )}

        {/* ── Load-more sentinel + spinner ── */}
        <div ref={sentinelRef} className="h-1" />
        {loadingMore && (
          <div className="flex items-center justify-center py-6 text-muted-foreground gap-2">
            <RefreshCw size={14} className="animate-spin" />
            <span className="text-sm">Loading more…</span>
          </div>
        )}
        {!hasMore && followers.length > 0 && !loadingMore && (
          <p className="text-center text-xs text-muted-foreground py-4">
            All {total.toLocaleString()} followers loaded
          </p>
        )}
      </div>
    </AppLayout>
  );
}

// ── FollowerCard ──────────────────────────────────────────────────────────────

function FollowerCard({ follower }: { follower: Follower }) {
  return (
    <Card
      className="cursor-pointer hover:bg-muted/50 transition-colors"
      onClick={() => { window.location.href = `/followers/${follower.id}`; }}
    >
      <CardContent className="flex items-center gap-4 p-4">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-gray-100 flex-shrink-0 overflow-hidden">
          {follower.picture_url ? (
            <img
              src={follower.picture_url}
              alt={follower.display_name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 font-semibold text-sm">
              {follower.display_name?.[0]?.toUpperCase() || "?"}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          {/* Row 1: name + status badge */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium truncate">
              {follower.display_name || follower.line_user_id}
            </span>
            <Badge variant={followStatusVariant[follower.follow_status]}>
              {follower.follow_status}
            </Badge>
            {follower.language && (
              <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                {follower.language}
              </span>
            )}
          </div>

          {/* Row 2: phone / email / note if set */}
          {(follower.phone || follower.email) && (
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              {[follower.phone, follower.email].filter(Boolean).join(" · ")}
            </p>
          )}

          {/* Row 3: status message */}
          {follower.status_message && (
            <p className="text-xs text-muted-foreground mt-0.5 truncate italic">
              "{follower.status_message}"
            </p>
          )}

          {/* Row 4: tags */}
          {follower.tags?.length > 0 && (
            <div className="flex gap-1 mt-1.5 flex-wrap">
              {follower.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Row 5: custom fields */}
          {follower.custom_fields && Object.keys(follower.custom_fields).length > 0 && (
            <div className="flex gap-1 mt-1 flex-wrap">
              {Object.entries(follower.custom_fields).map(([k, v]) => (
                <span
                  key={k}
                  className="text-xs text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded font-mono"
                >
                  {k}: {v}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Followed date — desktop only */}
        <div className="hidden sm:block text-xs text-muted-foreground flex-shrink-0 text-right">
          {follower.followed_at
            ? new Date(follower.followed_at).toLocaleDateString()
            : "—"}
        </div>
      </CardContent>
    </Card>
  );
}
