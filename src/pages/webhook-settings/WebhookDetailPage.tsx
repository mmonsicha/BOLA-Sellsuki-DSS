import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Copy,
  Check,
  Zap,
  AlertCircle,
  Shield,
  Eye,
  EyeOff,
} from "lucide-react";
import { useState, useEffect } from "react";
import { webhookSettingApi } from "@/api/webhookSetting";
import { CopyButton } from "@/components/CopyButton";
import { WebhookTestResultModal } from "@/components/WebhookTestResultModal";
import type { WebhookSetting, TestWebhookResponse } from "@/types";

const statusVariant = {
  active: "success" as const,
  inactive: "secondary" as const,
};

const typeVariant = {
  "LINE-HOOK": "default" as const,
  HOOK: "outline" as const,
};

// ─── Helper Components ─────────────────────────────────────────────────────────

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function ReadonlyInput({ value }: { value: string }) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="text"
        readOnly
        value={value}
        className="flex-1 border rounded-md px-3 py-2 text-sm bg-muted text-muted-foreground cursor-default focus:outline-none font-mono"
      />
      <CopyButton value={value} />
    </div>
  );
}

function SecretInput({ value }: { value: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="flex items-center gap-2">
      <div className="relative flex-1">
        <input
          type={show ? "text" : "password"}
          readOnly
          value={value}
          className="w-full border rounded-md px-3 py-2 pr-9 text-sm bg-muted text-muted-foreground cursor-default focus:outline-none font-mono"
        />
        <button
          onClick={() => setShow(!show)}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      <CopyButton value={value} />
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────────

export function WebhookDetailPage() {
  const webhookId = window.location.pathname.split("/")[2];
  const [webhook, setWebhook] = useState<WebhookSetting | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [testResult, setTestResult] = useState<TestWebhookResponse | null>(null);
  const [testing, setTesting] = useState(false);
  const [regeneratingToken, setRegeneratingToken] = useState(false);
  const [regenerateConfirmOpen, setRegenerateConfirmOpen] = useState(false);

  // Load webhook details
  useEffect(() => {
    const loadWebhook = async () => {
      try {
        const data = await webhookSettingApi.get(webhookId);
        setWebhook(data);
        setError(null);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load webhook"
        );
      } finally {
        setLoading(false);
      }
    };
    loadWebhook();
  }, [webhookId]);

  const handleTestWebhook = async () => {
    setTesting(true);
    try {
      const result = await webhookSettingApi.test(webhookId);
      setTestResult(result);
      setTestModalOpen(true);
    } catch (err) {
      setTestResult({
        success: false,
        webhook_event_id: "",
        event_status: "failed",
        response_time_ms: 0,
        error: err instanceof Error ? err.message : "Test failed",
        message: "Failed to test webhook",
        test_event_id: "",
        timestamp: new Date(),
      });
      setTestModalOpen(true);
    } finally {
      setTesting(false);
    }
  };

  const handleRegenerateToken = async () => {
    setRegeneratingToken(true);
    try {
      const updated = await webhookSettingApi.regenerateToken(webhookId);
      setWebhook(updated);
      setRegenerateConfirmOpen(false);
    } catch (err) {
      console.error("Failed to regenerate token:", err);
    } finally {
      setRegeneratingToken(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-muted-foreground">Loading webhook details...</p>
        </div>
      </AppLayout>
    );
  }

  if (error || !webhook) {
    return (
      <AppLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="mx-auto mb-2 text-destructive" />
            <p className="text-destructive font-medium">
              {error || "Webhook not found"}
            </p>
            <Button
              variant="ghost"
              className="mt-4"
              onClick={() => window.history.back()}
            >
              <ArrowLeft size={16} className="mr-2" />
              Go Back
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6 pb-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.history.back()}
            className="gap-2"
          >
            <ArrowLeft size={16} />
            Back
          </Button>
          <h1 className="text-2xl font-bold flex-1">{webhook.name}</h1>
          <Badge variant={statusVariant[webhook.status]}>
            {webhook.status}
          </Badge>
        </div>

        {/* Basic Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-6">
              <Field label="Type">
                <Badge variant={typeVariant[webhook.webhook_type]}>
                  {webhook.webhook_type}
                </Badge>
              </Field>
              <Field label="Status">
                <Badge variant={statusVariant[webhook.status]}>
                  {webhook.status}
                </Badge>
              </Field>
            </div>

            <Field label="Webhook URL" hint="This is your unique webhook endpoint">
              <ReadonlyInput value={webhook.webhook_url} />
            </Field>

            {webhook.description && (
              <Field label="Description">
                <p className="text-sm text-foreground">
                  {webhook.description}
                </p>
              </Field>
            )}

            {webhook.webhook_event && (
              <Field label="Event Type">
                <Badge variant="outline">{webhook.webhook_event}</Badge>
              </Field>
            )}

            {webhook.category && (
              <Field label="Category">
                <p className="text-sm text-foreground">{webhook.category}</p>
              </Field>
            )}
          </CardContent>
        </Card>

        {/* Configuration Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield size={18} />
              Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {webhook.security_token && (
              <div className="space-y-2">
                <Field label="Security Token" hint="Used for webhook request authorization. Share this with external systems.">
                  <SecretInput value={webhook.security_token} />
                </Field>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setRegenerateConfirmOpen(true)}
                  disabled={regeneratingToken}
                  className="gap-2"
                >
                  🔄 Regenerate Token
                </Button>
                <p className="text-xs text-yellow-600 dark:text-yellow-500">
                  ⚠️ Generating a new token will invalidate the current one. External systems will need to be updated.
                </p>
              </div>
            )}

            {webhook.http_status_code && (
              <div className="grid grid-cols-2 gap-6">
                <Field label="HTTP Status Code">
                  <p className="text-sm font-mono text-foreground">
                    {webhook.http_status_code}
                  </p>
                </Field>
              </div>
            )}

            {webhook.response_msg && (
              <Field label="Response Message">
                <p className="text-sm text-foreground">{webhook.response_msg}</p>
              </Field>
            )}

            {webhook.allowed_ips && webhook.allowed_ips.length > 0 && (
              <Field label="Allowed IP Addresses">
                <div className="space-y-1">
                  {webhook.allowed_ips.map((ip, i) => (
                    <p key={i} className="text-sm font-mono text-foreground">
                      {ip}
                    </p>
                  ))}
                </div>
              </Field>
            )}
          </CardContent>
        </Card>

        {/* Test Webhook Card */}
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-blue-600 dark:text-blue-400">
              <Zap size={18} />
              Test Webhook
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Send a test "follow" event to verify your webhook is properly
              configured. This is a dry run with no side effects.
            </p>
            <div className="flex gap-2">
              <Button
                onClick={handleTestWebhook}
                disabled={testing}
                className="gap-2"
              >
                <Zap size={16} />
                {testing ? "Testing..." : "Test Webhook"}
              </Button>
              <p className="text-xs text-muted-foreground self-center">
                Sends a test "follow" event
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Metadata */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              Metadata
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs text-muted-foreground">
            <p>Created: {new Date(webhook.created_at).toLocaleString()}</p>
            <p>Last Updated: {new Date(webhook.updated_at).toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      {/* Test Result Modal */}
      <WebhookTestResultModal
        open={testModalOpen}
        onClose={() => setTestModalOpen(false)}
        result={testResult || undefined}
        onTestAgain={handleTestWebhook}
      />

      {/* Regenerate Token Confirmation Modal */}
      {regenerateConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
          <div className="bg-white dark:bg-slate-950 rounded-lg shadow-lg p-6 max-w-sm mx-4 space-y-4">
            <h2 className="text-lg font-bold">Regenerate Security Token?</h2>
            <p className="text-sm text-muted-foreground">
              This will create a new security token and invalidate the current one.
              External systems using the old token will no longer be able to send webhook requests.
            </p>
            <p className="text-sm font-medium text-yellow-600 dark:text-yellow-500">
              ⚠️ Make sure to update all external systems with the new token before regenerating.
            </p>
            <div className="flex gap-2 justify-end pt-4">
              <Button
                variant="outline"
                onClick={() => setRegenerateConfirmOpen(false)}
                disabled={regeneratingToken}
              >
                Cancel
              </Button>
              <Button
                onClick={handleRegenerateToken}
                disabled={regeneratingToken}
                className="gap-2"
              >
                {regeneratingToken ? "Regenerating..." : "Regenerate Token"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
