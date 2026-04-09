import { useMemo, useState } from "react";
import {
  AdvancedDataTable,
  Badge,
  Breadcrumb,
  Card,
  CardBody,
  DSButton,
  EmptyState,
  FilterBar,
  PageHeader,
  Tabs,
  type AdvancedColumn,
  type FilterBarValue,
} from "@uxuissk/design-system";
import { BookOpen, Phone, Users } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { getWorkspaceId } from "@/lib/auth";
import { maskPhone } from "@/lib/phone";
import type { Follower, LineOA } from "@/types";

const WORKSPACE_ID = getWorkspaceId() ?? "mock-workspace";

type ActiveTab = "followers" | "phone_only";

const followStatusVariant: Record<string, "success" | "secondary" | "destructive"> = {
  following: "success",
  unfollowed: "secondary",
  blocked: "destructive",
};

const MOCK_LINE_OAS: LineOA[] = [
  {
    id: "oa-fashion",
    workspace_id: WORKSPACE_ID,
    name: "BOLA Fashion",
    description: "Fashion campaigns",
    picture_url: "",
    channel_id: "2001000001",
    webhook_url: "",
    basic_id: "@bolafashion",
    liff_id: "",
    outbound_webhook_url: "",
    outbound_webhook_secret: "",
    outbound_webhook_events: "",
    status: "active",
    is_default: true,
    follower_count: 18,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "oa-beauty",
    workspace_id: WORKSPACE_ID,
    name: "BOLA Beauty",
    description: "Beauty campaigns",
    picture_url: "",
    channel_id: "2001000002",
    webhook_url: "",
    basic_id: "@bolabeauty",
    liff_id: "",
    outbound_webhook_url: "",
    outbound_webhook_secret: "",
    outbound_webhook_events: "",
    status: "active",
    is_default: false,
    follower_count: 16,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "oa-home",
    workspace_id: WORKSPACE_ID,
    name: "BOLA Home",
    description: "Home campaigns",
    picture_url: "",
    channel_id: "2001000003",
    webhook_url: "",
    basic_id: "@bolahome",
    liff_id: "",
    outbound_webhook_url: "",
    outbound_webhook_secret: "",
    outbound_webhook_events: "",
    status: "active",
    is_default: false,
    follower_count: 16,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
  },
];

const FOLLOWER_TAGS = [
  ["VIP", "Loyal"],
  ["New"],
  ["At Risk"],
  ["Promo Opt-In", "Beauty"],
  ["Fashion"],
  ["Home", "Repeat Buyer"],
];

function buildMockFollowers(): Follower[] {
  const statuses: Follower["follow_status"][] = ["following", "following", "following", "unfollowed", "blocked"];

  return Array.from({ length: 50 }, (_, index) => {
    const oa = MOCK_LINE_OAS[index % MOCK_LINE_OAS.length];
    const day = String((index % 28) + 1).padStart(2, "0");

    return {
      id: `follower-${index + 1}`,
      workspace_id: WORKSPACE_ID,
      line_oa_id: oa.id,
      line_user_id: `U${String(index + 1).padStart(10, "0")}`,
      display_name: `Follower ${String(index + 1).padStart(2, "0")}`,
      picture_url: "",
      status_message: "BOLA customer",
      language: "th",
      follow_status: statuses[index % statuses.length],
      email: `follower${index + 1}@bola.local`,
      phone: `081234${String(index + 1).padStart(4, "0")}`,
      note: `Mock contact ${index + 1}`,
      tags: FOLLOWER_TAGS[index % FOLLOWER_TAGS.length],
      custom_fields: {
        tier: index % 4 === 0 ? "Gold" : "Standard",
      },
      followed_at: `2026-03-${day}T09:00:00.000Z`,
      created_at: `2026-03-${day}T09:00:00.000Z`,
      updated_at: `2026-04-${day}T09:00:00.000Z`,
    };
  });
}

const MOCK_FOLLOWERS = buildMockFollowers();

export function ContactsPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("followers");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState<string>("followed_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [filterValue, setFilterValue] = useState<FilterBarValue>({
    search: "",
    filters: {
      lineOa: "",
    },
  });

  const filterOptions = useMemo(
    () => MOCK_LINE_OAS.map((oa) => ({ label: oa.name, value: oa.id })),
    [],
  );

  const filteredFollowers = useMemo(() => {
    const search = filterValue.search.trim().toLowerCase();
    const lineOaId = typeof filterValue.filters.lineOa === "string" ? filterValue.filters.lineOa : "";

    return MOCK_FOLLOWERS.filter((follower) => {
      const matchesLineOa = !lineOaId || follower.line_oa_id === lineOaId;
      const matchesSearch = !search
        || follower.display_name.toLowerCase().includes(search)
        || follower.email.toLowerCase().includes(search)
        || follower.phone.toLowerCase().includes(search)
        || follower.line_user_id.toLowerCase().includes(search);

      return matchesLineOa && matchesSearch;
    });
  }, [filterValue]);

  const sortedFollowers = useMemo(() => {
    const rows = [...filteredFollowers];

    rows.sort((a, b) => {
      const left = a[sortBy as keyof Follower];
      const right = b[sortBy as keyof Follower];

      if (left == null) return 1;
      if (right == null) return -1;

      const result = typeof left === "string" && typeof right === "string"
        ? left.localeCompare(right)
        : String(left).localeCompare(String(right));

      return sortOrder === "asc" ? result : -result;
    });

    return rows;
  }, [filteredFollowers, sortBy, sortOrder]);

  const pagedFollowers = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedFollowers.slice(start, start + pageSize);
  }, [sortedFollowers, page, pageSize]);

  const followerColumns = useMemo<AdvancedColumn<Follower>[]>(() => [
    {
      key: "display_name",
      header: "Contact",
      sortable: true,
      render: (value: string, row) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-50 text-sky-600">
            <span className="text-sm font-semibold">{value?.[0]?.toUpperCase() ?? "?"}</span>
          </div>
          <div className="min-w-0">
            <div className="truncate font-semibold text-[var(--foreground)]">{value}</div>
            <div className="truncate text-sm text-[var(--muted-foreground)]">
              {maskPhone(row.phone)} | {row.email}
            </div>
            <div className="mt-1 flex flex-wrap gap-2">
              {row.tags.slice(0, 2).map((tag) => (
                <Badge key={tag} variant="outline" size="sm">{tag}</Badge>
              ))}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "line_oa_id",
      header: "LINE OA",
      sortable: true,
      render: (value: string) => {
        const lineOA = MOCK_LINE_OAS.find((oa) => oa.id === value);

        return lineOA ? (
          <div className="space-y-1">
            <div className="font-medium text-[var(--foreground)]">{lineOA.name}</div>
            <div className="text-sm text-[var(--muted-foreground)]">{lineOA.basic_id}</div>
          </div>
        ) : "-";
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
  ], []);

  return (
    <AppLayout title="Contacts">
      <div className="space-y-6 p-4 sm:p-6">
        <PageHeader
          title="Contacts"
          subtitle="Mock preview for DS-first contact management. All Followers uses AdvancedDataTable, and Phone uses EmptyState."
          breadcrumb={<Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Contacts" }]} />}
          actions={(
            <a
              href={`${(import.meta.env.VITE_API_URL || "").replace(/\/$/, "")}/v1/contacts/swagger`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <DSButton variant="ghost" leftIcon={<BookOpen size={16} />}>API Docs</DSButton>
            </a>
          )}
        />

        <Card elevation="none">
          <CardBody>
            <div className="space-y-5">
              <Tabs
                tabs={[
                  { id: "followers", label: "All Followers", badge: "50", icon: <Users size={16} /> },
                  { id: "phone_only", label: "Phone", badge: "0", icon: <Phone size={16} /> },
                ]}
                activeTab={activeTab}
                onChange={(id) => {
                  setActiveTab(id as ActiveTab);
                  setPage(1);
                }}
                variant="underline"
                size="md"
              />

              {activeTab === "followers" ? (
                <div className="space-y-4">
                  <FilterBar
                    showSearch
                    searchPlaceholder="Search mock followers by name, email, phone, or LINE user id..."
                    filters={[
                      {
                        key: "lineOa",
                        label: "LINE OA",
                        type: "single",
                        options: [{ label: "All LINE OAs", value: "" }, ...filterOptions],
                      },
                    ]}
                    value={filterValue}
                    onFilterChange={(value) => {
                      setFilterValue(value);
                      setPage(1);
                    }}
                  />

                  <AdvancedDataTable
                    rowKey="id"
                    columns={followerColumns}
                    data={pagedFollowers}
                    pagination={{ page, pageSize, totalCount: sortedFollowers.length }}
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
                    emptyMessage="No followers found"
                    emptyDescription="Try adjusting your search or LINE OA filter."
                    showColumnToggle
                    stickyHeader
                  />
                </div>
              ) : (
                <EmptyState
                  icon={<Phone size={48} />}
                  title="No phone contacts yet"
                  description="Phone is intentionally mocked as empty. This tab is ready for the future import and matching flow."
                  action={<DSButton variant="secondary" leftIcon={<Phone size={16} />}>0 phone contacts</DSButton>}
                />
              )}
            </div>
          </CardBody>
        </Card>
      </div>
    </AppLayout>
  );
}
