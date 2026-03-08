import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen, ArrowRight, Webhook, Link2, Zap, Code2,
  CheckCircle, Copy, ChevronDown, ChevronUp
} from "lucide-react";
import { useState } from "react";

// ---- Code Sample Component ----
function CodeBlock({ code, language = "json" }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group">
      <pre className={`bg-slate-900 text-slate-100 rounded-lg p-4 overflow-x-auto text-xs font-mono leading-relaxed language-${language}`}>
        <code>{code}</code>
      </pre>
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-700 hover:bg-slate-600 text-slate-300 rounded px-2 py-1 text-xs flex items-center gap-1"
      >
        {copied ? <CheckCircle size={12} /> : <Copy size={12} />}
        {copied ? "Copied!" : "Copy"}
      </button>
    </div>
  );
}

// ---- Collapsible Section ----
function Section({ title, icon: Icon, children, defaultOpen = true }: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Card>
      <CardHeader
        className="cursor-pointer select-none"
        onClick={() => setOpen(!open)}
      >
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <Icon size={16} />
            {title}
          </span>
          {open ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
        </CardTitle>
      </CardHeader>
      {open && <CardContent>{children}</CardContent>}
    </Card>
  );
}

// ---- Main Component ----
export function IntegrationGuidePage() {
  return (
    <AppLayout title="Integration Guide">
      <div className="space-y-6 max-w-3xl">

        {/* Header banner */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 p-2 bg-green-100 rounded-lg">
              <BookOpen size={20} className="text-green-700" />
            </div>
            <div>
              <h2 className="font-semibold text-green-900">BOLA Identity Bridge</h2>
              <p className="text-sm text-green-800 mt-1">
                Connect LINE followers to your external system (OC2Plus, CRM, ERP, etc.) using LINE User IDs.
                BOLA acts as the bridge: it stores LINE identity and delivers follower events to your system in real time.
              </p>
            </div>
          </div>
        </div>

        {/* Flow Diagram */}
        <Section title="How It Works" icon={Zap}>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              There are two ways your external system can receive LINE follower data:
            </p>

            {/* Flow 1: Outbound webhook */}
            <div className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Option 1</Badge>
                <span className="font-medium text-sm">Outbound Webhook (Real-time push)</span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <span className="bg-green-100 text-green-800 rounded px-2 py-0.5 font-medium">LINE User follows OA</span>
                <ArrowRight size={14} className="flex-shrink-0" />
                <span className="bg-blue-100 text-blue-800 rounded px-2 py-0.5 font-medium">BOLA stores LINE UID</span>
                <ArrowRight size={14} className="flex-shrink-0" />
                <span className="bg-purple-100 text-purple-800 rounded px-2 py-0.5 font-medium">BOLA POSTs event to your URL</span>
                <ArrowRight size={14} className="flex-shrink-0" />
                <span className="bg-orange-100 text-orange-800 rounded px-2 py-0.5 font-medium">Your system saves line_user_id</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Configure your webhook URL in <strong>Settings → Outbound Events</strong>. BOLA will POST a JSON payload every time someone follows or unfollows.
              </p>
            </div>

            {/* Flow 2: APM webhook */}
            <div className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">Option 2</Badge>
                <span className="font-medium text-sm">Auto Push Message Webhook (On-demand trigger)</span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <span className="bg-orange-100 text-orange-800 rounded px-2 py-0.5 font-medium">Your system POSTs to APM webhook</span>
                <ArrowRight size={14} className="flex-shrink-0" />
                <span className="bg-blue-100 text-blue-800 rounded px-2 py-0.5 font-medium">BOLA looks up follower</span>
                <ArrowRight size={14} className="flex-shrink-0" />
                <span className="bg-green-100 text-green-800 rounded px-2 py-0.5 font-medium">BOLA sends LINE message</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Trigger message delivery from your system when a business event occurs (e.g. order shipped, reward earned).
              </p>
            </div>
          </div>
        </Section>

        {/* Outbound Webhook Events */}
        <Section title="Outbound Webhook Payload" icon={Webhook}>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              When configured, BOLA sends a <code className="bg-muted px-1 rounded text-xs">POST</code> request to your URL with this JSON body:
            </p>

            <CodeBlock language="json" code={`{
  "event_type": "follow",          // "follow" | "unfollow"
  "line_user_id": "U5432d9b2b5211a6af7e24ccd31f93a49",
  "line_oa_id": "oa_abc123",
  "workspace_id": "00000000-0000-0000-0000-000000000001",
  "display_name": "Jane Doe",
  "picture_url": "https://profile.line-scdn.net/...",
  "email": "jane@example.com",
  "phone": "+1234567890",
  "custom_fields": {
    "oc2plus_id": "MEM-123",       // populated if already linked
    "employee_id": "EMP-456"
  },
  "triggered_at": "2026-03-07T10:00:00Z"
}`} />

            <div className="space-y-2">
              <p className="text-sm font-medium">Request Headers</p>
              <CodeBlock language="http" code={`POST /your/webhook HTTP/1.1
Content-Type: application/json
X-BOLA-Signature: sha256=abc123...  // HMAC-SHA256, only if secret is set`} />
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
              <strong>Verify the signature:</strong> Compute <code className="bg-amber-100 px-1 rounded">HMAC-SHA256(secret, body)</code> and compare with the <code className="bg-amber-100 px-1 rounded">X-BOLA-Signature</code> header value (after stripping the <code className="bg-amber-100 px-1 rounded">sha256=</code> prefix).
            </div>
          </div>
        </Section>

        {/* Identity Matching Strategy */}
        <Section title="Identity Matching Strategy" icon={Link2}>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              When BOLA POSTs a webhook event, your external system needs to identify which customer the LINE account belongs to.
              BOLA provides three complementary approaches — use them in order of preference for maximum matching success.
            </p>

            <div className="space-y-3">
              {/* Approach 1 */}
              <div className="border rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Approach 1</Badge>
                  <span className="font-medium text-sm">Pre-linking (Highest confidence)</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  If you've already linked the LINE User ID to your customer record via <code className="bg-muted px-1 rounded">/v1/followers/link</code>,
                  the webhook payload will include <code className="bg-muted px-1 rounded">custom_fields</code> with your external ID.
                  This is the most reliable approach.
                </p>
                <CodeBlock language="json" code={`// Webhook payload includes your linked ID
{
  "line_user_id": "Uabc123",
  "custom_fields": {
    "oc2plus_id": "MEM-123",
    "employee_id": "EMP-456"
  }
}

// Your system: Look up customer by custom_field
GET /customers?oc2plus_id=MEM-123`} />
              </div>

              {/* Approach 2 */}
              <div className="border rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Approach 2</Badge>
                  <span className="font-medium text-sm">Contact Matching (Good)</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  If pre-linking doesn't apply, match by email or phone from the webhook payload. This works if the LINE follower
                  has provided their contact info and it matches your customer database.
                </p>
                <CodeBlock language="json" code={`// Webhook payload includes contact info
{
  "line_user_id": "Uabc123",
  "display_name": "Jane Doe",
  "email": "jane@example.com",
  "phone": "+1234567890"
}

// Your system: Find customer by email
SELECT * FROM customers WHERE email = "jane@example.com"

// If found, optionally link for future webhooks:
POST /v1/followers/link {
  "line_oa_id": "...",
  "line_user_id": "Uabc123",
  "external_system": "oc2plus",
  "external_id": "MEM-456"
}`} />
              </div>

              {/* Approach 3 */}
              <div className="border rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Approach 3</Badge>
                  <span className="font-medium text-sm">Lookup Fallback (If pre-link fails)</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  If you don't have pre-linked data, use the Lookup API to query BOLA for the follower and verify their identity.
                  This is useful as a fallback when email/phone matching doesn't work.
                </p>
                <CodeBlock language="http" code={`// Check if follower is already linked to an external ID
GET /v1/followers/lookup?line_oa_id=oa_abc123&custom_field_key=email&custom_field_value=jane@example.com

// Response
{
  "data": [{
    "line_user_id": "Uabc123",
    "display_name": "Jane Doe",
    "email": "jane@example.com",
    "custom_fields": { ... }
  }]
}`} />
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-900">
              <strong>Recommended Flow:</strong>
              <ol className="list-decimal list-inside mt-2 space-y-1 text-xs">
                <li>Check webhook <code className="bg-blue-100 px-1 rounded">custom_fields</code> for pre-linked external ID</li>
                <li>If not found, match webhook <code className="bg-blue-100 px-1 rounded">email</code> or <code className="bg-blue-100 px-1 rounded">phone</code> to your DB</li>
                <li>If still no match, call <code className="bg-blue-100 px-1 rounded">GET /v1/followers/lookup</code> to verify identity</li>
                <li>After identifying the customer, call <code className="bg-blue-100 px-1 rounded">POST /v1/followers/link</code> to store the mapping</li>
              </ol>
            </div>
          </div>
        </Section>

        {/* Verification Code Samples */}
        <Section title="Signature Verification Code" icon={Code2} defaultOpen={false}>
          <div className="space-y-4">

            {/* Node.js */}
            <div>
              <p className="text-sm font-medium mb-2">Node.js / Express</p>
              <CodeBlock language="javascript" code={`const crypto = require('crypto');

function verifyBolaSignature(secret, rawBody, signatureHeader) {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');
  const received = signatureHeader.replace('sha256=', '');
  return crypto.timingSafeEqual(
    Buffer.from(expected, 'hex'),
    Buffer.from(received, 'hex')
  );
}

app.post('/webhooks/bola', express.raw({ type: 'application/json' }), (req, res) => {
  const sig = req.headers['x-bola-signature'];
  if (!verifyBolaSignature(process.env.BOLA_SECRET, req.body, sig)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  const event = JSON.parse(req.body);
  console.log('Follower event:', event.event_type, event.line_user_id);
  // Save line_user_id to your database...
  res.json({ ok: true });
});`} />
            </div>

            {/* Python */}
            <div>
              <p className="text-sm font-medium mb-2">Python / Flask</p>
              <CodeBlock language="python" code={`import hmac, hashlib, os
from flask import Flask, request, jsonify

app = Flask(__name__)

def verify_signature(secret, body, signature_header):
    expected = hmac.new(
        secret.encode(), body, hashlib.sha256
    ).hexdigest()
    received = signature_header.replace('sha256=', '')
    return hmac.compare_digest(expected, received)

@app.route('/webhooks/bola', methods=['POST'])
def bola_webhook():
    sig = request.headers.get('X-BOLA-Signature', '')
    if not verify_signature(os.environ['BOLA_SECRET'], request.data, sig):
        return jsonify(error='Invalid signature'), 401
    event = request.json
    print(f"Follower event: {event['event_type']} {event['line_user_id']}")
    # Save line_user_id to your database...
    return jsonify(ok=True)`} />
            </div>

            {/* PHP */}
            <div>
              <p className="text-sm font-medium mb-2">PHP</p>
              <CodeBlock language="php" code={`<?php
function verifyBolaSignature(string $secret, string $body, string $sigHeader): bool {
    $expected = hash_hmac('sha256', $body, $secret);
    $received = str_replace('sha256=', '', $sigHeader);
    return hash_equals($expected, $received);
}

$body = file_get_contents('php://input');
$sig  = $_SERVER['HTTP_X_BOLA_SIGNATURE'] ?? '';

if (!verifyBolaSignature(getenv('BOLA_SECRET'), $body, $sig)) {
    http_response_code(401);
    echo json_encode(['error' => 'Invalid signature']);
    exit;
}

$event = json_decode($body, true);
// Save $event['line_user_id'] to your database...
echo json_encode(['ok' => true]);`} />
            </div>
          </div>
        </Section>

        {/* Follower Linking API */}
        <Section title="Follower Linking API" icon={Link2} defaultOpen={false}>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              After receiving a follower event, link the LINE User ID to your customer record. This stores your external ID in BOLA's <code className="bg-muted px-1 rounded text-xs">custom_fields</code> so you can look up followers by your own IDs later.
            </p>

            <div className="space-y-2">
              <p className="text-sm font-medium">Link a Follower</p>
              <CodeBlock language="http" code={`POST /v1/followers/link
Content-Type: application/json

{
  "line_oa_id": "oa_abc123",
  "line_user_id": "U5432d9b2b5211a6af7e24ccd31f93a49",
  "external_system": "oc2plus",   // becomes "oc2plus_id" in custom_fields
  "external_id": "MEM-123"
}`} />
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Lookup Follower by External ID</p>
              <CodeBlock language="http" code={`GET /v1/followers/lookup?line_oa_id=oa_abc123&custom_field_key=oc2plus_id&custom_field_value=MEM-123

// Response
{
  "data": [{
    "id": "follower_uuid",
    "line_user_id": "U5432d9b2b5211a6af7e24ccd31f93a49",
    "display_name": "John Doe",
    "custom_fields": { "oc2plus_id": "MEM-123" },
    ...
  }]
}`} />
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Trigger Auto Push Message</p>
              <CodeBlock language="http" code={`POST /webhook/apm/{auto_push_message_id}
Content-Type: application/json

// Target by LINE User ID (direct)
{
  "target_line_user_id": "U5432d9b2b5211a6af7e24ccd31f93a49"
}

// OR target by your external ID (identity bridge)
{
  "target_by": {
    "field": "oc2plus_id",
    "value": "MEM-123"
  }
}`} />
            </div>
          </div>
        </Section>

        {/* Step-by-step setup */}
        <Section title="Quick Setup Checklist" icon={CheckCircle} defaultOpen={false}>
          <div className="space-y-3">
            {[
              {
                step: 1,
                title: "Connect a LINE OA",
                desc: "Go to LINE OA → Add OA. Enter Channel ID, Channel Secret, and Channel Access Token.",
                href: "/line-oa",
                linkLabel: "Go to LINE OA →"
              },
              {
                step: 2,
                title: "Configure Outbound Webhook",
                desc: "Go to Settings → Outbound Events. Enter your server URL and an optional signing secret.",
                href: "/settings",
                linkLabel: "Go to Settings →"
              },
              {
                step: 3,
                title: "Handle the webhook in your system",
                desc: "When BOLA POSTs a follow event, extract line_user_id and store it alongside your customer record.",
                href: null,
                linkLabel: null
              },
              {
                step: 4,
                title: "Link the follower (optional but recommended)",
                desc: "POST to /v1/followers/link with the line_user_id and your customer ID. This enables reverse lookups.",
                href: null,
                linkLabel: null
              },
              {
                step: 5,
                title: "Create an Auto Push Message",
                desc: "Go to Auto Push Messages → New. Configure the message content. Use the webhook URL to trigger it from your system.",
                href: "/auto-push-messages",
                linkLabel: "Go to Auto Push Messages →"
              },
            ].map((item) => (
              <div key={item.step} className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center mt-0.5">
                  {item.step}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                  {item.href && (
                    <a href={item.href} className="text-xs text-primary hover:underline mt-0.5 inline-flex items-center gap-0.5">
                      {item.linkLabel} <ArrowRight size={10} />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Full API reference footer */}
        <div className="text-center py-4 text-sm text-muted-foreground">
          Need more details? Check the{" "}
          <a href="/webhook-settings" className="text-primary hover:underline">Webhook Settings</a>
          {" "}page for LINE webhook configuration, or view{" "}
          <a href="/settings" className="text-primary hover:underline">Settings</a>
          {" "}to configure the outbound webhook URL.
        </div>

      </div>
    </AppLayout>
  );
}
