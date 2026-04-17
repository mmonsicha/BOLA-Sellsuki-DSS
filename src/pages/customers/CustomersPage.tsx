import { useState, useEffect, useRef } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { LineOAFilter } from "@/components/common/LineOAFilter";
import { CsvImportWizard } from "@/components/contacts/CsvImportWizard";
import { cn } from "@/lib/utils";
import type { Follower, UnifiedContact, LineOA } from "@/types";
import { followerApi } from "@/api/follower";
import { lineOAApi } from "@/api/lineOA";
import { getWorkspaceId, getToken } from "@/lib/auth";
import { maskPhone } from "@/lib/phone";
import { Upload, Users, Phone, Search, ChevronLeft, ChevronRight, BookOpen, Trash2, BanIcon } from "lucide-react";

const WORKSPACE_ID = getWorkspaceId() ?? "";
const PAGE_SIZE = 20;

type ActiveTab = "followers" | "phone_only";

// ---------- helpers ----------

function getInitials(contact: UnifiedContact): string {
  if (contact.display_name) return contact.display_name[0].toUpperCase();
  if (contact.first_name) return contact.first_name[0].toUpperCase();
  if (contact.phone) return contact.phone[0];
  return "?";
}

function getDisplayLabel(contact: UnifiedContact): string {
  if (contact.display_name) return contact.display_name;
  const name = [contact.first_name, contact.last_name].filter(Boolean).join(" ");
  if (name) return name;
  return contact.phone ? maskPhone(contact.phone) : (contact.line_user_id ?? contact.id);
}

function getSubLabel(contact: UnifiedContact): string | null {
  if (contact.phone) return maskPhone(contact.phone);
  return null;
}

const followStatusVariant: Record<string, "success" | "secondary" | "destructive"> = {
  following: "success",
  unfollowed: "secondary",
  blocked: "destructive",
};

export function ContactsPage() {
  // LINE OA list
  const [lineOAs, setLineOAs] = useState<LineOA[]>([]);
  const [selectedLineOAId, setSelectedLineOAId] = useState("");

  // Tab
  const [activeTab, setActiveTab] = useState<ActiveTab>("followers");

  // Data
  const [followers, setFollowers] = useState<Follower[]>([]);
  const [unifiedContacts, setUnifiedContacts] = useState<UnifiedContact[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search (debounced)
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Import modal
  const [importOpen, setImportOpen] = useState(false);

  // Bulk delete (phone_only tab)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  // Delete all
  const [deleteAllOpen, setDeleteAllOpen] = useState(false);
  const [deleteAlling, setDeleteAlling] = useState(false);

  // Increment to force data reload after mutations
  const [refreshKey, setRefreshKey] = useState(0);

  // ---- Load LINE OAs ----
  useEffect(() => {
    const load = async () => {
      try {
        const res = await lineOAApi.list({ workspace_id: WORKSPACE_ID });
        setLineOAs(res.data ?? []);
      } catch {
        // non-fatal: filter just won't show
      }
    };
    void load();
  }, []);

  // ---- Debounce search input ----
  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      setSearch(value);
      setPage(1);
    }, 400);
  };

  // ---- Reset page on tab / OA / search change ----
  useEffect(() => {
    setPage(1);
    setSelectedIds(new Set());
  }, [activeTab, selectedLineOAId]);

  // ---- Load data ----
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        if (activeTab === "followers") {
          const res = await followerApi.list({
            workspace_id: WORKSPACE_ID,
            line_oa_id: selectedLineOAId || undefined,
            search: search || undefined,
            page,
            page_size: PAGE_SIZE,
          });
          setFollowers(res.data ?? []);
          setTotal(res.total ?? 0);
          setUnifiedContacts([]);
        } else {
          const res = await followerApi.listUnified({
            workspace_id: WORKSPACE_ID,
            line_oa_id: selectedLineOAId || undefined,
            contact_status: "phone",
            search: search || undefined,
            page,
            page_size: PAGE_SIZE,
          });
          setUnifiedContacts(res.data ?? []);
          setTotal(res.total ?? 0);
          setFollowers([]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load contacts");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [activeTab, selectedLineOAId, search, page, refreshKey]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // ---- Selection helpers ----
  const allCurrentIds = unifiedContacts.map((c) => c.id);
  const allSelected = allCurrentIds.length > 0 && allCurrentIds.every((id) => selectedIds.has(id));
  const someSelected = allCurrentIds.some((id) => selectedIds.has(id));

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        allCurrentIds.forEach((id) => next.delete(id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        allCurrentIds.forEach((id) => next.add(id));
        return next;
      });
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDeleteAll = async () => {
    setDeleteAlling(true);
    try {
      await followerApi.deleteAllPhoneContacts();
      setSelectedIds(new Set());
      setDeleteAllOpen(false);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete all contacts");
    } finally {
      setDeleteAlling(false);
    }
  };

  const handleBulkDelete = async () => {
    setBulkDeleting(true);
    try {
      await followerApi.bulkDeletePhoneContacts(Array.from(selectedIds));
      setSelectedIds(new Set());
      setBulkDeleteOpen(false);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete contacts");
    } finally {
      setBulkDeleting(false);
    }
  };

  return (
    <AppLayout title="Contacts">
      <div className="space-y-4">
        {/* Top bar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Manage your LINE contacts — followers, phone imports, and more.
          </p>
          <div className="flex items-center gap-2">
            <a
              href={(() => {
                const base = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
                const token = getToken() || "";
                const wsId = getWorkspaceId() || "";
                const params = new URLSearchParams();
                if (token) params.set("token", token);
                if (wsId) params.set("workspace_id", wsId);
                const qs = params.toString();
                return `${base}/v1/contacts/swagger${qs ? `?${qs}` : ""}`;
              })()}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="ghost" size="sm" className="flex items-center gap-1.5 text-muted-foreground">
                <BookOpen size={14} />
                API Docs
              </Button>
            </a>
            <Button
              variant="outline"
              size="sm"
              className="flex-shrink-0 flex items-center gap-1.5"
              onClick={() => setImportOpen(true)}
            >
              <Upload size={14} />
              Import Phones
            </Button>
          </div>
        </div>

        {/* LINE OA filter */}
        <LineOAFilter
          lineOAs={lineOAs}
          selectedId={selectedLineOAId}
          onChange={(id) => { setSelectedLineOAId(id); setPage(1); }}
          showAll
        />

        {/* Tabs */}
        <div className="flex gap-1 border-b">
          <button
            onClick={() => setActiveTab("followers")}
            className={cn(
              "px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px",
              activeTab === "followers"
                ? "border-line text-line"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <span className="flex items-center gap-1.5">
              <Users size={14} />
              All Followers
            </span>
          </button>
          <button
            onClick={() => setActiveTab("phone_only")}
            className={cn(
              "px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px",
              activeTab === "phone_only"
                ? "border-line text-line"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <span className="flex items-center gap-1.5">
              <Phone size={14} />
              Phone
            </span>
          </button>
        </div>

        {/* Search + action bar */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, phone…"
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>
          {activeTab === "phone_only" && selectedIds.size > 0 && (
            <Button
              variant="destructive"
              size="sm"
              className="flex-shrink-0 flex items-center gap-1.5"
              onClick={() => setBulkDeleteOpen(true)}
            >
              <Trash2 size={14} />
              ลบ {selectedIds.size} รายการ
            </Button>
          )}
          {activeTab === "phone_only" && total > 0 && selectedIds.size === 0 && (
            <Button
              variant="outline"
              size="sm"
              className="flex-shrink-0 flex items-center gap-1.5 text-destructive border-destructive/40 hover:bg-destructive/10"
              onClick={() => setDeleteAllOpen(true)}
            >
              <Trash2 size={14} />
              ลบทั้งหมด ({total})
            </Button>
          )}
        </div>

        {/* Error */}
        {error && (
          <Card className="border-destructive">
            <CardContent className="text-center py-8">
              <p className="font-medium text-destructive">Error loading contacts</p>
              <p className="text-sm text-muted-foreground mt-1">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Loading skeleton */}
        {loading && (
          <Card>
            <CardContent className="text-center py-12">
              <p className="font-medium text-muted-foreground animate-pulse">Loading…</p>
            </CardContent>
          </Card>
        )}

        {/* All Followers tab content */}
        {!loading && !error && activeTab === "followers" && (
          followers.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Users className="mx-auto mb-3 text-muted-foreground" size={36} />
                <p className="font-medium">No followers yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Followers will appear here when they follow your LINE OA.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3">
              {followers.map((follower) => (
                <Card
                  key={follower.id}
                  className="cursor-pointer hover:bg-muted/40 transition-colors"
                  onClick={() => window.location.href = `/followers/${follower.id}`}
                >
                  <CardContent className="flex items-center gap-4 p-4">
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-muted flex-shrink-0 overflow-hidden">
                      {follower.picture_url ? (
                        <img
                          src={follower.picture_url}
                          alt={follower.display_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground font-medium text-sm">
                          {follower.display_name?.[0]?.toUpperCase() ?? "?"}
                        </div>
                      )}
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium truncate">{follower.display_name}</span>
                        <Badge variant={followStatusVariant[follower.follow_status] ?? "secondary"}>
                          {follower.follow_status}
                        </Badge>
                      </div>
                      {follower.tags?.length > 0 && (
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {follower.tags.map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    {/* Date */}
                    <div className="text-xs text-muted-foreground flex-shrink-0">
                      {follower.followed_at
                        ? new Date(follower.followed_at).toLocaleDateString()
                        : "—"}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )
        )}

        {/* Phone Only tab content */}
        {!loading && !error && activeTab === "phone_only" && (
          unifiedContacts.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Phone className="mx-auto mb-3 text-muted-foreground" size={36} />
                <p className="font-medium">No phone contacts yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Import phone numbers using the "Import Phones" button above.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3">
              {/* Select-all row */}
              <div className="flex items-center gap-3 px-1">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 accent-[#06C755] cursor-pointer"
                  checked={allSelected}
                  ref={(el) => { if (el) el.indeterminate = someSelected && !allSelected; }}
                  onChange={toggleSelectAll}
                  aria-label="Select all on this page"
                />
                <span className="text-xs text-muted-foreground">
                  {selectedIds.size > 0 ? `เลือกแล้ว ${selectedIds.size} รายการ` : "เลือกทั้งหมดในหน้านี้"}
                </span>
              </div>

              {unifiedContacts.map((contact) => (
                <Card
                  key={contact.id}
                  className={cn(
                    "transition-colors",
                    selectedIds.has(contact.id) ? "border-line/40 bg-line/5" : "hover:bg-muted/40"
                  )}
                >
                  <CardContent className="flex items-center gap-4 p-4">
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 accent-[#06C755] cursor-pointer flex-shrink-0"
                      checked={selectedIds.has(contact.id)}
                      onChange={() => toggleSelect(contact.id)}
                      onClick={(e) => e.stopPropagation()}
                      aria-label={`Select ${getDisplayLabel(contact)}`}
                    />

                    {/* Clickable area */}
                    <div
                      className="flex items-center gap-4 flex-1 min-w-0 cursor-pointer"
                      onClick={() => window.location.href = `/contacts/phone/${contact.id}`}
                    >
                      {/* Avatar / initials */}
                      <div className="w-10 h-10 rounded-full bg-muted flex-shrink-0 overflow-hidden">
                        {contact.picture_url ? (
                          <img
                            src={contact.picture_url}
                            alt={getDisplayLabel(contact)}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground font-medium text-sm">
                            {getInitials(contact)}
                          </div>
                        )}
                      </div>
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium truncate">{getDisplayLabel(contact)}</span>
                          <Badge variant="secondary">Phone</Badge>
                          {contact.linked_oa_count != null && contact.linked_oa_count > 0 && (
                            <Badge variant="outline" className="text-xs text-line border-line/40">
                              {contact.linked_oa_count} OA{contact.linked_oa_count > 1 ? "s" : ""} linked
                            </Badge>
                          )}
                          {contact.lon_suppressed && (
                            <Badge variant="destructive" className="text-xs gap-1">
                              <BanIcon size={10} />
                              ไม่รองรับ LON
                            </Badge>
                          )}
                        </div>
                        {getSubLabel(contact) && getSubLabel(contact) !== getDisplayLabel(contact) && (
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">
                            {getSubLabel(contact)}
                          </p>
                        )}
                      </div>
                      {/* Date */}
                      <div className="text-xs text-muted-foreground flex-shrink-0">
                        {contact.created_at
                          ? new Date(contact.created_at).toLocaleDateString()
                          : "—"}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )
        )}

        {/* Pagination */}
        {!loading && !error && total > PAGE_SIZE && (
          <div className="flex items-center justify-between pt-2">
            <p className="text-sm text-muted-foreground">
              Page {page} of {totalPages} ({total} total)
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                <ChevronLeft size={14} />
                Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                Next
                <ChevronRight size={14} />
              </Button>
            </div>
          </div>
        )}
      </div>

      <CsvImportWizard
        open={importOpen}
        onClose={() => setImportOpen(false)}
        lineOAId={selectedLineOAId}
      />

      {/* Delete All confirm dialog */}
      <AlertDialog open={deleteAllOpen} onOpenChange={setDeleteAllOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ลบ Contact ทั้งหมด?</AlertDialogTitle>
            <AlertDialogDescription>
              คุณกำลังจะลบ <span className="font-semibold">ทั้งหมด {total} รายการ</span> ออกจากระบบถาวร
              รวมถึง OA linkage ทั้งหมด ไม่สามารถกู้คืนได้
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteAlling}>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); void handleDeleteAll(); }}
              disabled={deleteAlling}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteAlling ? "กำลังลบ…" : `ลบทั้งหมด ${total} รายการ`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk delete confirm dialog */}
      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ลบ Contact ที่เลือก?</AlertDialogTitle>
            <AlertDialogDescription>
              คุณกำลังจะลบ <span className="font-semibold">{selectedIds.size} รายการ</span> ออกจากระบบถาวร
              รวมถึง OA linkage ทั้งหมด ไม่สามารถกู้คืนได้
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={bulkDeleting}>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); void handleBulkDelete(); }}
              disabled={bulkDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {bulkDeleting ? "กำลังลบ…" : `ลบ ${selectedIds.size} รายการ`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
