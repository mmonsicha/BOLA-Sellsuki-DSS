import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  Copy,
  CheckCircle2,
  ChevronLeft,
  Type,
  Phone,
  Mail,
  Calendar,
  ChevronDown,
  CheckSquare,
  Hash,
} from "lucide-react";
import type { RegistrationForm, FormField, FieldType } from "@/types";
import { registrationFormApi } from "@/api/registrationForm";
import { useToast } from "@/components/ui/toast";

const FIELD_TYPES: { value: FieldType; label: string; icon: React.ReactNode }[] = [
  { value: "text", label: "Text", icon: <Type className="h-3.5 w-3.5" /> },
  { value: "phone", label: "Phone", icon: <Phone className="h-3.5 w-3.5" /> },
  { value: "email", label: "Email", icon: <Mail className="h-3.5 w-3.5" /> },
  { value: "date", label: "Date", icon: <Calendar className="h-3.5 w-3.5" /> },
  { value: "select", label: "Select", icon: <ChevronDown className="h-3.5 w-3.5" /> },
  { value: "checkbox", label: "Checkbox", icon: <CheckSquare className="h-3.5 w-3.5" /> },
  { value: "number", label: "Number", icon: <Hash className="h-3.5 w-3.5" /> },
];

function fieldTypeIcon(type: FieldType) {
  return FIELD_TYPES.find((t) => t.value === type)?.icon ?? <Type className="h-3.5 w-3.5" />;
}

// ── Field Editor Dialog ────────────────────────────────────────────────────────

interface FieldEditorProps {
  field: FormField;
  onSave: (f: FormField) => void;
  onClose: () => void;
}

function FieldEditorDialog({ field, onSave, onClose }: FieldEditorProps) {
  const [key, setKey] = useState(field.key);
  const [label, setLabel] = useState(field.label);
  const [type, setType] = useState<FieldType>(field.type);
  const [required, setRequired] = useState(field.required);
  const [optionsText, setOptionsText] = useState((field.options || []).join("\n"));

  const handleSave = () => {
    if (!key.trim() || !label.trim()) return;
    const f: FormField = {
      key: key.trim(),
      label: label.trim(),
      type,
      required,
      options: type === "select" ? optionsText.split("\n").map((s) => s.trim()).filter(Boolean) : undefined,
    };
    onSave(f);
  };

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Field</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2 px-6">
          <div className="space-y-2">
            <Label htmlFor="field-key">Field Key *</Label>
            <Input
              id="field-key"
              value={key}
              onChange={(e) => setKey(e.target.value.replace(/\s+/g, "_").toLowerCase())}
              placeholder="e.g. first_name, phone_number"
            />
            <p className="text-xs text-muted-foreground">Used as the data key in submission records.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="field-label">Label *</Label>
            <Input
              id="field-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. First Name, Phone Number"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as FieldType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FIELD_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    <span className="flex items-center gap-2">
                      {t.icon}
                      {t.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {type === "select" && (
            <div className="space-y-2">
              <Label htmlFor="field-options">Options (one per line)</Label>
              <textarea
                id="field-options"
                className="w-full border rounded-md px-3 py-2 text-sm min-h-[80px] focus:outline-none focus:ring-2 focus:ring-ring resize-y"
                value={optionsText}
                onChange={(e) => setOptionsText(e.target.value)}
                placeholder={"Option A\nOption B\nOption C"}
              />
            </div>
          )}

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="field-required"
              checked={required}
              onChange={(e) => setRequired(e.target.checked)}
              className="h-4 w-4 accent-green-600"
            />
            <Label htmlFor="field-required">Required field</Label>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={handleSave}
            disabled={!key.trim() || !label.trim()}
            className="bg-green-600 hover:bg-green-700"
          >
            Save Field
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Live Preview ───────────────────────────────────────────────────────────────

function LivePreview({ form }: { form: RegistrationForm }) {
  const primaryColor = form.primary_color || "#06c755";

  return (
    <div className="bg-gray-50 rounded-xl border p-4 h-full overflow-y-auto">
      <div className="max-w-sm mx-auto bg-white rounded-lg shadow-sm border overflow-hidden">
        {/* Header */}
        {form.logo_url && (
          <div className="flex justify-center pt-6 px-6">
            <img
              src={form.logo_url}
              alt="Logo"
              className="h-16 w-16 object-contain rounded-full border"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          </div>
        )}
        <div className="px-6 pt-4 pb-2 text-center">
          <h2 className="text-lg font-bold text-gray-900">
            {form.title || form.name || "Registration Form"}
          </h2>
          {form.description && (
            <p className="text-sm text-gray-500 mt-1">{form.description}</p>
          )}
        </div>

        {/* Fields */}
        <div className="px-6 py-3 space-y-4">
          {(form.fields || []).map((field) => (
            <div key={field.key} className="space-y-1">
              <label className="text-sm font-medium text-gray-700">
                {field.label}
                {field.required && <span className="text-red-500 ml-0.5">*</span>}
              </label>
              {field.type === "select" ? (
                <select
                  className="w-full border rounded-md px-3 py-2 text-sm bg-white focus:outline-none"
                  disabled
                >
                  <option>Select…</option>
                  {(field.options || []).map((opt) => (
                    <option key={opt}>{opt}</option>
                  ))}
                </select>
              ) : field.type === "checkbox" ? (
                <div className="flex items-center gap-2">
                  <input type="checkbox" className="h-4 w-4" disabled />
                  <span className="text-sm text-gray-600">{field.label}</span>
                </div>
              ) : (
                <input
                  type={field.type === "date" ? "date" : field.type === "number" ? "number" : "text"}
                  placeholder={field.label}
                  className="w-full border rounded-md px-3 py-2 text-sm bg-gray-50 text-gray-400"
                  disabled
                />
              )}
            </div>
          ))}

          {(form.fields || []).length === 0 && (
            <p className="text-xs text-center text-muted-foreground py-4">
              No fields yet. Add fields in the editor.
            </p>
          )}
        </div>

        {/* Terms */}
        {form.terms_text && (
          <div className="px-6 pb-2">
            <div className="flex items-start gap-2 text-xs text-gray-500">
              <input type="checkbox" className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" disabled />
              <span>{form.terms_text}</span>
            </div>
          </div>
        )}

        {/* Submit button */}
        <div className="px-6 pb-6 pt-3">
          <button
            className="w-full py-2.5 rounded-lg text-white font-medium text-sm transition-opacity"
            style={{ backgroundColor: primaryColor }}
            disabled
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Builder Page ──────────────────────────────────────────────────────────

export function RegistrationFormBuilderPage() {
  const toast = useToast();
  const formId = window.location.pathname.split("/")[2];

  const [form, setForm] = useState<RegistrationForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"fields" | "settings" | "liff">("fields");
  const [editingField, setEditingField] = useState<FormField | null>(null);
  const [editingFieldIndex, setEditingFieldIndex] = useState<number>(-1);
  const [copiedLiff, setCopiedLiff] = useState(false);

  useEffect(() => {
    if (!formId) return;
    setLoading(true);
    registrationFormApi
      .get(formId)
      .then((f) => {
        setForm(f);
        setLoading(false);
      })
      .catch((e: Error) => {
        toast.error("Failed to load form", e.message);
        setLoading(false);
      });
  }, [formId]);

  const updateField = <K extends keyof RegistrationForm>(key: K, value: RegistrationForm[K]) => {
    setForm((prev) => prev ? { ...prev, [key]: value } : prev);
    setDirty(true);
  };

  const handleSave = async () => {
    if (!form) return;
    setSaving(true);
    try {
      const updated = await registrationFormApi.update(form.id, {
        name: form.name,
        title: form.title,
        description: form.description,
        logo_url: form.logo_url,
        primary_color: form.primary_color,
        liff_id: form.liff_id,
        liff_url: form.liff_url,
        success_message: form.success_message,
        redirect_url: form.redirect_url,
        fields: form.fields,
        terms_text: form.terms_text,
      });
      setForm(updated);
      setDirty(false);
      toast.success("Form saved");
    } catch (e: unknown) {
      toast.error("Failed to save form", e instanceof Error ? e.message : "An unexpected error occurred.");
    } finally {
      setSaving(false);
    }
  };

  const handleAddField = () => {
    const newField: FormField = {
      key: `field_${Date.now().toString(36)}`,
      label: "New Field",
      type: "text",
      required: false,
    };
    setEditingField(newField);
    setEditingFieldIndex(-1); // -1 = new field
  };

  const handleEditField = (field: FormField, idx: number) => {
    setEditingField({ ...field });
    setEditingFieldIndex(idx);
  };

  const handleSaveField = (saved: FormField) => {
    if (!form) return;
    const fields = [...(form.fields || [])];
    if (editingFieldIndex === -1) {
      fields.push(saved);
    } else {
      fields[editingFieldIndex] = saved;
    }
    updateField("fields", fields);
    setEditingField(null);
    setEditingFieldIndex(-1);
  };

  const handleDeleteField = (idx: number) => {
    if (!form) return;
    const fields = [...(form.fields || [])];
    fields.splice(idx, 1);
    updateField("fields", fields);
  };

  const handleMoveField = (idx: number, dir: "up" | "down") => {
    if (!form) return;
    const fields = [...(form.fields || [])];
    const target = dir === "up" ? idx - 1 : idx + 1;
    if (target < 0 || target >= fields.length) return;
    [fields[idx], fields[target]] = [fields[target], fields[idx]];
    updateField("fields", fields);
  };

  const copyLiffUrl = () => {
    if (!form?.liff_url) return;
    navigator.clipboard.writeText(form.liff_url).then(() => {
      setCopiedLiff(true);
      setTimeout(() => setCopiedLiff(false), 2000);
    });
  };

  if (loading) {
    return (
      <AppLayout title="Form Builder">
        <Card>
          <CardContent className="py-12 flex items-center justify-center gap-2 text-muted-foreground">
            <RefreshCw className="h-4 w-4 animate-spin" />
            Loading form...
          </CardContent>
        </Card>
      </AppLayout>
    );
  }

  if (!form) {
    return (
      <AppLayout title="Form Builder">
        <Card>
          <CardContent className="py-12 text-center text-destructive">Form not found.</CardContent>
        </Card>
      </AppLayout>
    );
  }

  return (
    <AppLayout title={`Form Builder — ${form.name}`}>
      <div className="space-y-4">
        {/* Back + Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <a
              href="/registration-forms"
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="h-4 w-4" />
              Back to forms
            </a>
            <span className="text-muted-foreground">/</span>
            <span className="font-medium text-sm">{form.name}</span>
            <Badge
              className={
                form.is_active
                  ? "bg-green-100 text-green-700 border-green-200"
                  : "bg-gray-100 text-gray-500 border-gray-200"
              }
            >
              {form.is_active ? "Active" : "Inactive"}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={`/registration-forms/${form.id}/submissions`}
              className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-2"
            >
              View Submissions ({form.submission_count})
            </a>
            <Button
              onClick={handleSave}
              disabled={saving || !dirty}
              className="bg-green-600 hover:bg-green-700"
            >
              {saving ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save"
              )}
            </Button>
          </div>
        </div>

        {/* Two-panel layout */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-start">
          {/* Left panel: Editor */}
          <div className="lg:col-span-2 space-y-3">
            {/* Tab bar */}
            <div className="flex border-b">
              {(["fields", "settings", "liff"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
                    activeTab === tab
                      ? "border-green-600 text-green-700"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab === "liff" ? "LIFF" : tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {/* Fields tab */}
            {activeTab === "fields" && (
              <div className="space-y-2">
                {(form.fields || []).map((field, idx) => (
                  <div
                    key={`${field.key}-${idx}`}
                    className="flex items-center gap-2 p-3 rounded-lg border bg-card hover:bg-accent/30 group"
                  >
                    <div className="text-muted-foreground flex-shrink-0">
                      {fieldTypeIcon(field.type)}
                    </div>
                    <div
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => handleEditField(field, idx)}
                    >
                      <div className="text-sm font-medium truncate">{field.label}</div>
                      <div className="text-xs text-muted-foreground">
                        {field.type}
                        {field.required && " · required"}
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMoveField(idx, "up")}
                        disabled={idx === 0}
                        className="h-7 w-7 p-0"
                      >
                        <ArrowUp className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMoveField(idx, "down")}
                        disabled={idx === (form.fields || []).length - 1}
                        className="h-7 w-7 p-0"
                      >
                        <ArrowDown className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteField(idx)}
                        className="h-7 w-7 p-0"
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}

                {(form.fields || []).length === 0 && (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    No fields yet. Click below to add one.
                  </div>
                )}

                <Button variant="outline" className="w-full" onClick={handleAddField}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Field
                </Button>
              </div>
            )}

            {/* Settings tab */}
            {activeTab === "settings" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="s-name">Form Name</Label>
                  <Input
                    id="s-name"
                    value={form.name}
                    onChange={(e) => updateField("name", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="s-title">Display Title</Label>
                  <Input
                    id="s-title"
                    value={form.title || ""}
                    onChange={(e) => updateField("title", e.target.value)}
                    placeholder="Shown at the top of the form"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="s-desc">Description</Label>
                  <textarea
                    id="s-desc"
                    className="w-full border rounded-md px-3 py-2 text-sm min-h-[72px] focus:outline-none focus:ring-2 focus:ring-ring resize-y"
                    value={form.description || ""}
                    onChange={(e) => updateField("description", e.target.value)}
                    placeholder="Optional description shown below the title"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="s-logo">Logo URL</Label>
                  <Input
                    id="s-logo"
                    value={form.logo_url || ""}
                    onChange={(e) => updateField("logo_url", e.target.value)}
                    placeholder="https://..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="s-color">Primary Color</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      id="s-color"
                      value={form.primary_color || "#06c755"}
                      onChange={(e) => updateField("primary_color", e.target.value)}
                      className="h-9 w-12 cursor-pointer rounded border px-1 py-1"
                    />
                    <Input
                      value={form.primary_color || "#06c755"}
                      onChange={(e) => updateField("primary_color", e.target.value)}
                      placeholder="#06c755"
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="s-success">Success Message</Label>
                  <Input
                    id="s-success"
                    value={form.success_message || ""}
                    onChange={(e) => updateField("success_message", e.target.value)}
                    placeholder="Thank you for your submission!"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="s-redirect">Redirect URL (after submit)</Label>
                  <Input
                    id="s-redirect"
                    value={form.redirect_url || ""}
                    onChange={(e) => updateField("redirect_url", e.target.value)}
                    placeholder="https://..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="s-terms">Terms & Conditions Text</Label>
                  <textarea
                    id="s-terms"
                    className="w-full border rounded-md px-3 py-2 text-sm min-h-[72px] focus:outline-none focus:ring-2 focus:ring-ring resize-y"
                    value={form.terms_text || ""}
                    onChange={(e) => updateField("terms_text", e.target.value)}
                    placeholder="I agree to the terms and conditions..."
                  />
                </div>
              </div>
            )}

            {/* LIFF tab */}
            {activeTab === "liff" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="liff-id">LIFF App ID</Label>
                  <Input
                    id="liff-id"
                    value={form.liff_id || ""}
                    onChange={(e) => updateField("liff_id", e.target.value)}
                    placeholder="1234567890-xxxxxxxx"
                  />
                  <p className="text-xs text-muted-foreground">
                    Create a LIFF app in LINE Developers and enter the ID here.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="liff-url">LIFF URL</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="liff-url"
                      value={form.liff_url || ""}
                      onChange={(e) => updateField("liff_url", e.target.value)}
                      placeholder="https://liff.line.me/..."
                      className="flex-1"
                    />
                    {form.liff_url && (
                      <Button variant="outline" size="sm" onClick={copyLiffUrl} className="flex-shrink-0">
                        {copiedLiff ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>

                <Card className="border-dashed">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Setup Guide</CardTitle>
                  </CardHeader>
                  <CardContent className="text-xs text-muted-foreground space-y-2">
                    <p>1. Go to <strong>LINE Developers Console</strong> and create a new LIFF app.</p>
                    <p>2. Set the endpoint URL to your BOLA public form URL:</p>
                    <code className="block bg-muted px-2 py-1 rounded text-xs break-all">
                      {window.location.origin}/v1/public/forms/{form.id}
                    </code>
                    <p>3. Copy the LIFF App ID and paste it above.</p>
                    <p>4. Share the LIFF URL with followers to collect registrations.</p>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          {/* Right panel: Live preview */}
          <div className="lg:col-span-3">
            <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">
              Live Preview
            </p>
            <LivePreview form={form} />
          </div>
        </div>
      </div>

      {/* Field editor dialog */}
      {editingField && (
        <FieldEditorDialog
          field={editingField}
          onSave={handleSaveField}
          onClose={() => {
            setEditingField(null);
            setEditingFieldIndex(-1);
          }}
        />
      )}
    </AppLayout>
  );
}
