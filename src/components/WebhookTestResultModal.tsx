import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  X,
} from "lucide-react";
import { useState } from "react";
import type { TestWebhookResponse } from "@/types";

interface WebhookTestResultModalProps {
  open: boolean;
  onClose: () => void;
  result?: TestWebhookResponse;
  onTestAgain?: () => void;
  isLoading?: boolean;
}

export function WebhookTestResultModal({
  open,
  onClose,
  result,
  onTestAgain,
  isLoading,
}: WebhookTestResultModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyResponse = () => {
    if (result?.webhook_event_id) {
      navigator.clipboard.writeText(result.webhook_event_id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getStatusIcon = () => {
    if (isLoading) return null;
    if (result?.success) {
      return <CheckCircle2 className="text-green-500" size={24} />;
    }
    return <AlertCircle className="text-red-500" size={24} />;
  };

  const getStatusColor = () => {
    if (isLoading) return "text-muted-foreground";
    if (result?.success) return "text-green-600 dark:text-green-400";
    return "text-red-600 dark:text-red-400";
  };

  const getStatusText = () => {
    if (isLoading) return "Testing...";
    if (result?.success) return "✅ Success";
    return "❌ Failed";
  };


  return (
    <Dialog open={open} onClose={onClose} title="Webhook Test Result">
      <div className="space-y-6 max-w-2xl">
        {/* Status Section */}
        {isLoading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin">
              <RefreshCw className="text-blue-500" size={32} />
            </div>
            <p className="mt-4 text-muted-foreground">Testing webhook...</p>
          </div>
        )}

        {!isLoading && result && (
          <>
            {/* Overall Status */}
            <div className="flex items-center gap-4 p-4 rounded-lg bg-muted">
              {getStatusIcon()}
              <div className="flex-1">
                <p className={`text-lg font-semibold ${getStatusColor()}`}>
                  {getStatusText()}
                </p>
                <p className="text-sm text-muted-foreground">
                  {result.message}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0"
              >
                <X size={16} />
              </Button>
            </div>

            {/* Details */}
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                {/* Webhook Event ID */}
                <div className="p-3 rounded-lg bg-muted">
                  <p className="text-xs text-muted-foreground mb-1">
                    Webhook Event ID
                  </p>
                  <p className="text-xs font-mono text-foreground truncate" title={result.webhook_event_id}>
                    {result.webhook_event_id?.substring(0, 12)}...
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    (check database)
                  </p>
                </div>

                {/* Event Status */}
                <div className="p-3 rounded-lg bg-muted">
                  <p className="text-xs text-muted-foreground mb-1">
                    Processing Status
                  </p>
                  <p className={`text-sm font-bold ${
                    result.event_status === 'processed' ? 'text-green-600 dark:text-green-400' :
                    result.event_status === 'failed' ? 'text-red-600 dark:text-red-400' :
                    'text-yellow-600 dark:text-yellow-400'
                  }`}>
                    {result.event_status?.toUpperCase() || 'UNKNOWN'}
                  </p>
                </div>

                {/* Response Time */}
                <div className="p-3 rounded-lg bg-muted">
                  <p className="text-xs text-muted-foreground mb-1">
                    Processing Time
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {result.response_time_ms}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    milliseconds
                  </p>
                </div>
              </div>

              {/* Error Message */}
              {result.error && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
                  <p className="text-xs font-medium text-red-600 dark:text-red-400 mb-1">
                    Error Details
                  </p>
                  <p className="text-sm text-red-600 dark:text-red-400 font-mono">
                    {result.error}
                  </p>
                </div>
              )}

              {/* Troubleshooting Tips */}
              {!result.success && (
                <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                  <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-2">
                    💡 Troubleshooting Tips
                  </p>
                  <ul className="text-xs text-blue-600 dark:text-blue-400 space-y-1 list-disc list-inside">
                    {result.error?.toLowerCase().includes('invalid signature') && (
                      <>
                        <li>Check that the LINE OA channel secret is correct</li>
                        <li>Verify the webhook is correctly associated with the LINE OA</li>
                      </>
                    )}
                    {result.error?.toLowerCase().includes('unauthorized') && (
                      <>
                        <li>Verify the security token in the webhook settings</li>
                        <li>Ensure the X-Security-Token header is correct</li>
                      </>
                    )}
                    {result.error?.toLowerCase().includes('ip') && (
                      <>
                        <li>Check the IP whitelist configuration in webhook settings</li>
                        <li>Verify your IP address is in the allowed list (if configured)</li>
                      </>
                    )}
                    {!result.error?.toLowerCase().includes('invalid signature') &&
                     !result.error?.toLowerCase().includes('unauthorized') &&
                     !result.error?.toLowerCase().includes('ip') && (
                      <>
                        <li>Check the error details for specific failure reason</li>
                        <li>Review BOLA server logs for more information</li>
                        <li>Verify the webhook configuration is valid</li>
                      </>
                    )}
                  </ul>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={onClose} className="flex-1">
                Close
              </Button>
              {onTestAgain && (
                <Button onClick={onTestAgain} className="flex-1 gap-2">
                  <RefreshCw size={16} />
                  Test Again
                </Button>
              )}
            </div>
          </>
        )}

        {!isLoading && !result && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No test result available</p>
            <Button onClick={onClose} variant="ghost" className="mt-4">
              Close
            </Button>
          </div>
        )}
      </div>
    </Dialog>
  );
}
