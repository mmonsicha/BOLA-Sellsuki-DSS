import { useEffect, useMemo, useState } from "react";
import {
  AdvancedDataTable,
  Badge,
  Breadcrumb,
  Card,
  CardBody,
  ConfirmDialog,
  DSButton,
  EmptyState,
  FeaturePageScaffold,
  FilterBar,
  PageHeader,
  Tabs,
  toast,
  type AdvancedColumn,
  type BulkAction,
  type FilterBarValue,
} from "@uxuissk/design-system";
import { BookOpen, Phone, Trash2, Upload, Users } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { CsvImportWizard } from "@/components/contacts/CsvImportWizard";
import { followerApi } from "@/api/follower";
import { lineOAApi } from "@/api/lineOA";
import { getWorkspaceId } from "@/lib/auth";
import { maskPhone } from "@/lib/phone";
import type { Follower, LineOA, UnifiedContact } from "@/types";

const WORKSPACE_ID = getWorkspaceId() ?? "";

type ActiveTab = "followers" | "phone_only";

const followStatusVariant: Record<string, "success" | "secondary" | "destructive"> = {
  following: "success",
  unfollowed: "secondary",
  blocked: "destructive",
};

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
  return contact.phone ? maskPhone(contact.phone) : null;
}

export function ContactsPage() {
  const [lineOAs, setLineOAs] = useState<LineOA[]>([]);
  const [activeTab, setActiveTab] = useState<ActiveTab>("followers");
  const [followers, setFollowers] = useState<Follower[]>([]);
  const [unifiedContacts, setUnifiedContacts] = useState<UnifiedContact[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [deleteAllOpen, setDeleteAllOpen] = useState(false);

  const [filterValue, setFilterValue] = useState<FilterBarValue>({
    search: "",
    filters: {
      lineOa: null,
    },
  });
  const [debouncedFilterValue, setDebouncedFilterValue] = useState(filterValue);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedFilterValue(filterValue), 400);
    return () => clearTimeout(timer);
  }, [filterValue]);

  useEffect(() => {
    const loadLineOAs = async () => {
      try {
        const res = await lineOAApi.list({ workspace_id: WORKSPACE_ID });
        setLineOAs(res.data ?? []);
      } catch {
        toast.warning("LINE OA filters are unavailable right now.");
      }
    };

    void loadLineOAs();
  }, []);

  useEffect(() => {
    setPage(1);
    setSelectedIds(new Set());
  }, [activeTab, debouncedFilterValue]);

  useEffect(() => {
    const lineOaId = typeof debouncedFilterValue.filters.lineOa === "string"
      ? debouncedFilterValue.filters.lineOa
      : undefined;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        if (activeTab === "followers") {
          const res = await followerApi.list({
            workspace_id: WORKSPACE_ID,
            line_oa_id: lineOaId,
            search: debouncedFilterValue.search || undefined,
            page,
            page_size: pageSize,
          });
          setFollowers(res.data ?? []);
          setTotal(res.total ?? 0);
          setUnifiedContacts([]);
        } else {
          const res = await followerApi.listUnified({
            workspace_id: WORKSPACE_ID,
            line_oa_id: lineOaId,
            contact_status: "phone_only",
            search: debouncedFilterValue.search || undefined,
            page,
            page_size: pageSize,
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
  }, [activeTab, debouncedFilterValue, page, pageSize]);

  const followerColumns = useMemo<AdvancedColumn<Follower>[]>(() => [
    {
      key: "display_name",
      header: "Contact",
      sortable: true,
      render: (value: string, row) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-sky-50 text-sky-600">
            {row.picture_url ? (
              <img src={row.picture_url} alt={value} className="h-full w-full object-cover" />
            ) : (
              <span className="text-sm font-semibold">{value?.[0]?.toUpperCase() ?? "?"}</span>
            )}
          </div>
          <div className="min-w-0">
            <div className="truncate font-semibold">{value}</div>
            {row.tags?.length ? (
              <div className="mt-1 flex flex-wrap gap-2">
                {row.tags.slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="outline" size="sm">{tag}</Badge>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      ),
    },
    {
      key: "follow_status",
      header: "Status",
      render: (value: string) => <Badge variant={followStatusVariant[value] ?? "secondary"} size="sm">{value}</Badge>,
    },
    {
      key: "followed_at",
      header: "Followed",
      render: (value: string | null | undefined) => value ? new Date(value).toLocaleDateString() : "-",
    },
  ], []);

  const phoneColumns = useMemo<AdvancedColumn<UnifiedContact>[]>(() => [
    {
      key: "display_name",
      header: "Contact",
      sortable: true,
      render: (_value, row) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-sky-50 text-sky-600">
            {row.picture_url ? (
              <img src={row.picture_url} alt={getDisplayLabel(row)} className="h-full w-full object-cover" />
            ) : (
              <span className="text-sm font-semibold">{getInitials(row)}</span>
            )}
          </div>
          <div className="min-w-0">
            <div className="truncate font-semibold">{getDisplayLabel(row)}</div>
            {getSubLabel(row) && (
              <div className="truncate text-sm text-[var(--text-secondary)]">{getSubLabel(row)}</div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "linked_oa_count",
      header: "Links",
      render: (value: number | null | undefined) => (
        value && value > 0
          ? <Badge variant="success" size="sm">{value} OA linked</Badge>
          : <Badge variant="secondary" size="sm">Phone only</Badge>
      ),
    },
    {
      key: "created_at",
      header: "Created",
      render: (value: string | null | undefined) => value ? new Date(value).toLocaleDateString() : "-",
    },
  ], []);

  const bulkActions: BulkAction[] = [
    {
      label: "Delete selected",
      icon: <Trash2 size={14} />,
      variant: "destructive",
      onClick: () => setBulkDeleteOpen(true),
    },
  ];

  const totalFollowers = activeTab === "followers" ? total : followers.length;
  const totalPhones = activeTab === "phone_only" ? total : unifiedContacts.length;

  const filterOptions = lineOAs.map((oa) => ({ label: oa.name, value: oa.id }));
  const currentLineOaId = typeof debouncedFilterValue.filters.lineOa === "string"
    ? debouncedFilterValue.filters.lineOa
    : "";

  const handleDeleteAll = async () => {
    try {
      await followerApi.deleteAllPhoneContacts();
      setSelectedIds(new Set());
      setDeleteAllOpen(false);
      setUnifiedContacts([]);
      setTotal(0);
      toast.success("All phone contacts were deleted.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete all contacts");
    }
  };

  const handleBulkDelete = async () => {
    try {
      await followerApi.bulkDeletePhoneContacts(Array.from(selectedIds).map(String));
      setSelectedIds(new Set());
      setBulkDeleteOpen(false);
      setPage(1);
      setDebouncedFilterValue((prev) => ({ ...prev }));
      toast.success("Selected phone contacts were deleted.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete contacts");
    }
  };

  const emptyState = activeTab === "followers"
    ? (
      <EmptyState
        icon={<Users size={44} />}
        title="No followers yet"
        description="Followers will appear here when they follow your LINE Official Account."
      />
    )
    : (
      <EmptyState
        icon={<Phone size={44} />}
        title="No phone contacts yet"
        description="Import phone numbers to create a reusable contact list for campaigns and matching."
        action={(
          <DSButton variant="secondary" leftIcon={<Upload size={16} />} onClick={() => setImportOpen(true)}>
            Import Phones
          </DSButton>
        )}
      />
    );

  const tableNode = (
    <Card elevation="none">
      <CardBody>
        {(activeTab === "followers" ? followers.length : unifiedContacts.length) === 0 && !loading && !error ? (
          emptyState
        ) : (
          <AdvancedDataTable
            rowKey="id"
            columns={activeTab === "followers" ? followerColumns : phoneColumns}
            data={activeTab === "followers" ? followers : unifiedContacts}
            pagination={{ page, pageSize, totalCount: total }}
            onPageChange={(nextPage, nextPageSize) => {
              setPage(nextPage);
              setPageSize(nextPageSize);
            }}
            selectable={activeTab === "phone_only"}
            selectedRows={selectedIds}
            onSelectionChange={(selected) => setSelectedIds(selected)}
            bulkActions={activeTab === "phone_only" ? bulkActions : undefined}
            loading={loading}
            error={error ?? undefined}
            emptyMessage="No contacts found"
            emptyDescription="Try adjusting your search or LINE OA filter."
            onRowClick={(row) => {
              window.location.href = activeTab === "followers"
                ? `/followers/${row.id}`
                : `/contacts/phone/${row.id}`;
            }}
          />
        )}
      </CardBody>
    </Card>
  );

  return (
    <AppLayout title="Contacts">
      <FeaturePageScaffold
        layout="list"
        header={(
          <PageHeader
            title="Contacts"
            subtitle="Manage followers, imported phone contacts, and matching flows from a single DS-first workspace."
            breadcrumb={<Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Contacts" }]} />}
            tabs={(
              <Tabs
                tabs={[
                  { id: "followers", label: "All Followers", badge: String(totalFollowers) },
                  { id: "phone_only", label: "Phone", badge: String(totalPhones) },
                ]}
                activeTab={activeTab}
                onChange={(id) => setActiveTab(id as ActiveTab)}
                variant="underline"
              />
            )}
            actions={(
              <div className="flex flex-wrap items-center gap-3">
                <a
                  href={`${(import.meta.env.VITE_API_URL || "").replace(/\/$/, "")}/v1/contacts/swagger`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <DSButton variant="ghost" leftIcon={<BookOpen size={16} />}>API Docs</DSButton>
                </a>
                <DSButton variant="outline" leftIcon={<Upload size={16} />} onClick={() => setImportOpen(true)}>
                  Import Phones
                </DSButton>
                {activeTab === "phone_only" && total > 0 && (
                  <DSButton variant="destructive" leftIcon={<Trash2 size={16} />} onClick={() => setDeleteAllOpen(true)}>
                    Delete all
                  </DSButton>
                )}
              </div>
            )}
          />
        )}
        filters={(
          <FilterBar
            showSearch
            searchPlaceholder="Search by name, phone, or LINE display name..."
            filters={[
              { key: "lineOa", label: "LINE OA", type: "single", options: [{ label: "All LINE OAs", value: "" }, ...filterOptions] },
            ]}
            value={filterValue}
            onFilterChange={(value) => setFilterValue(value)}
          />
        )}
        table={tableNode}
      />

      <CsvImportWizard
        open={importOpen}
        onClose={() => setImportOpen(false)}
        lineOAId={currentLineOaId}
      />

      <ConfirmDialog
        open={deleteAllOpen}
        onClose={() => setDeleteAllOpen(false)}
        onConfirm={() => { void handleDeleteAll(); }}
        title="Delete all phone contacts?"
        description={`This will permanently remove ${total} imported phone contacts and any OA links tied to them.`}
        confirmLabel="Delete all"
        cancelLabel="Cancel"
        variant="destructive"
      />

      <ConfirmDialog
        open={bulkDeleteOpen}
        onClose={() => setBulkDeleteOpen(false)}
        onConfirm={() => { void handleBulkDelete(); }}
        title="Delete selected contacts?"
        description={`This will permanently remove ${selectedIds.size} selected phone contacts and their current OA links.`}
        confirmLabel="Delete selected"
        cancelLabel="Cancel"
        variant="destructive"
      />
    </AppLayout>
  );
}
