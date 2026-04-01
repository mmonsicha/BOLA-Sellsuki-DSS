import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { parseCSVText, toImportItems, countZeroPrefixPhones, normalizeThaiPhones, type DetectionResult, type ColumnMapping } from "@/lib/csvImport";
import { followerApi } from "@/api/follower";
import type { ImportPhoneContactsPreview } from "@/types";
import { Upload, FileText, ClipboardPaste, CheckCircle2, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";

type WizardStep = "upload" | "map" | "preview" | "result";

interface CsvImportWizardProps {
  open: boolean;
  onClose: () => void;
  lineOAId?: string;
}

// ---- Step indicator ----

const STEPS: { key: WizardStep; label: string }[] = [
  { key: "upload", label: "Upload" },
  { key: "map", label: "Detect" },
  { key: "preview", label: "Preview" },
  { key: "result", label: "Done" },
];

function StepIndicator({ current }: { current: WizardStep }) {
  const idx = STEPS.findIndex((s) => s.key === current);
  return (
    <div className="flex items-center gap-1 mb-4">
      {STEPS.map((s, i) => (
        <div key={s.key} className="flex items-center gap-1">
          <div
            className={cn(
              "flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold",
              i < idx ? "bg-primary text-primary-foreground" :
              i === idx ? "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2" :
              "bg-muted text-muted-foreground"
            )}
          >
            {i + 1}
          </div>
          <span className={cn("text-xs", i === idx ? "text-foreground font-medium" : "text-muted-foreground")}>
            {s.label}
          </span>
          {i < STEPS.length - 1 && <div className="w-6 h-px bg-border mx-1" />}
        </div>
      ))}
    </div>
  );
}

// ---- Column mapping display helper ----

const FIELD_LABELS: Record<keyof Omit<ColumnMapping, never>, string> = {
  phoneCol: "Phone",
  firstNameCol: "First Name",
  lastNameCol: "Last Name",
  fullNameCol: "Full Name (auto-split)",
  emailCol: "Email (detected, not imported yet)",
  lineUidCol: "LINE UID",
};

// ---- Main component ----

export function CsvImportWizard({ open, onClose, lineOAId = "" }: CsvImportWizardProps) {
  const [step, setStep] = useState<WizardStep>("upload");
  const [inputMode, setInputMode] = useState<"paste" | "file">("file");
  const [rawText, setRawText] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [detection, setDetection] = useState<DetectionResult | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [preview, setPreview] = useState<ImportPhoneContactsPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<{ imported: number } | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [errorsExpanded, setErrorsExpanded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  // Reset state when dialog closes/opens
  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setStep("upload");
        setRawText("");
        setFileName(null);
        setDetection(null);
        setUploadError(null);
        setPreview(null);
        setPreviewError(null);
        setImportResult(null);
        setImportError(null);
        setErrorsExpanded(false);
      }, 200);
    }
  }, [open]);

  // Auto-run preview when entering preview step
  useEffect(() => {
    if (step === "preview" && detection && !preview && !previewLoading) {
      void runPreview();
    }
  }, [step]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-run import when entering result step
  useEffect(() => {
    if (step === "result" && detection && !importResult && !importLoading) {
      void runImport();
    }
  }, [step]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleTextChange(text: string) {
    setRawText(text);
    setUploadError(null);
    if (!text.trim()) {
      setDetection(null);
      return;
    }
    tryParse(text);
  }

  function tryParse(text: string) {
    const result = parseCSVText(text);
    if (!result.mapping.phoneCol) {
      setUploadError("ไม่พบคอลัมน์ phone ในไฟล์นี้ — ลอง column ที่มีชื่อ: phone, telephone, tel, mobile, เบอร์");
      setDetection(null);
      return;
    }
    if (result.rows.length === 0) {
      setUploadError("ไม่พบข้อมูลในไฟล์");
      setDetection(null);
      return;
    }
    setDetection(result);
    setUploadError(null);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setRawText(text);
      tryParse(text);
    };
    reader.readAsText(file, "utf-8");
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setRawText(text);
      tryParse(text);
    };
    reader.readAsText(file, "utf-8");
  }

  async function runPreview() {
    if (!detection) return;
    setPreviewLoading(true);
    setPreviewError(null);
    try {
      const items = toImportItems(detection.rows);
      const result = await followerApi.previewImportPhones(lineOAId, items);
      setPreview(result);
    } catch (err) {
      setPreviewError(err instanceof Error ? err.message : "ไม่สามารถตรวจสอบข้อมูลได้");
    } finally {
      setPreviewLoading(false);
    }
  }

  async function runImport() {
    if (!detection) return;
    setImportLoading(true);
    setImportError(null);
    try {
      const items = toImportItems(detection.rows);
      const result = await followerApi.importPhones(lineOAId, items);
      setImportResult(result);
    } catch (err) {
      setImportError(err instanceof Error ? err.message : "นำเข้าข้อมูลไม่สำเร็จ");
    } finally {
      setImportLoading(false);
    }
  }

  function advanceToMap() {
    if (!detection) return;
    setStep("map");
  }

  // ---- Render steps ----

  function renderUpload() {
    const zeroPrefixCount = detection ? countZeroPrefixPhones(detection.rows) : 0;
    return (
      <>
        <DialogHeader>
          <DialogTitle>Import Phone Contacts</DialogTitle>
          <DialogDescription>
            Upload a CSV file — columns are auto-detected, no manual mapping needed.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-4">
          <Tabs value={inputMode} onValueChange={(v) => setInputMode(v as "paste" | "file")}>
            <TabsList className="w-full">
              <TabsTrigger value="file" className="flex-1 gap-1.5">
                <Upload className="w-3.5 h-3.5" />
                Upload CSV
              </TabsTrigger>
              <TabsTrigger value="paste" className="flex-1 gap-1.5">
                <ClipboardPaste className="w-3.5 h-3.5" />
                Paste Text
              </TabsTrigger>
            </TabsList>

            <TabsContent value="file">
              <div
                ref={dropRef}
                className="mt-3 border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/60 hover:bg-muted/30 transition-colors"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
              >
                <FileText className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                {fileName ? (
                  <p className="text-sm font-medium">{fileName}</p>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground">Drag & drop a file here, or click to browse</p>
                    <p className="text-xs text-muted-foreground mt-1">Supports .csv, .txt</p>
                  </>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.txt"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
            </TabsContent>

            <TabsContent value="paste">
              <textarea
                className="mt-3 w-full h-40 rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none font-mono"
                placeholder={"phone,first_name,last_name\n+66812345678,John,Doe\n+66898765432,Jane,Smith"}
                value={rawText}
                onChange={(e) => handleTextChange(e.target.value)}
              />
            </TabsContent>
          </Tabs>

          {uploadError && (
            <p className="mt-2 text-sm text-destructive flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {uploadError}
            </p>
          )}

          {detection && (
            <>
              <p className="mt-2 text-sm text-muted-foreground">
                Found <span className="font-medium text-foreground">{detection.rows.length}</span> rows,{" "}
                phone column: <code className="bg-muted px-1 rounded text-xs">{detection.mapping.phoneCol}</code>
              </p>

              {zeroPrefixCount > 0 && (
                <div className="mt-3 rounded-md bg-amber-50 border border-amber-200 px-3 py-2.5 text-sm">
                  <p className="font-medium text-amber-800 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {zeroPrefixCount} numbers start with 0 — a country code is required to import
                  </p>
                  <p className="text-amber-700 mt-0.5 text-xs">Convert all to +66?</p>
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          {detection && zeroPrefixCount > 0 ? (
            <>
              <Button variant="ghost" onClick={advanceToMap}>Skip</Button>
              <Button onClick={() => {
                setDetection({ ...detection, rows: normalizeThaiPhones(detection.rows), sample: normalizeThaiPhones(detection.sample) });
                setStep("map");
              }}>
                Convert to +66 &amp; Continue
              </Button>
            </>
          ) : (
            <Button onClick={advanceToMap} disabled={!detection}>Next</Button>
          )}
        </DialogFooter>
      </>
    );
  }

  function renderMap() {
    if (!detection) return null;
    const { mapping, headers, sample } = detection;

    const detectedFields = (Object.entries(FIELD_LABELS) as [keyof ColumnMapping, string][])
      .filter(([key]) => mapping[key] !== null);
    const ignoredHeaders = headers.filter(
      (h) => !Object.values(mapping).includes(h)
    );

    return (
      <>
        <DialogHeader>
          <DialogTitle>Columns Detected</DialogTitle>
          <DialogDescription>
            Auto-detected column mapping — review before continuing.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-4">
          <div className="space-y-1.5">
            {detectedFields.map(([key, label]) => (
              <div key={key} className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                <span className="text-muted-foreground">{label}:</span>
                <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">{mapping[key]}</code>
              </div>
            ))}
            {ignoredHeaders.length > 0 && (
              <p className="text-xs text-muted-foreground mt-2">
                Skipped columns: {ignoredHeaders.map((h) => (
                  <code key={h} className="bg-muted px-1 rounded mx-0.5">{h}</code>
                ))}
              </p>
            )}
          </div>

          {sample.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-medium text-muted-foreground mb-1.5">First 5 rows preview</p>
              <div className="overflow-x-auto rounded-md border">
                <table className="w-full text-xs">
                  <thead className="bg-muted">
                    <tr>
                      {mapping.phoneCol && <th className="px-2 py-1.5 text-left font-medium">Phone</th>}
                      {(mapping.firstNameCol || mapping.fullNameCol) && <th className="px-2 py-1.5 text-left font-medium">First Name</th>}
                      {(mapping.lastNameCol || mapping.fullNameCol) && <th className="px-2 py-1.5 text-left font-medium">Last Name</th>}
                      {mapping.emailCol && <th className="px-2 py-1.5 text-left font-medium text-muted-foreground">Email*</th>}
                      {mapping.lineUidCol && <th className="px-2 py-1.5 text-left font-medium">LINE UID</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {sample.map((row, i) => (
                      <tr key={i} className="border-t">
                        {mapping.phoneCol && <td className="px-2 py-1.5 font-mono">{row.phone ?? "-"}</td>}
                        {(mapping.firstNameCol || mapping.fullNameCol) && <td className="px-2 py-1.5">{row.first_name ?? "-"}</td>}
                        {(mapping.lastNameCol || mapping.fullNameCol) && <td className="px-2 py-1.5">{row.last_name ?? "-"}</td>}
                        {mapping.emailCol && <td className="px-2 py-1.5 text-muted-foreground">{row.email ?? "-"}</td>}
                        {mapping.lineUidCol && <td className="px-2 py-1.5 font-mono">{row.line_uid ?? "-"}</td>}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {mapping.emailCol && (
                <p className="text-xs text-muted-foreground mt-1">* Email detected but not yet supported for import</p>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setStep("upload")}>Back</Button>
          <Button onClick={() => setStep("preview")}>Review Data</Button>
        </DialogFooter>
      </>
    );
  }

  function renderPreview() {
    return (
      <>
        <DialogHeader>
          <DialogTitle>Review Before Import</DialogTitle>
          <DialogDescription>
            Data analyzed against existing records — confirm to proceed.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-4">
          {previewLoading && (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Checking data...
            </div>
          )}

          {previewError && (
            <div>
              <p className="text-sm text-destructive flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {previewError}
              </p>
              <Button variant="outline" size="sm" className="mt-3" onClick={() => void runPreview()}>
                Retry
              </Button>
            </div>
          )}

          {preview && !previewLoading && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <StatCard label="New" value={preview.insert_count} color="text-green-600" bg="bg-green-50" />
                <StatCard label="Update" value={preview.update_count} color="text-amber-600" bg="bg-amber-50" />
                <StatCard label="Unchanged" value={preview.skip_count} color="text-muted-foreground" bg="bg-muted" />
                <StatCard label="Errors" value={preview.error_count} color="text-destructive" bg="bg-destructive/10" />
              </div>

              {preview.errors.length > 0 && (
                <div className="border rounded-md overflow-hidden">
                  <button
                    type="button"
                    className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium bg-destructive/5 hover:bg-destructive/10 transition-colors"
                    onClick={() => setErrorsExpanded((v) => !v)}
                  >
                    <span className="text-destructive">Invalid rows ({preview.errors.length})</span>
                    {errorsExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  {errorsExpanded && (
                    <div className="divide-y max-h-40 overflow-y-auto">
                      {preview.errors.map((e, i) => (
                        <div key={i} className="px-3 py-1.5 text-xs flex gap-3">
                          <span className="text-muted-foreground shrink-0">Row {e.row}</span>
                          <code className="font-mono">{e.phone || "(empty)"}</code>
                          <Badge variant="destructive" className="text-[10px] h-4">{e.reason}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => { setPreview(null); setStep("map"); }}>Back</Button>
          <Button
            onClick={() => setStep("result")}
            disabled={!preview || previewLoading || (preview.insert_count + preview.update_count === 0)}
          >
            Import Now ({preview ? preview.insert_count + preview.update_count : 0} records)
          </Button>
        </DialogFooter>
      </>
    );
  }

  function renderResult() {
    return (
      <>
        <DialogHeader>
          <DialogTitle>Import Result</DialogTitle>
        </DialogHeader>

        <div className="px-6 py-4">
          {importLoading && (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Importing...
            </div>
          )}

          {importError && (
            <div className="space-y-3">
              <p className="text-sm text-destructive flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {importError}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => { setImportResult(null); setImportError(null); setStep("preview"); }}>
                  Back
                </Button>
                <Button size="sm" onClick={() => void runImport()}>Retry</Button>
              </div>
            </div>
          )}

          {importResult && !importLoading && (
            <div className="py-4 text-center space-y-2">
              <CheckCircle2 className="w-12 h-12 mx-auto text-green-500" />
              <p className="text-lg font-semibold">Import successful!</p>
              <p className="text-sm text-muted-foreground">
                Added / updated{" "}
                <span className="font-medium text-foreground">{importResult.imported}</span>{" "}
                contacts
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button onClick={onClose}>Done</Button>
        </DialogFooter>
      </>
    );
  }

  function renderStep() {
    switch (step) {
      case "upload": return renderUpload();
      case "map": return renderMap();
      case "preview": return renderPreview();
      case "result": return renderResult();
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-lg">
        <div className="px-6 pt-5">
          <StepIndicator current={step} />
        </div>
        {renderStep()}
      </DialogContent>
    </Dialog>
  );
}

// ---- Stat card ----

function StatCard({ label, value, color, bg }: { label: string; value: number; color: string; bg: string }) {
  return (
    <div className={cn("rounded-lg p-3 text-center", bg)}>
      <p className={cn("text-2xl font-bold", color)}>{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}
