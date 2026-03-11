import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
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
import { LayoutTemplate, Copy, Trash2, Plus, List, LayoutGrid, RefreshCw, Send, Star } from "lucide-react";
import type { RichMenu, LineOA } from "@/types";
import { richMenuApi } from "@/api/richMenu";
import { lineOAApi } from "@/api/lineOA";
import { useToast } from "@/components/ui/toast";
import { LineOAFilter } from "@/components/common/LineOAFilter";
import { oaLabel } from "@/lib/lineOAUtils";

const WORKSPACE_ID = "00000000-0000-0000-0000-000000000001";

/**
 * Status rules:
 *  - Expired:   published_at set  AND  ends_at < now
 *  - Published: published_at set  AND  (no ends_at OR ends_at >= now)
 *  - Scheduled: no published_at   AND  starts_at set  → will be auto-published by scheduler
 *  - Draft:     no published_at   AND  no starts_at   → just saved, not yet published
 */
function getMenuStatus(menu: RichMenu): { label: string; colorClass: string } {
  const now = new Date();
  if (menu.published_at) {
    if (menu.ends_at && new Date(menu.ends_at) < now) {
      return { label: "Expired", colorClass: "bg-gray-400" };
    }
    return { label: "Published", colorClass: "bg-green-500" };
  }
  if (menu.starts_at) {
    return { label: "Scheduled", colorClass: "bg-blue-500" };
  }
  return { label: "Draft", colorClass: "bg-yellow-500" };
}

function formatDateRange(menu: RichMenu): string {
  if (!menu.starts_at && !menu.ends_at) return "Always Active";
  const start = menu.starts_at ? new Date(menu.starts_at).toLocaleDateString() : "Now";
  const end = menu.ends_at ? new Date(menu.ends_at).toLocaleDateString() : "Forever";
  return `${start} – ${end}`;
}

interface RowProps {
  menu: RichMenu;
  onDuplicate: (m: RichMenu) => void;
  onDelete: (id: string) => void;
  onPublish: (m: RichMenu) => void;
  onSetDefault: (m: RichMenu) => void;
  duplicating: boolean;
  publishing: boolean;
  settingDefault: boolean;
  isDefault?: boolean;
}

function TimelineRow({ menu, onDuplicate, onDelete, onPublish, onSetDefault, duplicating, publishing, settingDefault, isDefault }: RowProps) {
  const status = getMenuStatus(menu);
  const dateRange = formatDateRange(menu);
  const isPublished = !!menu.published_at;
  return (
    <div
      className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 cursor-pointer group"
      onClick={() => { window.location.href = `/rich-menus/${menu.id}`; }}
    >
      <div className={`w-2 h-10 rounded-full flex-shrink-0 ${isDefault ? "bg-blue-500" : status.colorClass}`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium truncate">{menu.name}</span>
          {isDefault && (
            <Badge variant="outline" className="text-blue-600 border-blue-300 text-xs">
              Default
            </Badge>
          )}
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium text-white ${status.colorClass}`}>
            {status.label}
          </span>
        </div>
        <div className="text-xs text-muted-foreground mt-0.5">
          {dateRange} · {menu.pages?.length || 0} page{(menu.pages?.length || 0) !== 1 ? "s" : ""}
        </div>
      </div>
      <div
        className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => e.stopPropagation()}
      >
        {!isPublished && (
          <Button
            variant="ghost"
            size="sm"
            disabled={publishing}
            onClick={() => onPublish(menu)}
            title="Publish to LINE"
            className="text-green-600 hover:text-green-700"
          >
            {publishing ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
          </Button>
        )}
        {isPublished && !isDefault && (
          <Button
            variant="ghost"
            size="sm"
            disabled={settingDefault}
            onClick={() => onSetDefault(menu)}
            title="Set as Default"
            className="text-blue-600 hover:text-blue-700"
          >
            {settingDefault ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Star className="h-3 w-3" />}
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          disabled={duplicating}
          onClick={() => onDuplicate(menu)}
          title="Duplicate"
        >
          <Copy className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(menu.id)}
          title="Delete"
        >
          <Trash2 className="h-3 w-3 text-destructive" />
        </Button>
      </div>
    </div>
  );
}

interface CardProps {
  menu: RichMenu;
  onDuplicate: (m: RichMenu) => void;
  onDelete: (id: string) => void;
  onPublish: (m: RichMenu) => void;
  onSetDefault: (m: RichMenu) => void;
  duplicating: boolean;
  publishing: boolean;
  settingDefault: boolean;
}

function MenuCard({ menu, onDuplicate, onDelete, onPublish, onSetDefault, duplicating, publishing, settingDefault }: CardProps) {
  const status = getMenuStatus(menu);
  const isPublished = !!menu.published_at;
  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => { window.location.href = `/rich-menus/${menu.id}`; }}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base truncate">{menu.name}</CardTitle>
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium text-white flex-shrink-0 ${status.colorClass}`}>
            {status.label}
          </span>
        </div>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground space-y-1">
        <div>{formatDateRange(menu)}</div>
        <div>
          {menu.size_type === "large" ? "Large" : "Compact"} · {menu.pages?.length || 0} page{(menu.pages?.length || 0) !== 1 ? "s" : ""}
        </div>
        {menu.is_default && (
          <Badge variant="outline" className="text-blue-600 border-blue-300 text-xs">
            Default
          </Badge>
        )}
        <div className="flex gap-1 mt-3 flex-wrap" onClick={(e) => e.stopPropagation()}>
          {!isPublished && (
            <Button
              variant="outline"
              size="sm"
              disabled={publishing}
              onClick={() => onPublish(menu)}
              className="text-green-600 border-green-300 hover:bg-green-50"
            >
              {publishing ? <RefreshCw className="h-3 w-3 mr-1 animate-spin" /> : <Send className="h-3 w-3 mr-1" />}
              Publish
            </Button>
          )}
          {isPublished && !menu.is_default && (
            <Button
              variant="outline"
              size="sm"
              disabled={settingDefault}
              onClick={() => onSetDefault(menu)}
              className="text-blue-600 border-blue-300 hover:bg-blue-50"
            >
              {settingDefault ? <RefreshCw className="h-3 w-3 mr-1 animate-spin" /> : <Star className="h-3 w-3 mr-1" />}
              Set Default
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            disabled={duplicating}
            onClick={() => onDuplicate(menu)}
          >
            <Copy className="h-3 w-3 mr-1" />
            Copy
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(menu.id)}
          >
            <Trash2 className="h-3 w-3 mr-1 text-destructive" />
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function RichMenusPage() {
  const toast = useToast();
  const [lineOAs, setLineOAs] = useState<LineOA[]>([]);
  const [selectedOA, setSelectedOA] = useState<string>("");
  const [menus, setMenus] = useState<RichMenu[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"timeline" | "grid">("timeline");
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newSizeType, setNewSizeType] = useState<"large" | "compact">("large");
  const [newMenuType, setNewMenuType] = useState<"static" | "dynamic">("static");
  const [newLineOAId, setNewLineOAId] = useState("");
  const [creating, setCreating] = useState(false);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [settingDefaultId, setSettingDefaultId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string; isPublished: boolean } | null>(null);

  useEffect(() => {
    lineOAApi.list({ workspace_id: WORKSPACE_ID })
      .then((res) => {
        const oas: LineOA[] = res.data || [];
        setLineOAs(oas);
        if (oas.length > 0) setSelectedOA(oas[0].id);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedOA) return;
    setLoading(true);
    setError(null);
    richMenuApi
      .list(selectedOA)
      .then((res) => setMenus(res.data || []))
      .catch((e: Error) => {
        setError(e.message);
        setMenus([]);
      })
      .finally(() => setLoading(false));
  }, [selectedOA]);

  const handleCreate = async () => {
    if (!newName.trim() || !newLineOAId) return;
    setCreating(true);
    try {
      const rm = await richMenuApi.create({
        name: newName.trim(),
        description: newDescription.trim(),
        line_oa_id: newLineOAId,
        workspace_id: lineOAs.find((o) => o.id === newLineOAId)?.workspace_id ?? "",
        size_type: newSizeType,
        menu_type: newMenuType,
      });
      setShowNewDialog(false);
      setNewName("");
      setNewDescription("");
      setNewSizeType("large");
      setNewMenuType("static");
      setNewLineOAId("");
      window.location.href = `/rich-menus/${rm.id}`;
    } catch (e: unknown) {
      toast.error("Failed to create menu", e instanceof Error ? e.message : "An unexpected error occurred.");
    } finally {
      setCreating(false);
    }
  };

  const handleDuplicate = async (menu: RichMenu) => {
    setDuplicatingId(menu.id);
    try {
      const copy = await richMenuApi.duplicate(menu.id, menu.line_oa_id);
      window.location.href = `/rich-menus/${copy.id}`;
    } catch (e: unknown) {
      toast.error("Failed to duplicate menu", e instanceof Error ? e.message : "An unexpected error occurred.");
    } finally {
      setDuplicatingId(null);
    }
  };

  const handleDelete = (id: string) => {
    const menu = menus.find((m) => m.id === id);
    if (!menu) return;
    setDeleteTarget({ id, name: menu.name, isPublished: !!menu.published_at });
  };

  const handleConfirmedDelete = async (id: string) => {
    try {
      await richMenuApi.delete(id);
      setMenus((prev) => prev.filter((m) => m.id !== id));
      toast.success("Menu deleted");
    } catch (e: unknown) {
      toast.error("Failed to delete menu", e instanceof Error ? e.message : "An unexpected error occurred.");
    }
  };

  const handlePublish = async (menu: RichMenu) => {
    setPublishingId(menu.id);
    try {
      const updated = await richMenuApi.publish(menu.id);
      setMenus((prev) => prev.map((m) => (m.id === menu.id ? updated : m)));
      if (!updated.is_default) {
        toast.warning(
          "Published — but not visible yet!",
          `"${menu.name}" was uploaded to LINE. Click ★ Set as Default so followers can see it.`
        );
      } else {
        toast.success("Published & visible to followers ✓", `"${menu.name}" is now showing.`);
      }
    } catch (e: unknown) {
      toast.error("Publish failed", e instanceof Error ? e.message : "An unexpected error occurred.");
    } finally {
      setPublishingId(null);
    }
  };

  const handleSetDefault = async (menu: RichMenu) => {
    setSettingDefaultId(menu.id);
    try {
      const updated = await richMenuApi.setDefault(menu.id);
      // Mark all others as non-default, update the one that changed
      setMenus((prev) => prev.map((m) => (m.id === menu.id ? updated : { ...m, is_default: false })));
      toast.success("Set as default", `"${menu.name}" is now the default rich menu.`);
    } catch (e: unknown) {
      toast.error("Failed to set default", e instanceof Error ? e.message : "An unexpected error occurred.");
    } finally {
      setSettingDefaultId(null);
    }
  };

  // Only the first is_default menu is treated as the active default; extras are shown as regular
  // menus (data inconsistency guard — backend should only allow one default at a time).
  const defaultMenu = menus.find((m) => m.is_default);
  const nonDefaultMenus = menus.filter((m) => m !== defaultMenu);
  const scheduledMenus = nonDefaultMenus.filter((m) => m.starts_at || m.ends_at);
  const alwaysOnMenus = nonDefaultMenus.filter((m) => !m.starts_at && !m.ends_at);

  return (
    <AppLayout title="Rich Menus">
      <div className="space-y-4">
        {/* Controls bar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "timeline" | "grid")}>
              <TabsList>
                <TabsTrigger value="timeline">
                  <List className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Timeline</span>
                </TabsTrigger>
                <TabsTrigger value="grid">
                  <LayoutGrid className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Grid</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <Button
              variant="outline"
              size="sm"
              onClick={() => { window.location.href = "/rich-menus/assignments"; }}
            >
              <span className="hidden sm:inline">Assignment Rules</span>
              <span className="sm:hidden">Assignments</span>
            </Button>
          </div>
          <Button className="self-start sm:self-auto" onClick={() => setShowNewDialog(true)}>
            <Plus className="h-4 w-4 mr-1" />
            New Menu
          </Button>
        </div>

        {/* LINE OA Filter */}
        <LineOAFilter
          lineOAs={lineOAs}
          selectedId={selectedOA}
          onChange={setSelectedOA}
          showAll={false}
        />

        {/* Body */}
        {!selectedOA ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Select a LINE OA to view rich menus
            </CardContent>
          </Card>
        ) : loading ? (
          <Card>
            <CardContent className="py-12 flex items-center justify-center gap-2 text-muted-foreground">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Loading...
            </CardContent>
          </Card>
        ) : error ? (
          <Card>
            <CardContent className="py-12 text-center text-destructive">
              {error}
            </CardContent>
          </Card>
        ) : menus.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <LayoutTemplate className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No rich menus yet</p>
              <p className="text-sm mt-1">Create your first rich menu to set up an interactive menu in LINE.</p>
              <Button className="mt-4" onClick={() => setShowNewDialog(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Create First Menu
              </Button>
            </CardContent>
          </Card>
        ) : viewMode === "timeline" ? (
          <div className="space-y-2">
            {defaultMenu && (
              <TimelineRow
                key={defaultMenu.id}
                menu={defaultMenu}
                onDuplicate={handleDuplicate}
                onDelete={handleDelete}
                onPublish={handlePublish}
                onSetDefault={handleSetDefault}
                duplicating={duplicatingId === defaultMenu.id}
                publishing={publishingId === defaultMenu.id}
                settingDefault={settingDefaultId === defaultMenu.id}
                isDefault
              />
            )}
            {alwaysOnMenus.map((m) => (
              <TimelineRow
                key={m.id}
                menu={m}
                onDuplicate={handleDuplicate}
                onDelete={handleDelete}
                onPublish={handlePublish}
                onSetDefault={handleSetDefault}
                duplicating={duplicatingId === m.id}
                publishing={publishingId === m.id}
                settingDefault={settingDefaultId === m.id}
              />
            ))}
            {scheduledMenus.length > 0 && (
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mt-4 mb-2 px-1">
                Scheduled
              </div>
            )}
            {scheduledMenus.map((m) => (
              <TimelineRow
                key={m.id}
                menu={m}
                onDuplicate={handleDuplicate}
                onDelete={handleDelete}
                onPublish={handlePublish}
                onSetDefault={handleSetDefault}
                duplicating={duplicatingId === m.id}
                publishing={publishingId === m.id}
                settingDefault={settingDefaultId === m.id}
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {menus.map((m) => (
              <MenuCard
                key={m.id}
                menu={m}
                onDuplicate={handleDuplicate}
                onDelete={handleDelete}
                onPublish={handlePublish}
                onSetDefault={handleSetDefault}
                duplicating={duplicatingId === m.id}
                publishing={publishingId === m.id}
                settingDefault={settingDefaultId === m.id}
              />
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการลบ</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.isPublished
                ? `Rich Menu นี้กำลังใช้งานอยู่ การลบจะทำให้ผู้ติดตามไม่เห็น Rich Menu ทันที คุณต้องการลบ "${deleteTarget?.name}" ใช่หรือไม่?`
                : `คุณต้องการลบ "${deleteTarget?.name}" ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => { handleConfirmedDelete(deleteTarget!.id); setDeleteTarget(null); }}
            >
              ลบ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* New Menu Dialog */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent className="w-full sm:max-w-2xl p-4 sm:p-8">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-2xl">Create New Rich Menu</DialogTitle>
            <p className="text-sm text-muted-foreground mt-2">Design interactive menu experiences for your LINE OA</p>
          </DialogHeader>

          <div className="space-y-6 py-2">
            {/* LINE OA Selector */}
            <div className="space-y-2">
              <Label htmlFor="dialog-oa-select" className="font-semibold">Select LINE OA *</Label>
              <Select value={newLineOAId} onValueChange={setNewLineOAId}>
                <SelectTrigger id="dialog-oa-select" className="w-full">
                  <SelectValue>
                    {newLineOAId
                      ? (lineOAs.find((o) => o.id === newLineOAId) ? oaLabel(lineOAs.find((o) => o.id === newLineOAId)!) : newLineOAId.slice(0, 12))
                      : <span className="text-muted-foreground">Choose a LINE OA...</span>}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {lineOAs.map((oa) => (
                    <SelectItem key={oa.id} value={oa.id}>
                      {oaLabel(oa)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Menu Name */}
            <div className="space-y-2">
              <Label htmlFor="dialog-name" className="font-semibold">Menu Name *</Label>
              <Input
                id="dialog-name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Main Menu, Support Menu"
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                autoFocus
                className="text-base"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="dialog-desc" className="text-sm">Description</Label>
              <Input
                id="dialog-desc"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Optional description for internal reference"
                className="text-sm text-muted-foreground"
              />
            </div>

            {/* Size Type & Menu Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dialog-size" className="text-sm font-semibold">Size</Label>
                <Select value={newSizeType} onValueChange={(v) => setNewSizeType(v as "large" | "compact")}>
                  <SelectTrigger id="dialog-size">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="large">Large</SelectItem>
                    <SelectItem value="compact">Compact</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dialog-type" className="text-sm font-semibold">Type</Label>
                <Select value={newMenuType} onValueChange={(v) => setNewMenuType(v as "static" | "dynamic")}>
                  <SelectTrigger id="dialog-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="static">Static</SelectItem>
                    <SelectItem value="dynamic">Dynamic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowNewDialog(false);
                setNewName("");
                setNewDescription("");
                setNewSizeType("large");
                setNewMenuType("static");
                setNewLineOAId("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!newName.trim() || !newLineOAId || creating}
              className="bg-green-600 hover:bg-green-700"
            >
              {creating ? "Creating..." : "Create Menu"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
