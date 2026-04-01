import { useState, useEffect, useRef } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Tag, RefreshCw, Users, Upload, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Follower, LineOA, UnifiedContact } from "@/types";
import { followerApi } from "@/api/follower";
import { lineOAApi } from "@/api/lineOA";
import { LineOAFilter } from "@/components/common/LineOAFilter";
import { CsvImportWizard } from "@/components/contacts/CsvImportWizard";
import { getWorkspaceId } from "@/lib/auth";

const WORKSPACE_ID = getWorkspaceId() ?? "";
const PAGE_SIZE = 20;

type FollowStatus = "" | "following" | "unfollowed" | "blocked";
type ActiveTab = "followers" | "phone_contacts";

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

const sourceVariant: Record<string, "outline" | "secondary" | "default"> = {
  csv: "outline",
  webhook: "secondary",
  manual: "default",
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

  // ── Tab state ──────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<ActiveTab>("followers");

  // ── Import state ───────────────────────────────────────────────────────────
  const [importOpen, setImportOpen] = useState(false);

  // ── Pagination + data state (followers) ────────────────────────────────────
  const [followers, setFollowers] = useState<Follower[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [initialLoading, setInitialLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Phone contacts state ───────────────────────────────────────────────────
  const [phoneContacts, setPhoneContacts] = useState<UnifiedContact[]>([]);
  const [phoneTotal, setPhoneTotal] = useState(0);
  const [phoneHasMore, setPhoneHasMore] = useState(true);
  const [phoneInitialLoading, setPhoneInitialLoading] = useState(false);
  const [phoneLoadingMore, setPhoneLoadingMore] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  // Sentinel elements for IntersectionObserver
  const sentinelRef = useRef<HTMLDivElement>(null);
  const phoneSentinelRef = useRef<HTMLDivElement>(null);

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

  // ── Reset follower list when any filter changes ────────────────────────────
  useEffect(() => {
    setFollowers([]);
    setPage(1);
    setHasMore(true);
    setError(null);
  }, [selectedLineOAId, debouncedSearch, followStatus, debouncedTag]);

  // ── Reset phone contact list when filter changes ───────────────────────────
  useEffect(() => {
    setPhoneContacts([]);
    setPhoneTotal(0);
    setPhoneHasMore(true);
    setPhoneError(null);
    // Reset page is handled via a separate page state — use a single phonePage state
  }, [selectedLineOAId, debouncedSearch]);

  // ── Fetch a page of followers ─────────────────────────────────────────────
  useEffect(() => {
    if (activeTab !== "followers") return;

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
  }, [page, selectedLineOAId, debouncedSearch, followStatus, debouncedTag, activeTab]);

  // ── Phone contacts page state ──────────────────────────────────────────────
  const [phonePage, setPhonePage] = useState(1);

  // Reset phone page when filters change
  useEffect(() => {
    setPhonePage(1);
    setPhoneContacts([]);
    setPhoneHasMore(true);
  }, [selectedLineOAId, debouncedSearch]);

  // ── Fetch a page of phone contacts ────────────────────────────────────────
  useEffect(() => {
    if (activeTab !== "phone_contacts") return;

    const isFirstPage = phonePage === 1;
    if (isFirstPage) setPhoneInitialLoading(true);
    else setPhoneLoadingMore(true);

    followerApi.listUnified({
      workspace_id: WORKSPACE_ID,
      line_oa_id: selectedLineOAId || undefined,
      contact_status: "phone_only",
      search: debouncedSearch || undefined,
      page: phonePage,
      page_size: PAGE_SIZE,
    })
      .then((res) => {
        const data = res.data ?? [];
        setPhoneTotal(res.total ?? 0);
        setPhoneContacts((prev) => (isFirstPage ? data : [...prev, ...data]));
        setPhoneHasMore(data.length >= PAGE_SIZE);
        setPhoneError(null);
      })
      .catch((err) => {
        setPhoneError(err instanceof Error ? err.message : "Failed to load phone contacts");
        setPhoneHasMore(false);
      })
      .finally(() => {
        setPhoneInitialLoading(false);
        setPhoneLoadingMore(false);
      });
  }, [phonePage, selectedLineOAId, debouncedSearch, activeTab]);

  // ── Infinite scroll for followers ─────────────────────────────────────────
  useEffect(() => {
    if (activeTab !== "followers") return;
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
  }, [hasMore, loadingMore, initialLoading, activeTab]);

  // ── Infinite scroll for phone contacts ────────────────────────────────────
  useEffect(() => {
    if (activeTab !== "phone_contacts") return;
    if (!phoneHasMore || phoneLoadingMore || phoneInitialLoading) return;
    const el = phoneSentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setPhonePage((p) => p + 1);
      },
      { threshold: 0.1, rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [phoneHasMore, phoneLoadingMore, phoneInitialLoading, activeTab]);

  // ── Handle tab switch ──────────────────────────────────────────────────────
  function handleTabSwitch(tab: ActiveTab) {
    setActiveTab(tab);
    if (tab === "phone_contacts") {
      // Trigger a fresh load of phone contacts when switching to that tab
      setPhoneContacts([]);
      setPhonePage(1);
      setPhoneHasMore(true);
    } else {
      // Trigger a fresh load of followers when switching back
      setFollowers([]);
      setPage(1);
      setHasMore(true);
    }
  }

  // ── Handle import complete ─────────────────────────────────────────────────
  function handleImportClose() {
    setImportOpen(false);
    // Refresh the current view
    if (activeTab === "followers") {
      setFollowers([]);
      setPage(1);
      setHasMore(true);
    } else {
      setPhoneContacts([]);
      setPhonePage(1);
      setPhoneHasMore(true);
    }
  }

  const hasActiveFilter = debouncedSearch || followStatus || debouncedTag;

  return (
    <AppLayout title="Followers">
      <div className="space-y-4">
        {/* ── Description + Import button ── */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Followers are automatically added when they follow your LINE OA or send a message.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="flex-shrink-0 flex items-center gap-1.5"
            onClick={() => setImportOpen(true)}
          >
            <Upload size={14} />
            Import Contacts
          </Button>
        </div>

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

          {/* Tag filter — only shown on followers tab */}
          {activeTab === "followers" && (
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
          )}
        </div>

        {/* ── Top-level tab: Followers vs Phone Contacts ── */}
        <div className="flex gap-1 border-b">
          <button
            onClick={() => handleTabSwitch("followers")}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors flex items-center gap-1.5",
              activeTab === "followers"
                ? "border-green-500 text-green-700"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <Users size={13} />
            Followers
          </button>
          <button
            onClick={() => handleTabSwitch("phone_contacts")}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors flex items-center gap-1.5",
              activeTab === "phone_contacts"
                ? "border-green-500 text-green-700"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <Phone size={13} />
            Phone Contacts
          </button>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* ── FOLLOWERS TAB ── */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === "followers" && (
          <>
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
          </>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* ── PHONE CONTACTS TAB ── */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === "phone_contacts" && (
          <>
            {/* Count */}
            {!phoneInitialLoading && (
              <div className="text-xs text-muted-foreground text-right pr-1">
                {phoneTotal.toLocaleString()} contact{phoneTotal !== 1 ? "s" : ""}
              </div>
            )}

            {/* ── Error ── */}
            {phoneError && (
              <Card className="border-destructive">
                <CardContent className="text-center py-8">
                  <p className="font-medium text-destructive">Error loading phone contacts</p>
                  <p className="text-sm text-muted-foreground mt-1">{phoneError}</p>
                </CardContent>
              </Card>
            )}

            {/* ── Initial loading spinner ── */}
            {phoneInitialLoading && (
              <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
                <RefreshCw size={16} className="animate-spin" />
                Loading phone contacts…
              </div>
            )}

            {/* ── Empty state ── */}
            {!phoneInitialLoading && !phoneError && phoneContacts.length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <Phone size={32} className="mx-auto mb-3 text-muted-foreground/40" />
                  <p className="font-medium">
                    {debouncedSearch ? "No phone contacts match your search" : "No phone contacts yet"}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {debouncedSearch
                      ? "Try adjusting the search."
                      : "Import contacts via CSV or collect them via LINE webhook."}
                  </p>
                  {!debouncedSearch && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4 flex items-center gap-1.5"
                      onClick={() => setImportOpen(true)}
                    >
                      <Upload size={14} />
                      Import Contacts
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* ── Phone contact list ── */}
            {!phoneInitialLoading && phoneContacts.length > 0 && (
              <div className="grid gap-2">
                {phoneContacts.map((contact) => (
                  <PhoneContactCard key={contact.id} contact={contact} />
                ))}
              </div>
            )}

            {/* ── Load-more sentinel + spinner ── */}
            <div ref={phoneSentinelRef} className="h-1" />
            {phoneLoadingMore && (
              <div className="flex items-center justify-center py-6 text-muted-foreground gap-2">
                <RefreshCw size={14} className="animate-spin" />
                <span className="text-sm">Loading more…</span>
              </div>
            )}
            {!phoneHasMore && phoneContacts.length > 0 && !phoneLoadingMore && (
              <p className="text-center text-xs text-muted-foreground py-4">
                All {phoneTotal.toLocaleString()} phone contacts loaded
              </p>
            )}
          </>
        )}
      </div>

      {/* ── CsvImportWizard dialog ── */}
      <CsvImportWizard
        open={importOpen}
        onClose={handleImportClose}
        lineOAId={selectedLineOAId}
      />
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

// ── PhoneContactCard ──────────────────────────────────────────────────────────

function PhoneContactCard({ contact }: { contact: UnifiedContact }) {
  const displayName = [contact.first_name, contact.last_name].filter(Boolean).join(" ") || contact.display_name;
  const isLinked = contact.contact_status === "linked" || contact.contact_status === "follower";

  function handleClick() {
    // Navigate to phone contact detail if we have a contact id
    // Fall back to followers detail if it's a linked follower
    if (contact.line_user_id && isLinked) {
      window.location.href = `/followers/${contact.id}`;
    } else {
      window.location.href = `/contacts/phone/${contact.id}`;
    }
  }

  return (
    <Card
      className="cursor-pointer hover:bg-muted/50 transition-colors"
      onClick={handleClick}
    >
      <CardContent className="flex items-center gap-4 p-4">
        {/* Avatar placeholder */}
        <div className="w-10 h-10 rounded-full bg-gray-100 flex-shrink-0 flex items-center justify-center text-gray-400 font-semibold text-sm">
          {displayName?.[0]?.toUpperCase() || contact.phone?.[0] || "?"}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          {/* Row 1: name + linked status */}
          <div className="flex items-center gap-2 flex-wrap">
            {displayName ? (
              <span className="font-medium truncate">{displayName}</span>
            ) : (
              <span className="font-medium truncate text-muted-foreground">{contact.phone ?? "Unknown"}</span>
            )}
            {isLinked && (
              <Badge variant="success" className="text-xs">linked</Badge>
            )}
          </div>

          {/* Row 2: phone number */}
          {contact.phone && (
            <p className="text-xs text-muted-foreground mt-0.5 font-mono truncate">
              {contact.phone}
            </p>
          )}

          {/* Row 3: follow status if linked */}
          {contact.follow_status && (
            <div className="flex items-center gap-1.5 mt-1">
              <Badge variant={followStatusVariant[contact.follow_status as keyof typeof followStatusVariant] ?? "secondary"} className="text-xs">
                {contact.follow_status}
              </Badge>
            </div>
          )}
        </div>

        {/* Source badge + date — desktop only */}
        <div className="hidden sm:flex flex-col items-end gap-1 text-xs text-muted-foreground flex-shrink-0">
          {contact.contact_status && (
            <Badge variant={sourceVariant[contact.contact_status] ?? "outline"} className="text-[10px]">
              {contact.contact_status}
            </Badge>
          )}
          <span>{new Date(contact.created_at).toLocaleDateString()}</span>
        </div>
      </CardContent>
    </Card>
  );
}
