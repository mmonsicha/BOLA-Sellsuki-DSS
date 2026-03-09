import { useReducer, useEffect, useRef, useCallback, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { RefreshCw, Plus, Trash2, Eye, Edit3, Upload, Check, Star } from "lucide-react";
import type { RichMenu, RichMenuPage, RichMenuPageArea } from "@/types";
import { richMenuApi, richMenuPageApi, richMenuAreaApi } from "@/api/richMenu";
import { useToast } from "@/components/ui/toast";

// ---- Constants ----
const LINE_LARGE_WIDTH = 2500;
const LINE_LARGE_HEIGHT = 1686;
const LINE_COMPACT_HEIGHT = 843;
const AREA_COLORS = [
  "rgba(59,130,246,0.35)",
  "rgba(16,185,129,0.35)",
  "rgba(245,158,11,0.35)",
  "rgba(239,68,68,0.35)",
  "rgba(139,92,246,0.35)",
  "rgba(236,72,153,0.35)",
];
const AREA_BORDER_COLORS = [
  "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899",
];

type ActionType = "uri" | "message" | "postback" | "richmenuswitch" | "none";

const ACTION_TYPE_LABELS: Record<ActionType, string> = {
  uri: "Open URL",
  message: "Send Message",
  postback: "Postback",
  richmenuswitch: "Switch Page",
  none: "No Action",
};

// ---- State Types ----
interface DraftArea {
  id: string; // temp id for new areas (starts with "new-")
  pageId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  action_type: ActionType;
  action_label: string;
  action_uri: string;
  action_text: string;
  action_data: string;
  action_display_text: string;
  target_page_number: number;
}

interface BuilderState {
  menu: RichMenu | null;
  pages: RichMenuPage[];
  currentPageIndex: number;
  areas: DraftArea[];
  selectedAreaId: string | null;
  drawMode: boolean;
  previewMode: boolean;
  dirty: boolean;
  loading: boolean;
  saving: boolean;
  error: string | null;
}

type BuilderAction =
  | { type: "LOAD_MENU"; menu: RichMenu }
  | { type: "SET_LOADING"; value: boolean }
  | { type: "SET_ERROR"; value: string | null }
  | { type: "SET_SAVING"; value: boolean }
  | { type: "UPDATE_MENU_FIELD"; field: keyof RichMenu; value: unknown }
  | { type: "SET_PAGE"; index: number }
  | { type: "ADD_PAGE"; page: RichMenuPage }
  | { type: "UPDATE_PAGE"; pageId: string; patch: Partial<RichMenuPage> }
  | { type: "DELETE_PAGE"; pageId: string }
  | { type: "ADD_AREA"; area: DraftArea }
  | { type: "UPDATE_AREA"; id: string; patch: Partial<DraftArea> }
  | { type: "DELETE_AREA"; id: string }
  | { type: "SELECT_AREA"; id: string | null }
  | { type: "TOGGLE_DRAW_MODE" }
  | { type: "TOGGLE_PREVIEW_MODE" }
  | { type: "MARK_CLEAN" };

function toAreaId(a: RichMenuPageArea | null | undefined, idx: number): string {
  return a?.id || `new-${idx}`;
}

function pageToAreas(page: RichMenuPage, pageId: string): DraftArea[] {
  return (page.areas || []).map((a, i) => ({
    id: toAreaId(a, i),
    pageId,
    x: a.x,
    y: a.y,
    width: a.width,
    height: a.height,
    action_type: (a.action_type as ActionType) || "none",
    action_label: a.action_label || "",
    action_uri: a.action_uri || "",
    action_text: a.action_text || "",
    action_data: a.action_data || "",
    action_display_text: a.action_display_text || "",
    target_page_number: a.target_page_number || 0,
  }));
}

function builderReducer(state: BuilderState, action: BuilderAction): BuilderState {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, loading: action.value };
    case "SET_ERROR":
      return { ...state, error: action.value };
    case "SET_SAVING":
      return { ...state, saving: action.value };
    case "LOAD_MENU": {
      const menu = action.menu;
      const pages = menu.pages || [];
      const firstPage = pages[0];
      const areas = firstPage ? pageToAreas(firstPage, firstPage.id) : [];
      return { ...state, menu, pages, currentPageIndex: 0, areas, loading: false, dirty: false, error: null };
    }
    case "UPDATE_MENU_FIELD":
      if (!state.menu) return state;
      return { ...state, menu: { ...state.menu, [action.field]: action.value }, dirty: true };
    case "SET_PAGE": {
      const page = state.pages[action.index];
      const areas = page ? pageToAreas(page, page.id) : [];
      return { ...state, currentPageIndex: action.index, areas, selectedAreaId: null };
    }
    case "ADD_PAGE":
      return { ...state, pages: [...state.pages, action.page], dirty: true };
    case "UPDATE_PAGE":
      return {
        ...state,
        pages: state.pages.map((p) => (p.id === action.pageId ? { ...p, ...action.patch } : p)),
      };
    case "DELETE_PAGE": {
      const newPages = state.pages.filter((p) => p.id !== action.pageId);
      const newIdx = Math.min(state.currentPageIndex, newPages.length - 1);
      const newPage = newPages[newIdx];
      const areas = newPage ? pageToAreas(newPage, newPage.id) : [];
      return { ...state, pages: newPages, currentPageIndex: Math.max(0, newIdx), areas, dirty: true };
    }
    case "ADD_AREA":
      return { ...state, areas: [...state.areas, action.area], selectedAreaId: action.area.id, dirty: true };
    case "UPDATE_AREA":
      return {
        ...state,
        areas: state.areas.map((a) => (a.id === action.id ? { ...a, ...action.patch } : a)),
        dirty: true,
      };
    case "DELETE_AREA":
      return {
        ...state,
        areas: state.areas.filter((a) => a.id !== action.id),
        selectedAreaId: state.selectedAreaId === action.id ? null : state.selectedAreaId,
        dirty: true,
      };
    case "SELECT_AREA":
      return { ...state, selectedAreaId: action.id };
    case "TOGGLE_DRAW_MODE":
      return { ...state, drawMode: !state.drawMode, selectedAreaId: null };
    case "TOGGLE_PREVIEW_MODE":
      return { ...state, previewMode: !state.previewMode, drawMode: false, selectedAreaId: null };
    case "MARK_CLEAN":
      return { ...state, dirty: false };
    default:
      return state;
  }
}

const initialState: BuilderState = {
  menu: null,
  pages: [],
  currentPageIndex: 0,
  areas: [],
  selectedAreaId: null,
  drawMode: false,
  previewMode: false,
  dirty: false,
  loading: true,
  saving: false,
  error: null,
};

// ---- Resize Handle Component ----
type Handle = "n" | "s" | "e" | "w" | "nw" | "ne" | "sw" | "se";
const HANDLES: Handle[] = ["n", "s", "e", "w", "nw", "ne", "sw", "se"];

function handleCursor(h: Handle): string {
  const map: Record<Handle, string> = {
    n: "ns-resize", s: "ns-resize", e: "ew-resize", w: "ew-resize",
    nw: "nwse-resize", se: "nwse-resize", ne: "nesw-resize", sw: "nesw-resize",
  };
  return map[h];
}

// ---- Canvas Area Overlay ----
interface AreaOverlayProps {
  area: DraftArea;
  index: number;
  canvasW: number;
  canvasH: number;
  lineW: number;
  lineH: number;
  selected: boolean;
  previewMode: boolean;
  onSelect: (id: string) => void;
  onResize: (id: string, patch: Partial<DraftArea>) => void;
}

function AreaOverlay({
  area, index, canvasW, canvasH, lineW, lineH, selected, previewMode, onSelect, onResize,
}: AreaOverlayProps) {
  const scaleX = canvasW / lineW;
  const scaleY = canvasH / lineH;
  const left = area.x * scaleX;
  const top = area.y * scaleY;
  const width = area.width * scaleX;
  const height = area.height * scaleY;

  const color = AREA_COLORS[index % AREA_COLORS.length];
  const borderColor = AREA_BORDER_COLORS[index % AREA_BORDER_COLORS.length];

  const [tooltip, setTooltip] = useState(false);
  const resizingRef = useRef<{ handle: Handle; startX: number; startY: number; startArea: DraftArea } | null>(null);

  const startResize = (e: React.MouseEvent, handle: Handle) => {
    e.stopPropagation();
    e.preventDefault();
    resizingRef.current = { handle, startX: e.clientX, startY: e.clientY, startArea: { ...area } };
    const onMouseMove = (me: MouseEvent) => {
      if (!resizingRef.current) return;
      const { handle: h, startX, startY, startArea } = resizingRef.current;
      const dx = (me.clientX - startX) / scaleX;
      const dy = (me.clientY - startY) / scaleY;
      let { x, y, width: w, height: ht } = startArea;
      if (h.includes("e")) w = Math.max(50, startArea.width + dx);
      if (h.includes("s")) ht = Math.max(50, startArea.height + dy);
      if (h.includes("w")) { x = startArea.x + dx; w = Math.max(50, startArea.width - dx); }
      if (h.includes("n")) { y = startArea.y + dy; ht = Math.max(50, startArea.height - dy); }
      onResize(area.id, { x: Math.round(x), y: Math.round(y), width: Math.round(w), height: Math.round(ht) });
    };
    const onMouseUp = () => {
      resizingRef.current = null;
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  const dragRef = useRef<{ startX: number; startY: number; startArea: DraftArea } | null>(null);

  const startDrag = (e: React.MouseEvent) => {
    if (previewMode) return;
    e.stopPropagation();
    dragRef.current = { startX: e.clientX, startY: e.clientY, startArea: { ...area } };
    const onMouseMove = (me: MouseEvent) => {
      if (!dragRef.current) return;
      const dx = (me.clientX - dragRef.current.startX) / scaleX;
      const dy = (me.clientY - dragRef.current.startY) / scaleY;
      onResize(area.id, {
        x: Math.round(dragRef.current.startArea.x + dx),
        y: Math.round(dragRef.current.startArea.y + dy),
      });
    };
    const onMouseUp = () => {
      dragRef.current = null;
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  const previewLabel =
    area.action_type === "uri"
      ? `Open: ${area.action_uri || "(no URL)"}`
      : area.action_type === "message"
      ? `Send: "${area.action_text}"`
      : area.action_type === "postback"
      ? `Postback: ${area.action_data}`
      : area.action_type === "richmenuswitch"
      ? `Switch to page ${area.target_page_number}`
      : "No action";

  return (
    <div
      style={{
        position: "absolute",
        left,
        top,
        width,
        height,
        backgroundColor: color,
        border: `2px solid ${selected ? borderColor : borderColor + "99"}`,
        borderRadius: 4,
        cursor: previewMode ? "pointer" : "move",
        boxSizing: "border-box",
      }}
      onClick={(e) => {
        e.stopPropagation();
        if (previewMode) {
          setTooltip(true);
          setTimeout(() => setTooltip(false), 2500);
        } else {
          onSelect(area.id);
        }
      }}
      onMouseDown={previewMode ? undefined : startDrag}
    >
      {/* Area label */}
      <div
        style={{
          position: "absolute",
          top: 2,
          left: 4,
          fontSize: 11,
          fontWeight: 600,
          color: borderColor,
          pointerEvents: "none",
          userSelect: "none",
          textShadow: "0 0 3px #fff",
          maxWidth: width - 8,
          overflow: "hidden",
          whiteSpace: "nowrap",
          textOverflow: "ellipsis",
        }}
      >
        {area.action_label || `Area ${index + 1}`}
      </div>

      {/* Preview tooltip */}
      {previewMode && tooltip && (
        <div
          style={{
            position: "absolute",
            bottom: "100%",
            left: "50%",
            transform: "translateX(-50%)",
            background: "#1f2937",
            color: "#fff",
            padding: "4px 8px",
            borderRadius: 4,
            fontSize: 11,
            whiteSpace: "nowrap",
            pointerEvents: "none",
            zIndex: 10,
          }}
        >
          {previewLabel}
        </div>
      )}

      {/* Resize handles (only when selected and not in preview) */}
      {selected && !previewMode && HANDLES.map((h) => {
        const hStyle: React.CSSProperties = {
          position: "absolute",
          width: 10,
          height: 10,
          background: "#fff",
          border: `2px solid ${borderColor}`,
          borderRadius: "50%",
          cursor: handleCursor(h),
        };
        if (h.includes("n")) hStyle.top = -6;
        if (h.includes("s")) hStyle.bottom = -6;
        if (!h.includes("n") && !h.includes("s")) hStyle.top = "50%", hStyle.transform = "translateY(-50%)";
        if (h.includes("w")) hStyle.left = -6;
        if (h.includes("e")) hStyle.right = -6;
        if (!h.includes("w") && !h.includes("e")) hStyle.left = "50%", hStyle.transform = (hStyle.transform ? hStyle.transform + " " : "") + "translateX(-50%)";
        return (
          <div
            key={h}
            style={hStyle}
            onMouseDown={(e) => startResize(e, h)}
          />
        );
      })}
    </div>
  );
}

// ---- Area Action Editor ----
interface AreaEditorProps {
  area: DraftArea;
  pageCount: number;
  onChange: (patch: Partial<DraftArea>) => void;
  onDelete: () => void;
}

function AreaEditor({ area, pageCount, onChange, onDelete }: AreaEditorProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">Area Properties</h3>
        <Button variant="ghost" size="sm" onClick={onDelete} className="text-destructive h-7 px-2">
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Label</Label>
        <Input
          className="h-7 text-xs"
          value={area.action_label}
          onChange={(e) => onChange({ action_label: e.target.value })}
          placeholder="Button label"
        />
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Action Type</Label>
        <Select value={area.action_type} onValueChange={(v) => onChange({ action_type: v as ActionType })}>
          <SelectTrigger className="h-7 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(ACTION_TYPE_LABELS) as ActionType[]).map((k) => (
              <SelectItem key={k} value={k} className="text-xs">
                {ACTION_TYPE_LABELS[k]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {area.action_type === "uri" && (
        <div className="space-y-1">
          <Label className="text-xs">URL</Label>
          <Input
            className="h-7 text-xs"
            value={area.action_uri}
            onChange={(e) => onChange({ action_uri: e.target.value })}
            placeholder="https://..."
          />
        </div>
      )}

      {area.action_type === "message" && (
        <div className="space-y-1">
          <Label className="text-xs">Message Text</Label>
          <Input
            className="h-7 text-xs"
            value={area.action_text}
            onChange={(e) => onChange({ action_text: e.target.value })}
            placeholder="Text to send"
          />
        </div>
      )}

      {area.action_type === "postback" && (
        <>
          <div className="space-y-1">
            <Label className="text-xs">Postback Data</Label>
            <Input
              className="h-7 text-xs"
              value={area.action_data}
              onChange={(e) => onChange({ action_data: e.target.value })}
              placeholder="action=buy&item=1"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Display Text (optional)</Label>
            <Input
              className="h-7 text-xs"
              value={area.action_display_text}
              onChange={(e) => onChange({ action_display_text: e.target.value })}
              placeholder="Shown in chat"
            />
          </div>
        </>
      )}

      {area.action_type === "richmenuswitch" && (
        <div className="space-y-1">
          <Label className="text-xs">Target Page</Label>
          <Select
            value={String(area.target_page_number)}
            onValueChange={(v) => onChange({ target_page_number: Number(v) })}
          >
            <SelectTrigger className="h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: pageCount }, (_, i) => (
                <SelectItem key={i + 1} value={String(i + 1)} className="text-xs">
                  Page {i + 1}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="border-t pt-2 space-y-1">
        <Label className="text-xs text-muted-foreground">Bounds (LINE px)</Label>
        <div className="grid grid-cols-2 gap-1">
          {(["x", "y", "width", "height"] as const).map((field) => (
            <div key={field} className="space-y-0.5">
              <Label className="text-xs text-muted-foreground uppercase">{field}</Label>
              <Input
                className="h-7 text-xs"
                type="number"
                value={area[field]}
                onChange={(e) => onChange({ [field]: Number(e.target.value) })}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Convert a UTC ISO string to the "YYYY-MM-DDTHH:mm" format that
 *  <input type="datetime-local"> expects (values are always local time). */
function toLocalDatetimeInput(iso: string): string {
  const d = new Date(iso);
  // getTimezoneOffset() is negative for UTC+ zones (e.g. -420 for UTC+7),
  // so subtracting it shifts the timestamp from UTC to local before slicing.
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

// ---- Main Builder ----
export function RichMenuBuilderPage() {
  const menuId = window.location.pathname.split("/")[2];
  const [state, dispatch] = useReducer(builderReducer, initialState);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ w: 500, h: 337 });
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [drawCurrent, setDrawCurrent] = useState<{ x: number; y: number } | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(false);
  const [showSetDefaultPrompt, setShowSetDefaultPrompt] = useState(false);
  const [isSettingDefault, setIsSettingDefault] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const toast = useToast();

  const { menu, pages, currentPageIndex, areas, selectedAreaId, drawMode, previewMode, loading, saving, error } = state;

  const lineH = menu?.size_type === "compact" ? LINE_COMPACT_HEIGHT : LINE_LARGE_HEIGHT;
  const lineW = LINE_LARGE_WIDTH;

  // Measure canvas
  useEffect(() => {
    if (!canvasRef.current) return;
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        const w = entry.contentRect.width;
        const h = w * (lineH / lineW);
        setCanvasSize({ w, h });
      }
    });
    ro.observe(canvasRef.current);
    return () => ro.disconnect();
  }, [lineH, lineW]);

  // Load menu
  useEffect(() => {
    if (!menuId) return;
    dispatch({ type: "SET_LOADING", value: true });
    richMenuApi.get(menuId)
      .then((rm) => dispatch({ type: "LOAD_MENU", menu: rm }))
      .catch((e: Error) => dispatch({ type: "SET_ERROR", value: e.message }));
  }, [menuId]);

  // Keyboard: delete selected area
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === "Delete" || e.key === "Backspace") && selectedAreaId) {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA") return;
        dispatch({ type: "DELETE_AREA", id: selectedAreaId });
      }
      if (e.key === "Escape") {
        dispatch({ type: "SELECT_AREA", id: null });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedAreaId]);

  const currentPage = pages[currentPageIndex] ?? null;

  const handleSave = async () => {
    if (!menu) return;
    dispatch({ type: "SET_SAVING", value: true });
    try {
      // Save menu properties (including schedule — backend needs clear_*_at flags to explicitly null them)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const menuPayload: any = {
        name: menu.name,
        chat_bar_text: menu.chat_bar_text,
        size_type: menu.size_type,
        menu_type: menu.menu_type,
        description: menu.description,
        selected: menu.selected,
      };
      if (menu.starts_at) {
        menuPayload.starts_at = menu.starts_at;
      } else {
        menuPayload.clear_starts_at = true;
      }
      if (menu.ends_at) {
        menuPayload.ends_at = menu.ends_at;
      } else {
        menuPayload.clear_ends_at = true;
      }
      await richMenuApi.update(menu.id, menuPayload);

      // Save areas for current page
      if (currentPage) {
        for (const area of areas) {
          const areaData: Partial<RichMenuPageArea> = {
            x: area.x,
            y: area.y,
            width: area.width,
            height: area.height,
            action_type: area.action_type,
            action_label: area.action_label,
            action_uri: area.action_uri,
            action_text: area.action_text,
            action_data: area.action_data,
            action_display_text: area.action_display_text,
            target_page_number: area.target_page_number,
          };
          if (area.id.startsWith("new-")) {
            await richMenuAreaApi.create(menu.id, currentPage.id, areaData);
          } else {
            await richMenuAreaApi.update(menu.id, currentPage.id, area.id, areaData);
          }
        }
      }

      dispatch({ type: "MARK_CLEAN" });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
      toast.success("Saved", "Menu settings and areas have been saved.");
    } catch (e: unknown) {
      toast.error("Save failed", e instanceof Error ? e.message : "An unexpected error occurred.");
    } finally {
      dispatch({ type: "SET_SAVING", value: false });
    }
  };

  const handlePublish = async () => {
    if (!menu) return;
    setIsPublishing(true);
    setPublishSuccess(false);
    try {
      const updated = await richMenuApi.publish(menu.id);
      dispatch({ type: "LOAD_MENU", menu: updated });
      setPublishSuccess(true);
      setTimeout(() => setPublishSuccess(false), 4000);
      // Prompt to set as default only if it isn't already
      if (!updated.is_default) {
        setShowSetDefaultPrompt(true);
      } else {
        toast.success("Published & set as default ✓", "The rich menu is now showing to all followers.");
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Publish failed";
      toast.error("Publish failed", msg);
    } finally {
      setIsPublishing(false);
    }
  };

  const handleSetDefault = async () => {
    if (!menu) return;
    setIsSettingDefault(true);
    try {
      await richMenuApi.setDefault(menu.id);
      dispatch({ type: "UPDATE_MENU_FIELD", field: "is_default", value: true });
      setShowSetDefaultPrompt(false);
      toast.success("Set as default ✓", "This rich menu will now show to all your LINE followers.");
    } catch (e: unknown) {
      toast.error("Failed to set as default", e instanceof Error ? e.message : "An unexpected error occurred.");
    } finally {
      setIsSettingDefault(false);
    }
  };

  const handleAddPage = async () => {
    if (!menu) return;
    try {
      const page = await richMenuPageApi.create(menu.id, {
        page_number: pages.length + 1,
        tab_label: `Page ${pages.length + 1}`,
      });
      dispatch({ type: "ADD_PAGE", page });
      dispatch({ type: "SET_PAGE", index: pages.length });
    } catch (e: unknown) {
      toast.error("Failed to add page", e instanceof Error ? e.message : "An unexpected error occurred.");
    }
  };

  const handleDeletePage = async (pageId: string) => {
    if (!menu || pages.length <= 1) return;
    if (!confirm("Delete this page and all its areas?")) return;
    try {
      await richMenuPageApi.delete(menu.id, pageId);
      dispatch({ type: "DELETE_PAGE", pageId });
      toast.success("Page deleted");
    } catch (e: unknown) {
      toast.error("Failed to delete page", e instanceof Error ? e.message : "An unexpected error occurred.");
    }
  };

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!menu || !currentPage) return;
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.warning("Invalid file", "Please select an image file (PNG, JPG, etc.).");
      return;
    }

    setIsUploadingImage(true);

    try {
      const result = await richMenuPageApi.uploadImage(menu.id, currentPage.id, file);
      // Update only the current page's image_url — keeps everything else intact
      dispatch({ type: "UPDATE_PAGE", pageId: currentPage.id, patch: { image_url: result.image_url } });
      toast.success("Image uploaded");
    } catch (e: unknown) {
      toast.error("Upload failed", e instanceof Error ? e.message : "An unexpected error occurred.");
    } finally {
      setIsUploadingImage(false);
      // Reset the input so the same file can be re-uploaded if needed
      e.target.value = "";
    }
  };

  // Draw mode mouse events
  const getLineCoords = useCallback(
    (e: React.MouseEvent) => {
      if (!canvasRef.current) return { x: 0, y: 0 };
      const rect = canvasRef.current.getBoundingClientRect();
      const px = ((e.clientX - rect.left) / rect.width) * lineW;
      const py = ((e.clientY - rect.top) / canvasSize.h) * lineH;
      return { x: Math.round(Math.max(0, Math.min(px, lineW))), y: Math.round(Math.max(0, Math.min(py, lineH))) };
    },
    [canvasSize.h, lineH, lineW]
  );

  const onCanvasMouseDown = (e: React.MouseEvent) => {
    if (!drawMode) {
      dispatch({ type: "SELECT_AREA", id: null });
      return;
    }
    const coords = getLineCoords(e);
    setDrawStart(coords);
    setDrawCurrent(coords);
  };

  const onCanvasMouseMove = (e: React.MouseEvent) => {
    if (!drawMode || !drawStart) return;
    setDrawCurrent(getLineCoords(e));
  };

  const onCanvasMouseUp = (e: React.MouseEvent) => {
    if (!drawMode || !drawStart) return;
    const end = getLineCoords(e);
    const x = Math.min(drawStart.x, end.x);
    const y = Math.min(drawStart.y, end.y);
    const w = Math.abs(end.x - drawStart.x);
    const h = Math.abs(end.y - drawStart.y);
    if (w > 30 && h > 30 && currentPage) {
      const newArea: DraftArea = {
        id: `new-${Date.now()}`,
        pageId: currentPage.id,
        x, y, width: w, height: h,
        action_type: "uri",
        action_label: "",
        action_uri: "",
        action_text: "",
        action_data: "",
        action_display_text: "",
        target_page_number: 0,
      };
      dispatch({ type: "ADD_AREA", area: newArea });
      dispatch({ type: "TOGGLE_DRAW_MODE" });
    }
    setDrawStart(null);
    setDrawCurrent(null);
  };

  if (loading) {
    return (
      <AppLayout title="Rich Menu Builder">
        <div className="flex items-center justify-center py-24 gap-2 text-muted-foreground">
          <RefreshCw className="h-5 w-5 animate-spin" />
          Loading menu...
        </div>
      </AppLayout>
    );
  }

  if (error || !menu) {
    return (
      <AppLayout title="Rich Menu Builder">
        <Card>
          <CardContent className="py-12 text-center text-destructive">
            {error || "Menu not found"}
          </CardContent>
        </Card>
      </AppLayout>
    );
  }

  // Draw preview rect
  const drawPreviewStyle: React.CSSProperties | null =
    drawMode && drawStart && drawCurrent
      ? {
          position: "absolute",
          left: (Math.min(drawStart.x, drawCurrent.x) / lineW) * canvasSize.w,
          top: (Math.min(drawStart.y, drawCurrent.y) / lineH) * canvasSize.h,
          width: (Math.abs(drawCurrent.x - drawStart.x) / lineW) * canvasSize.w,
          height: (Math.abs(drawCurrent.y - drawStart.y) / lineH) * canvasSize.h,
          border: "2px dashed #3b82f6",
          backgroundColor: "rgba(59,130,246,0.12)",
          pointerEvents: "none",
        }
      : null;

  const selectedArea = areas.find((a) => a.id === selectedAreaId) ?? null;

  return (
    <AppLayout title={`Rich Menu: ${menu.name}`}>
      <div className="flex flex-col h-full gap-0">
        {/* Top toolbar */}
        <div className="flex items-center justify-between pb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => { window.location.href = "/rich-menus"; }}>
              Back
            </Button>
            <span className="text-sm font-medium">{menu.name}</span>
            {state.dirty && <Badge variant="outline" className="text-xs text-yellow-600 border-yellow-400">Unsaved</Badge>}
            {saveSuccess && (
              <span className="flex items-center gap-1 text-xs text-green-600">
                <Check className="h-3 w-3" /> Saved
              </span>
            )}
            {publishSuccess && (
              <span className="flex items-center gap-1 text-xs text-green-600">
                <Check className="h-3 w-3" /> Published to LINE ✓
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={previewMode ? "default" : "outline"}
              size="sm"
              onClick={() => dispatch({ type: "TOGGLE_PREVIEW_MODE" })}
            >
              <Eye className="h-4 w-4 mr-1" />
              {previewMode ? "Exit Preview" : "Preview"}
            </Button>
            <Button
              variant={drawMode ? "default" : "outline"}
              size="sm"
              onClick={() => dispatch({ type: "TOGGLE_DRAW_MODE" })}
              disabled={previewMode}
            >
              <Edit3 className="h-4 w-4 mr-1" />
              {drawMode ? "Drawing..." : "Draw Area"}
            </Button>
            <Button size="sm" variant="outline" onClick={handleSave} disabled={saving || !state.dirty}>
              {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Save"}
            </Button>
            <Button size="sm" onClick={handlePublish} disabled={isPublishing}>
              {isPublishing
                ? <><RefreshCw className="h-4 w-4 mr-1 animate-spin" /> Publishing...</>
                : <><Upload className="h-4 w-4 mr-1" /> Publish to LINE</>
              }
            </Button>
            {menu.is_default ? null : menu.published_at ? (
              <Button size="sm" variant="outline" onClick={handleSetDefault} disabled={isSettingDefault}
                className="border-amber-400 text-amber-700 hover:bg-amber-50"
              >
                {isSettingDefault
                  ? <RefreshCw className="h-4 w-4 animate-spin" />
                  : <><Star className="h-4 w-4 mr-1" /> Set as Default</>
                }
              </Button>
            ) : null}
          </div>
        </div>

        {/* Set as Default prompt — shown once right after publish */}
        {showSetDefaultPrompt && (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm">
            <div className="flex items-center gap-2 text-amber-800">
              <Star className="h-4 w-4 text-amber-500 flex-shrink-0" />
              <span>
                <strong>Published to LINE!</strong> Set this menu as default so it appears to all your followers.
              </span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button size="sm" variant="outline" onClick={() => setShowSetDefaultPrompt(false)} className="h-7 text-xs">
                Later
              </Button>
              <Button size="sm" onClick={handleSetDefault} disabled={isSettingDefault} className="h-7 text-xs bg-amber-500 hover:bg-amber-600 text-white border-0">
                {isSettingDefault
                  ? <RefreshCw className="h-3 w-3 animate-spin" />
                  : <><Star className="h-3 w-3 mr-1" /> Set as Default</>
                }
              </Button>
            </div>
          </div>
        )}

        {/* 3-panel layout */}
        <div className="flex gap-4 flex-1 min-h-0" style={{ height: "calc(100vh - 200px)" }}>
          {/* LEFT PANEL: Properties */}
          <div className="w-56 flex-shrink-0 space-y-4 overflow-y-auto">
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Menu Settings</h3>
              <div className="space-y-1">
                <Label className="text-xs">Name</Label>
                <Input
                  className="h-7 text-xs"
                  value={menu.name}
                  onChange={(e) => dispatch({ type: "UPDATE_MENU_FIELD", field: "name", value: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Chat Bar Text <span className="text-muted-foreground">(defaults to menu name)</span></Label>
                <Input
                  className="h-7 text-xs"
                  value={menu.chat_bar_text || ""}
                  onChange={(e) => dispatch({ type: "UPDATE_MENU_FIELD", field: "chat_bar_text", value: e.target.value })}
                  placeholder={menu.name || "e.g. Tap to open menu"}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Size</Label>
                <Select
                  value={menu.size_type}
                  onValueChange={(v) => dispatch({ type: "UPDATE_MENU_FIELD", field: "size_type", value: v })}
                >
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="large" className="text-xs">Large (2500×1686)</SelectItem>
                    <SelectItem value="compact" className="text-xs">Compact (2500×843)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Start Date</Label>
                <Input
                  className="h-7 text-xs"
                  type="datetime-local"
                  value={menu.starts_at ? toLocalDatetimeInput(menu.starts_at) : ""}
                  onChange={(e) =>
                    dispatch({ type: "UPDATE_MENU_FIELD", field: "starts_at", value: e.target.value ? new Date(e.target.value).toISOString() : null })
                  }
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">End Date</Label>
                <Input
                  className="h-7 text-xs"
                  type="datetime-local"
                  value={menu.ends_at ? toLocalDatetimeInput(menu.ends_at) : ""}
                  onChange={(e) =>
                    dispatch({ type: "UPDATE_MENU_FIELD", field: "ends_at", value: e.target.value ? new Date(e.target.value).toISOString() : null })
                  }
                />
              </div>
            </div>

            {/* Page tabs */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Pages</h3>
                <Button variant="ghost" size="sm" className="h-6 px-2" onClick={handleAddPage}>
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              <div className="space-y-1">
                {pages.map((page, idx) => (
                  <div
                    key={page.id}
                    className={`flex items-center justify-between rounded px-2 py-1 cursor-pointer text-xs ${
                      idx === currentPageIndex ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                    }`}
                    onClick={() => dispatch({ type: "SET_PAGE", index: idx })}
                  >
                    <span>{page.tab_label || `Page ${idx + 1}`}</span>
                    {pages.length > 1 && (
                      <button
                        className="opacity-60 hover:opacity-100"
                        onClick={(e) => { e.stopPropagation(); handleDeletePage(page.id); }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Image Upload */}
              {currentPage && (
                <div className="pt-2 border-t space-y-2">
                  <Label htmlFor="page-image" className="text-xs font-medium">
                    Page Image{" "}
                    {!currentPage.image_url && (
                      <span className="text-destructive font-normal">(required to publish)</span>
                    )}
                  </Label>
                  <div className="flex gap-2">
                    <input
                      id="page-image"
                      type="file"
                      accept="image/*"
                      disabled={isUploadingImage}
                      onChange={handleUploadImage}
                      className="hidden"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs flex-1"
                      disabled={isUploadingImage}
                      onClick={() => document.getElementById("page-image")?.click()}
                    >
                      <Upload className="h-3 w-3 mr-1" />
                      {isUploadingImage ? "Uploading..." : "Upload Image"}
                    </Button>
                    {currentPage.image_url && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2"
                        onClick={() => {
                          // Could add clear image functionality
                        }}
                      >
                        <Check className="h-3 w-3 text-green-600" />
                      </Button>
                    )}
                  </div>
                  {currentPage.image_url && (
                    <p className="text-xs text-muted-foreground">Image uploaded ✓</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* CENTER PANEL: Canvas */}
          <div className="flex-1 min-w-0 flex flex-col gap-2">
            {drawMode && (
              <div className="text-xs text-blue-600 bg-blue-50 rounded px-2 py-1 border border-blue-200">
                Draw mode: click and drag on the canvas to define a new area. Press Esc to cancel.
              </div>
            )}
            {previewMode && (
              <div className="text-xs text-green-600 bg-green-50 rounded px-2 py-1 border border-green-200">
                Preview mode: click on areas to see what action would be triggered.
              </div>
            )}
            <div
              ref={canvasRef}
              style={{
                width: "100%",
                height: canvasSize.h,
                position: "relative",
                background: currentPage?.image_url ? `url(${currentPage.image_url}) center/cover no-repeat` : "#e5e7eb",
                borderRadius: 8,
                overflow: "hidden",
                cursor: drawMode ? "crosshair" : "default",
                userSelect: "none",
                border: "1px solid #d1d5db",
              }}
              onMouseDown={onCanvasMouseDown}
              onMouseMove={onCanvasMouseMove}
              onMouseUp={onCanvasMouseUp}
            >
              {/* Placeholder when no image */}
              {!currentPage?.image_url && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 text-sm gap-2">
                  <Upload className="h-8 w-8 opacity-40" />
                  <span>No image — upload via page settings</span>
                  <span className="text-xs opacity-60">
                    {menu.size_type === "large" ? "2500 × 1686 px" : "2500 × 843 px"}
                  </span>
                </div>
              )}

              {/* Area overlays */}
              {areas.map((area, i) => (
                <AreaOverlay
                  key={area.id}
                  area={area}
                  index={i}
                  canvasW={canvasSize.w}
                  canvasH={canvasSize.h}
                  lineW={lineW}
                  lineH={lineH}
                  selected={area.id === selectedAreaId}
                  previewMode={previewMode}
                  onSelect={(id) => dispatch({ type: "SELECT_AREA", id })}
                  onResize={(id, patch) => dispatch({ type: "UPDATE_AREA", id, patch })}
                />
              ))}

              {/* Draw preview rect */}
              {drawPreviewStyle && <div style={drawPreviewStyle} />}
            </div>

            {/* Area count info */}
            <div className="text-xs text-muted-foreground">
              {areas.length} area{areas.length !== 1 ? "s" : ""} on this page
              {areas.length < 20 && !drawMode && !previewMode && (
                <button
                  className="ml-2 text-blue-600 hover:underline"
                  onClick={() => dispatch({ type: "TOGGLE_DRAW_MODE" })}
                >
                  + Add area
                </button>
              )}
            </div>
          </div>

          {/* RIGHT PANEL: Area Editor */}
          <div className="w-56 flex-shrink-0 overflow-y-auto">
            {selectedArea ? (
              <AreaEditor
                area={selectedArea}
                pageCount={pages.length}
                onChange={(patch) => dispatch({ type: "UPDATE_AREA", id: selectedArea.id, patch })}
                onDelete={() => dispatch({ type: "DELETE_AREA", id: selectedArea.id })}
              />
            ) : (
              <div className="text-xs text-muted-foreground space-y-2">
                <h3 className="font-semibold text-sm text-foreground">Area Editor</h3>
                <p>Click an area on the canvas to edit it.</p>
                <p>Use "Draw Area" to create new interactive zones.</p>
                <p className="text-muted-foreground/70">Delete key removes the selected area.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
