import React from "react";
import { Card, CardBody, DSInput, EmptyState, Pagination, Spinner } from "@uxuissk/design-system";
import { cn } from "@/lib/utils";

export interface AdvancedColumn<T> {
  key: keyof T | string;
  header: React.ReactNode;
  sortable?: boolean;
  align?: "left" | "center" | "right";
  render?: (value: unknown, row: T) => React.ReactNode;
}

export interface FilterOption {
  label: string;
  value: string;
}

export interface FilterBarDefinition {
  key: string;
  label: string;
  type?: "single";
  options: FilterOption[];
}

export interface FilterBarValue {
  search?: string;
  filters: Record<string, string>;
}

interface FeaturePageScaffoldProps {
  layout?: "list" | "detail" | "settings" | "wizard" | "dashboard" | "form" | "report";
  header?: React.ReactNode;
  filters?: React.ReactNode;
  stats?: React.ReactNode;
  kpis?: React.ReactNode;
  content?: React.ReactNode;
  table?: React.ReactNode;
  charts?: React.ReactNode;
  primaryChart?: React.ReactNode;
  secondaryCharts?: React.ReactNode;
  main?: React.ReactNode;
  aside?: React.ReactNode;
  form?: React.ReactNode;
  actions?: React.ReactNode;
}

export function FeaturePageScaffold({
  layout = "list",
  header,
  filters,
  stats,
  kpis,
  content,
  table,
  charts,
  primaryChart,
  secondaryCharts,
  main,
  aside,
  form,
  actions,
}: FeaturePageScaffoldProps) {
  const topStats = stats || kpis;

  return (
    <div className="space-y-[var(--Spacing--Spacing-6xl)]">
      {header}
      {filters}
      {topStats}

      {layout === "detail" && (main || aside) && (
        <div className="grid gap-[var(--Spacing--Spacing-5xl)] xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-[var(--Spacing--Spacing-5xl)]">{main || content || table}</div>
          {aside ? <aside className="space-y-[var(--Spacing--Spacing-5xl)]">{aside}</aside> : null}
        </div>
      )}

      {layout === "dashboard" && (primaryChart || secondaryCharts) && (
        <div className="grid gap-[var(--Spacing--Spacing-5xl)] xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
          <div className="space-y-[var(--Spacing--Spacing-5xl)]">{primaryChart}</div>
          <div className="space-y-[var(--Spacing--Spacing-5xl)]">{secondaryCharts}</div>
        </div>
      )}

      {charts}
      {content}
      {table}
      {form}
      {actions}
    </div>
  );
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumb?: React.ReactNode;
  actions?: React.ReactNode;
}

export function PageHeader({ title, subtitle, breadcrumb, actions }: PageHeaderProps) {
  return (
    <div className="space-y-[var(--Spacing--Spacing-3xl)]">
      {breadcrumb}
      <div className="flex flex-col gap-[var(--Spacing--Spacing-3xl)] md:flex-row md:items-start md:justify-between">
        <div className="space-y-[var(--Spacing--Spacing-lg)]">
          <h2 className="font-[var(--font-h2)] text-[var(--text-h2)] font-normal leading-[1.15] text-[var(--Colors--Text--text-primary)]">
            {title}
          </h2>
          {subtitle ? (
            <p className="max-w-3xl text-[var(--text-caption)] leading-6 text-[var(--Colors--Text--text-secondary)]">
              {subtitle}
            </p>
          ) : null}
        </div>
        {actions ? <div className="flex shrink-0 items-center gap-[var(--Spacing--Spacing-lg)]">{actions}</div> : null}
      </div>
    </div>
  );
}

interface ChoiceCardGroupProps {
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg";
}

interface ChoiceCardInternalProps {
  selected?: boolean;
  onSelect?: () => void;
}

export function ChoiceCardGroup({ value, onChange, className, children }: ChoiceCardGroupProps) {
  return (
    <div className={cn("grid gap-[var(--Spacing--Spacing-3xl)]", className)} role="radiogroup">
      {React.Children.map(children, (child) => {
        if (!React.isValidElement<{ value: string }>(child)) return child;
        return React.cloneElement(child as React.ReactElement<ChoiceCardInternalProps & { value: string }>, {
          selected: child.props.value === value,
          onSelect: () => onChange?.(child.props.value),
        });
      })}
    </div>
  );
}

interface ChoiceCardProps extends ChoiceCardInternalProps {
  value: string;
  title: string;
  description?: string;
  icon?: React.ReactNode;
}

export function ChoiceCard({ title, description, icon, selected, onSelect }: ChoiceCardProps) {
  return (
    <button type="button" onClick={onSelect} className="w-full text-left">
      <Card
        hover
        elevation="none"
        className={cn(
          "h-full border-[var(--Colors--Stroke--stroke-primary)] bg-[var(--Colors--Background--bg-primary)] transition-colors",
          selected && "border-[var(--Colors--Stroke--stroke-brand-solid)] bg-[var(--Colors--Background--bg-brand-primary)]",
        )}
      >
        <CardBody>
          <div className="flex items-start justify-between gap-[var(--Spacing--Spacing-3xl)]">
            <div className="space-y-[var(--Spacing--Spacing-lg)]">
              <div className="text-[var(--text-label)] text-[var(--Colors--Text--text-primary)]">{title}</div>
              <div className="text-[var(--text-h4)] font-medium text-[var(--Colors--Text--text-primary)]">{description}</div>
            </div>
            {icon ? (
              <div className="flex h-10 w-10 items-center justify-center rounded-[var(--Border-radius--radius-xl)] bg-[var(--Colors--Background--bg-brand-primary)] text-[var(--Colors--Text--text-brand-primary)]">
                {icon}
              </div>
            ) : null}
          </div>
        </CardBody>
      </Card>
    </button>
  );
}

interface FilterBarProps {
  showSearch?: boolean;
  searchPlaceholder?: string;
  filters?: FilterBarDefinition[];
  value: FilterBarValue;
  onFilterChange: (value: FilterBarValue) => void;
}

export function FilterBar({ showSearch, searchPlaceholder, filters = [], value, onFilterChange }: FilterBarProps) {
  return (
    <Card elevation="none">
      <CardBody>
        <div className="flex flex-col gap-[var(--Spacing--Spacing-3xl)] lg:flex-row lg:items-end">
          {showSearch ? (
            <div className="min-w-0 flex-1">
              <DSInput
                label="Search"
                placeholder={searchPlaceholder}
                value={value.search ?? ""}
                onChange={(event) => onFilterChange({ ...value, search: event.target.value })}
                fullWidth
              />
            </div>
          ) : null}

          {filters.map((filter) => (
            <label key={filter.key} className="flex min-w-[220px] flex-col gap-[var(--Spacing--Spacing-sm)]">
              <span className="text-[var(--text-caption)] text-[var(--Colors--Text--text-secondary)]">{filter.label}</span>
              <select
                className="h-10 rounded-[var(--Border-radius--radius-md)] border border-[var(--Colors--Stroke--stroke-primary)] bg-[var(--Colors--Background--bg-primary)] px-[var(--Spacing--Spacing-lg)] text-[var(--text-caption)] text-[var(--Colors--Text--text-primary)]"
                value={value.filters[filter.key] ?? ""}
                onChange={(event) =>
                  onFilterChange({
                    ...value,
                    filters: {
                      ...value.filters,
                      [filter.key]: event.target.value,
                    },
                  })
                }
              >
                {filter.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}

interface AdvancedDataTableProps<T> {
  rowKey: keyof T | string;
  columns: AdvancedColumn<T>[];
  data: T[];
  loading?: boolean;
  error?: string;
  emptyMessage?: string;
  emptyDescription?: string;
  pagination?: {
    page: number;
    pageSize: number;
    totalCount: number;
  };
  onPageChange?: (page: number, pageSize: number) => void;
  onSortChange?: (sortBy: string, sortOrder: "asc" | "desc") => void;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  onRowClick?: (row: T) => void;
  stickyHeader?: boolean;
  showColumnToggle?: boolean;
}

function getCellAlignment(align?: "left" | "center" | "right") {
  if (align === "center") return "text-center";
  if (align === "right") return "text-right";
  return "text-left";
}

export function AdvancedDataTable<T extends Record<string, unknown>>({
  rowKey,
  columns,
  data,
  loading,
  error,
  emptyMessage,
  emptyDescription,
  pagination,
  onPageChange,
  onSortChange,
  sortBy,
  sortOrder,
  onRowClick,
  stickyHeader,
}: AdvancedDataTableProps<T>) {
  if (error) {
    return (
      <Card elevation="none">
        <CardBody>
          <EmptyState title={emptyMessage || "Unable to load data"} description={error} />
        </CardBody>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card elevation="none">
        <CardBody>
          <div className="flex min-h-[220px] items-center justify-center">
            <Spinner />
          </div>
        </CardBody>
      </Card>
    );
  }

  if (!data.length) {
    return (
      <Card elevation="none">
        <CardBody>
          <EmptyState
            title={emptyMessage || "No data found"}
            description={emptyDescription || "There is no data to display right now."}
          />
        </CardBody>
      </Card>
    );
  }

  return (
    <Card elevation="none">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-[var(--Colors--Stroke--stroke-primary)]">
          <thead className={cn("bg-[var(--Colors--Background--bg-quaternary)]", stickyHeader && "sticky top-0 z-10")}>
            <tr>
              {columns.map((column) => {
                const key = String(column.key);
                const isActiveSort = sortBy === key;
                return (
                  <th
                    key={key}
                    className={cn(
                      "px-[var(--Spacing--Spacing-3xl)] py-[var(--Spacing--Spacing-2xl)] text-[var(--text-caption)] font-semibold text-[var(--Colors--Text--text-secondary)]",
                      getCellAlignment(column.align),
                    )}
                  >
                    {column.sortable ? (
                      <button
                        type="button"
                        className="inline-flex items-center gap-[var(--Spacing--Spacing-sm)]"
                        onClick={() => onSortChange?.(key, isActiveSort && sortOrder === "asc" ? "desc" : "asc")}
                      >
                        <span>{column.header}</span>
                        <span className="text-[var(--Colors--Text--text-brand-primary)]">
                          {isActiveSort ? (sortOrder === "asc" ? "↑" : "↓") : "↕"}
                        </span>
                      </button>
                    ) : (
                      column.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--Colors--Stroke--stroke-primary)] bg-[var(--Colors--Background--bg-primary)]">
            {data.map((row) => {
              const rowId = String(row[rowKey as keyof T] ?? "");
              return (
                <tr
                  key={rowId}
                  className={cn(onRowClick && "cursor-pointer hover:bg-[var(--Colors--Background--bg-primary_hover)]")}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((column) => {
                    const key = String(column.key);
                    const value = row[column.key as keyof T];
                    return (
                      <td
                        key={key}
                        className={cn(
                          "px-[var(--Spacing--Spacing-3xl)] py-[var(--Spacing--Spacing-3xl)] align-top text-[var(--text-caption)] text-[var(--Colors--Text--text-primary)]",
                          getCellAlignment(column.align),
                        )}
                      >
                        {column.render ? column.render(value, row) : String(value ?? "-")}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {pagination && onPageChange ? (
        <div className="border-t border-[var(--Colors--Stroke--stroke-primary)] px-[var(--Spacing--Spacing-3xl)] py-[var(--Spacing--Spacing-3xl)]">
          <Pagination
            currentPage={pagination.page}
            totalPages={Math.max(1, Math.ceil(pagination.totalCount / pagination.pageSize))}
            onPageChange={(nextPage) => onPageChange(nextPage, pagination.pageSize)}
          />
        </div>
      ) : null}
    </Card>
  );
}

interface BarChartDatum {
  label: string;
  value: number;
}

interface BarChartProps {
  series: Array<{
    name: string;
    data: BarChartDatum[];
  }>;
}

export function BarChart({ series }: BarChartProps) {
  const points = series[0]?.data ?? [];
  const max = Math.max(...points.map((point) => point.value), 1);

  return (
    <div className="space-y-[var(--Spacing--Spacing-3xl)]">
      {points.map((point) => (
        <div key={point.label} className="space-y-[var(--Spacing--Spacing-sm)]">
          <div className="flex items-center justify-between gap-[var(--Spacing--Spacing-lg)] text-[var(--text-caption)]">
            <span className="truncate text-[var(--Colors--Text--text-primary)]">{point.label}</span>
            <span className="text-[var(--Colors--Text--text-secondary)]">{point.value.toLocaleString()}</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-[var(--Colors--Background--bg-secondary)]">
            <div
              className="h-full rounded-full bg-[var(--Colors--Background--bg-brand-solid)]"
              style={{ width: `${(point.value / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

interface DonutChartProps {
  data: Array<{ label: string; value: number; color?: string }>;
  centerLabel?: string;
  centerValue?: string;
}

export function DonutChart({ data, centerLabel, centerValue }: DonutChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0) || 1;
  let startAngle = 0;

  const circles = data.map((item, index) => {
    const dash = (item.value / total) * 282.743;
    const circle = (
      <circle
        key={item.label}
        cx="60"
        cy="60"
        r="45"
        fill="none"
        stroke={item.color || ["#32a9ff", "#059669", "#d97706", "#e11d48"][index % 4]}
        strokeWidth="12"
        strokeDasharray={`${dash} 282.743`}
        strokeDashoffset={-startAngle}
        transform="rotate(-90 60 60)"
      />
    );
    startAngle += dash;
    return circle;
  });

  return (
    <div className="flex flex-col items-center gap-[var(--Spacing--Spacing-3xl)] lg:flex-row lg:items-start">
      <svg viewBox="0 0 120 120" className="h-44 w-44">
        <circle cx="60" cy="60" r="45" fill="none" stroke="var(--Colors--Background--bg-secondary)" strokeWidth="12" />
        {circles}
        <text x="60" y="56" textAnchor="middle" className="fill-[var(--Colors--Text--text-secondary)] text-[10px]">
          {centerLabel}
        </text>
        <text x="60" y="72" textAnchor="middle" className="fill-[var(--Colors--Text--text-primary)] text-[14px] font-semibold">
          {centerValue}
        </text>
      </svg>
      <div className="w-full space-y-[var(--Spacing--Spacing-lg)]">
        {data.map((item, index) => (
          <div key={item.label} className="flex items-center justify-between gap-[var(--Spacing--Spacing-lg)] text-[var(--text-caption)]">
            <div className="flex items-center gap-[var(--Spacing--Spacing-sm)]">
              <span
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: item.color || ["#32a9ff", "#059669", "#d97706", "#e11d48"][index % 4] }}
              />
              <span className="text-[var(--Colors--Text--text-primary)]">{item.label}</span>
            </div>
            <span className="text-[var(--Colors--Text--text-secondary)]">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
