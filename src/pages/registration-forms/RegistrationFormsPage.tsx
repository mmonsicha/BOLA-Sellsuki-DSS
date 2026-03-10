import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ClipboardList, Plus, Trash2, ToggleLeft, ToggleRight, RefreshCw, FileText } from "lucide-react";
import type { RegistrationForm, LineOA } from "@/types";
import { registrationFormApi } from "@/api/registrationForm";
import { lineOAApi } from "@/api/lineOA";
import { useToast } from "@/components/ui/toast";
import { LineOAFilter } from "@/components/common/LineOAFilter";

const WORKSPACE_ID = "00000000-0000-0000-0000-000000000001";

export function RegistrationFormsPage() {
  const toast = useToast();
  const [lineOAs, setLineOAs] = useState<LineOA[]>([]);
  const [selectedOA, setSelectedOA] = useState<string>("");
  const [forms, setForms] = useState<RegistrationForm[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create dialog state
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newName, setNewName] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [creating, setCreating] = useState(false);

  // Toggle / delete in-progress tracking
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Load LINE OAs on mount
  useEffect(() => {
    lineOAApi
      .list({ workspace_id: WORKSPACE_ID })
      .then((res) => {
        const oas: LineOA[] = res.data || [];
        setLineOAs(oas);
        if (oas.length > 0) setSelectedOA(oas[0].id);
      })
      .catch(() => {});
  }, []);

  // Load forms when selected OA changes
  useEffect(() => {
    if (!selectedOA) return;
    setLoading(true);
    setError(null);
    registrationFormApi
      .list(selectedOA)
      .then((res) => setForms(res.data || []))
      .catch((e: Error) => {
        setError(e.message);
        setForms([]);
      })
      .finally(() => setLoading(false));
  }, [selectedOA]);

  const handleCreate = async () => {
    if (!newName.trim() || !selectedOA) return;
    setCreating(true);
    try {
      const form = await registrationFormApi.create({
        workspace_id: WORKSPACE_ID,
        line_oa_id: selectedOA,
        name: newName.trim(),
        title: newTitle.trim() || undefined,
      });
      setShowCreateDialog(false);
      setNewName("");
      setNewTitle("");
      window.location.href = `/registration-forms/${form.id}`;
    } catch (e: unknown) {
      toast.error(
        "Failed to create form",
        e instanceof Error ? e.message : "An unexpected error occurred."
      );
    } finally {
      setCreating(false);
    }
  };

  const handleToggle = async (form: RegistrationForm) => {
    setTogglingId(form.id);
    try {
      const updated = await registrationFormApi.toggle(form.id);
      setForms((prev) => prev.map((f) => (f.id === form.id ? updated : f)));
      toast.success(
        updated.is_active ? "Form activated" : "Form deactivated",
        `"${form.name}" is now ${updated.is_active ? "active" : "inactive"}.`
      );
    } catch (e: unknown) {
      toast.error("Failed to toggle form", e instanceof Error ? e.message : "An unexpected error occurred.");
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (form: RegistrationForm) => {
    if (!confirm(`Delete "${form.name}"? This cannot be undone.`)) return;
    setDeletingId(form.id);
    try {
      await registrationFormApi.delete(form.id);
      setForms((prev) => prev.filter((f) => f.id !== form.id));
      toast.success("Form deleted");
    } catch (e: unknown) {
      toast.error("Failed to delete form", e instanceof Error ? e.message : "An unexpected error occurred.");
    } finally {
      setDeletingId(null);
    }
  };

  const openCreate = () => {
    setNewName("");
    setNewTitle("");
    setShowCreateDialog(true);
  };

  return (
    <AppLayout title="Registration Forms">
      <div className="space-y-4">
        {/* Header controls */}
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Create and manage registration forms to collect follower information via LINE LIFF.
          </p>
          <Button onClick={openCreate} disabled={!selectedOA}>
            <Plus className="h-4 w-4 mr-1" />
            New Form
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
              Select a LINE OA to view registration forms
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
            <CardContent className="py-12 text-center text-destructive">{error}</CardContent>
          </Card>
        ) : forms.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <ClipboardList className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No registration forms yet</p>
              <p className="text-sm mt-1">
                Create your first form to collect follower data through LINE LIFF.
              </p>
              <Button className="mt-4" onClick={openCreate}>
                <Plus className="h-4 w-4 mr-1" />
                Create First Form
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {forms.map((form) => (
              <Card
                key={form.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => { window.location.href = `/registration-forms/${form.id}`; }}
              >
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{form.name}</p>
                      {form.title && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{form.title}</p>
                      )}
                    </div>
                    <Badge
                      className={
                        form.is_active
                          ? "bg-green-100 text-green-700 border-green-200 flex-shrink-0"
                          : "bg-gray-100 text-gray-500 border-gray-200 flex-shrink-0"
                      }
                    >
                      {form.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>

                  <div className="text-xs text-muted-foreground space-y-0.5">
                    <div className="flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      {form.fields?.length || 0} field{(form.fields?.length || 0) !== 1 ? "s" : ""}
                    </div>
                    <div>{form.submission_count} submission{form.submission_count !== 1 ? "s" : ""}</div>
                    <div>Created {new Date(form.created_at).toLocaleDateString()}</div>
                  </div>

                  <div
                    className="flex gap-1 mt-3"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={togglingId === form.id}
                      onClick={() => handleToggle(form)}
                      className={
                        form.is_active
                          ? "text-gray-600 hover:bg-gray-50"
                          : "text-green-600 border-green-300 hover:bg-green-50"
                      }
                    >
                      {togglingId === form.id ? (
                        <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                      ) : form.is_active ? (
                        <ToggleRight className="h-3 w-3 mr-1" />
                      ) : (
                        <ToggleLeft className="h-3 w-3 mr-1" />
                      )}
                      {form.is_active ? "Deactivate" : "Activate"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={deletingId === form.id}
                      onClick={() => handleDelete(form)}
                    >
                      {deletingId === form.id ? (
                        <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                      ) : (
                        <Trash2 className="h-3 w-3 mr-1 text-destructive" />
                      )}
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create Form Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Registration Form</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2 px-6">
            <div className="space-y-2">
              <Label htmlFor="create-name">Form Name *</Label>
              <Input
                id="create-name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Customer Registration, Lead Capture"
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-title">Display Title</Label>
              <Input
                id="create-title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Title shown to users filling the form"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateDialog(false);
                setNewName("");
                setNewTitle("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!newName.trim() || !selectedOA || creating}
              className="bg-green-600 hover:bg-green-700"
            >
              {creating ? "Creating..." : "Create Form"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
