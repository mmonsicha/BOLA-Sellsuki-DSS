import { useEffect, useMemo, useState } from "react";
import {
  AdvancedDataTable,
  Badge,
  Breadcrumb,
  Card,
  CardBody,
  DSButton,
  EmptyState,
  FeaturePageScaffold,
  FilterBar,
  Notification,
  PageHeader,
  Tabs,
  type AdvancedColumn,
  type FilterBarValue,
} from "@uxuissk/design-system";
import { Phone, RefreshCw, Upload, Users } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { followerApi } from "@/api/follower";
import { lineOAApi } from "@/api/lineOA";
import { CsvImportWizard } from "@/components/contacts/CsvImportWizard";
import { getWorkspaceId } from "@/lib/auth";
import type { Follower, LineOA, UnifiedContact } from "@/types";

const WORKSPACE_ID = getWorkspaceId() ?? "";
const PAGE_SIZE = 20;

type FollowStatus = "" | "following" | "unfollowed" | "blocked";
type ActiveTab = "followers" | "phone_contacts";

const FOLLOW_STATUS_OPTIONS: { label: string; value: FollowStatus }[] = [
  { label: "All statuses", value: "" },
  { label: "Following", value: "following" },
  { label: "Unfollowed", value: "unfollowed" },
  { label: "Blocked", value: "blocked" },
];

const followStatusVariant: Record<string, "success" | "secondary" | "destructive"> = {
  following: "success",
  unfollowed: "secondary",
  blocked: "destructive",
};

const contactStatusVariant: Record<string, "default" | "secondary" | "outline" | "success"> = {
  follower: "success",
  linked: "success",
  phone_only: "secondary",
  subscriber: "default",
};

function getDisplayName(contact: UnifiedContact) {
  return [contact.first_name, contact.last_name].filter(Boolean).join(" ") || contact.display_name || contact.phone || "Unknown";
}

function ContactAvatar({ name, pictureUrl }: { name: string; pictureUrl?: string }) {
  return (
    <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-sky-50 text-sky-600">
      {pictureUrl ? (
        <img src={pictureUrl} alt={name} className="h-full w-full object-cover" />
      ) : (
        <span className="text-sm font-semibold">{name[0]?.toUpperCase() ?? "?"}</span>
      )}
    </div>
  );
}

export function FollowersPage() {
  const [lineOAs, setLineOAs] = useState<LineOA[]>([]);
  const [activeTab, setActiveTab] = useState<ActiveTab>("followers");
  const [filters, setFilters] = useState<FilterBarValue>({
    search: "",
    filters: {
      lineOa: "",
      status: "",
    },
  });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  const [sortBy, setSortBy] = useState<string>("followed_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [followers, setFollowers] = useState<Follower[]>([]);
  const [followerTotal, setFollowerTotal] = useState(0);
  const [phoneContacts, setPhoneContacts] = useState<UnifiedContact[]>([]);
  const [phoneTotal, setPhoneTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [importOpen, setImportOpen] = useState(false);

  useEffect(() => {
    lineOAApi
      .list({ workspace_id: WORKSPACE_ID })
      .then((res) => setLineOAs(res.data ?? []))
      .catch(() => setLineOAs([]));
  }, []);

  const lineOAOptions = useMemo(
    () => lineOAs.map((oa) => ({ label: oa.name, value: oa.id })),
    [lineOAs],
  );

  useEffect(() => {
    setPage(1);
  }, [activeTab, filters]);

  useEffect(() => {
    if (!WORKSPACE_ID) {
      setFollowers([]);
      setPhoneContacts([]);
      setFollowerTotal(0);
      setPhoneTotal(0);
      setLoading(false);
      setError("Workspace is not available.");
      return;
    }

    const search = typeof filters.search === "string" ? filters.search.trim() : "";
    const lineOaId = typeof filters.filters.lineOa === "string" ? filters.filters.lineOa : "";
    const followStatus = typeof filters.filters.status === "string" ? filters.filters.status as FollowStatus : "";

    setLoading(true);
    setError(null);

    const request = activeTab === "followers"
      ? followerApi.list({
        workspace_id: WORKSPACE_ID,
        line_oa_id: lineOaId || undefined,
        search: search || undefined,
        follow_status: followStatus || undefined,
        page,
        page_size: pageSize,
      })
      : followerApi.listUnified({
        workspace_id: WORKSPACE_ID,
        line_oa_id: lineOaId || undefined,
        search: search || undefined,
        contact_status: "phone_only",
        page,
        page_size: pageSize,
      });

    request
      .then((res) => {
        if (activeTab === "followers") {
          setFollowers((res.data ?? []) as Follower[]);
          setFollowerTotal(res.total ?? 0);
        } else {
          setPhoneContacts((res.data ?? []) as UnifiedContact[]);
          setPhoneTotal(res.total ?? 0);
        }
      })
      .catch((err) => {
        const message = err instanceof Error ? err.message : `Failed to load ${activeTab === "followers" ? "followers" : "phone contacts"}`;
        setError(message);
        if (activeTab === "followers") {
          setFollowers([]);
          setFollowerTotal(0);
        } else {
          setPhoneContacts([]);
          setPhoneTotal(0);
        }
      })
      .finally(() => setLoading(false));
  }, [activeTab, filters, page, pageSize, reloadKey]);

  const followerColumns = useMemo<AdvancedColumn<Follower>[]>(() => [
    {
      key: "display_name",
      header: "Follower",
      sortable: true,
      render: (_value, row) => (
        <div className="flex items-center gap-3">
          <ContactAvatar name={row.display_name || row.line_user_id} pictureUrl={row.picture_url} />
          <div className="min-w-0">
            <div className="truncate font-semibold text-[var(--foreground)]">{row.display_name || row.line_user_id}</div>
            <div className="truncate text-sm text-[var(--muted-foreground)]">
              {[row.phone, row.email].filter(Boolean).join(" | ") || row.line_user_id}
            </div>
            {row.tags.length > 0 && (
              <div className="mt-1 flex flex-wrap gap-2">
                {row.tags.slice(0, 2).map((tag) => (
                  <Badge key={tag} variant="outline" size="sm">{tag}</Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "line_oa_id",
      header: "LINE OA",
      sortable: true,
      render: (value: string) => {
        const oa = lineOAs.find((item) => item.id === value);
        return (
          <div className="space-y-1">
            <div className="font-medium text-[var(--foreground)]">{oa?.name ?? "-"}</div>
            <div className="text-sm text-[var(--muted-foreground)]">{oa?.basic_id ?? "-"}</div>
          </div>
        );
      },
    },
    {
      key: "follow_status",
      header: "Status",
      sortable: true,
      render: (value: string) => <Badge variant={followStatusVariant[value] ?? "secondary"} size="sm">{value}</Badge>,
    },
    {
      key: "followed_at",
      header: "Followed",
      sortable: true,
      render: (value: string | null | undefined) => value ? new Date(value).toLocaleDateString() : "-",
    },
  ], [lineOAs]);

  const phoneColumns = useMemo<AdvancedColumn<UnifiedContact>[]>(() => [
    {
      key: "id",
      header: "Contact",
      render: (_value, row) => {
        const name = getDisplayName(row);
        return (
          <div className="flex items-center gap-3">
            <ContactAvatar name={name} pictureUrl={row.picture_url} />
            <div className="min-w-0">
              <div className="truncate font-semibold text-[var(--foreground)]">{name}</div>
              <div className="truncate text-sm text-[var(--muted-foreground)]">{row.phone || row.line_user_id || "-"}</div>
            </div>
          </div>
        );
      },
    },
    {
      key: "line_oa_id",
      header: "LINE OA",
      render: (value: string) => {
        const oa = lineOAs.find((item) => item.id === value);
        return oa ? (
          <div className="space-y-1">
            <div className="font-medium text-[var(--foreground)]">{oa.name}</div>
            <div className="text-sm text-[var(--muted-foreground)]">{oa.basic_id}</div>
          </div>
        ) : "-";
      },
    },
    {
      key: "contact_status",
      header: "Status",
      render: (value: string) => <Badge variant={contactStatusVariant[value] ?? "outline"} size="sm">{value}</Badge>,
    },
    {
      key: "created_at",
      header: "Created",
      render: (value: string) => new Date(value).toLocaleDateString(),
    },
  ], [lineOAs]);

  const activeCount = activeTab === "followers" ? followerTotal : phoneTotal;
  const tableData = activeTab === "followers" ? followers : phoneContacts;
  const columns = activeTab === "followers" ? followerColumns : phoneColumns;

  return (
    <AppLayout title="Followers">
      <FeaturePageScaffold
        layout="list"
        header={(
          <PageHeader
            title="Audience"
            subtitle="Manage LINE followers and imported phone contacts with the latest DS table and filter patterns."
            breadcrumb={<Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Followers" }]} />}
            actions={(
              <DSButton variant="primary" leftIcon={<Upload size={16} />} onClick={() => setImportOpen(true)}>
                Import contacts
              </DSButton>
            )}
          />
        )}
        filters={(
          <div className="space-y-4">
            <Tabs
              tabs={[
                { id: "followers", label: "Followers", badge: String(followerTotal), icon: <Users size={16} /> },
                { id: "phone_contacts", label: "Phone Contacts", badge: String(phoneTotal), icon: <Phone size={16} /> },
              ]}
              activeTab={activeTab}
              onChange={(id) => setActiveTab(id as ActiveTab)}
              variant="underline"
              size="md"
            />

            <FilterBar
              showSearch
              searchPlaceholder={activeTab === "followers" ? "Search by display name, email, phone, or LINE user ID" : "Search phone contacts by name or phone"}
              filters={[
                {
                  key: "lineOa",
                  label: "LINE OA",
                  type: "single",
                  options: [{ label: "All LINE OAs", value: "" }, ...lineOAOptions],
                },
                ...(activeTab === "followers"
                  ? [{
                    key: "status",
                    label: "Follow status",
                    type: "single",
                    options: FOLLOW_STATUS_OPTIONS,
                  }]
                  : []),
              ]}
              value={filters}
              onFilterChange={(value) => {
                setFilters(value);
                setPage(1);
              }}
            />
          </div>
        )}
        table={(
          <div className="space-y-4">
            {error && (
              <Notification
                type="error"
                title={`Failed to load ${activeTab === "followers" ? "followers" : "phone contacts"}`}
                message={error}
                dismissible={false}
                action={(
                  <DSButton
                    variant="ghost"
                    size="sm"
                    leftIcon={<RefreshCw size={14} />}
                    onClick={() => setReloadKey((value) => value + 1)}
                  >
                    Try again
                  </DSButton>
                )}
              />
            )}

            {!error && activeCount === 0 && !loading ? (
              <Card elevation="none">
                <CardBody>
                  <EmptyState
                    icon={activeTab === "followers" ? <Users size={44} /> : <Phone size={44} />}
                    title={activeTab === "followers" ? "No followers found" : "No phone contacts found"}
                    description={
                      activeTab === "followers"
                        ? "Try adjusting the current search or filter to find followers in this workspace."
                        : "Import phone contacts to start matching customer records with LINE identities."
                    }
                    action={(
                      <DSButton variant="secondary" leftIcon={<Upload size={16} />} onClick={() => setImportOpen(true)}>
                        Import contacts
                      </DSButton>
                    )}
                  />
                </CardBody>
              </Card>
            ) : (
              <AdvancedDataTable
                rowKey="id"
                columns={columns}
                data={tableData}
                loading={loading}
                pagination={{ page, pageSize, totalCount: activeCount }}
                sortBy={sortBy}
                sortOrder={sortOrder}
                onPageChange={(nextPage, nextPageSize) => {
                  setPage(nextPage);
                  setPageSize(nextPageSize);
                }}
                onSortChange={(nextSortBy, nextSortOrder) => {
                  setSortBy(nextSortBy);
                  setSortOrder(nextSortOrder);
                }}
                emptyMessage={activeTab === "followers" ? "No followers found" : "No phone contacts found"}
                emptyDescription="Try adjusting your search or selected LINE OA."
                showColumnToggle
                stickyHeader
                onRowClick={(row) => {
                  if (activeTab === "followers") {
                    window.location.href = `/followers/${(row as Follower).id}`;
                    return;
                  }

                  const contact = row as UnifiedContact;
                  if (contact.contact_status === "linked" || contact.contact_status === "follower") {
                    window.location.href = `/followers/${contact.id}`;
                    return;
                  }
                  window.location.href = `/contacts/phone/${contact.id}`;
                }}
              />
            )}
          </div>
        )}
      />

      <CsvImportWizard
        open={importOpen}
        onClose={() => {
          setImportOpen(false);
          setReloadKey((value) => value + 1);
        }}
        lineOAId={typeof filters.filters.lineOa === "string" ? filters.filters.lineOa : ""}
      />
    </AppLayout>
  );
}
