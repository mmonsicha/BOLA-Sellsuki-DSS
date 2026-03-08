import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { aiChatbotConfigApi } from "@/api/aiChatbot";
import type { AIChatbotConfig, LineOA } from "@/types";
import { lineOAApi } from "@/api/lineOA";
import { Bot, Save, ToggleLeft, ToggleRight } from "lucide-react";

const WORKSPACE_ID = "00000000-0000-0000-0000-000000000001";

const LLM_PROVIDERS = [
  { value: "openai", label: "OpenAI" },
  { value: "anthropic", label: "Anthropic (Claude)" },
  { value: "google", label: "Google (Gemini)" },
  { value: "custom", label: "Custom (OpenAI-compatible)" },
];

const LLM_MODELS: Record<string, string[]> = {
  openai: ["gpt-4o-mini", "gpt-4o", "gpt-4-turbo", "gpt-3.5-turbo"],
  anthropic: ["claude-haiku-4-5", "claude-sonnet-4-5", "claude-3-haiku-20240307"],
  google: ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-2.0-flash"],
  custom: [],
};

export function ChatbotSettingsPage() {
  const [lineOAs, setLineOAs] = useState<LineOA[]>([]);
  const [selectedOAId, setSelectedOAId] = useState<string>("");
  const [config, setConfig] = useState<AIChatbotConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [form, setForm] = useState({
    is_enabled: false,
    enable_group_chat: false,
    group_chat_trigger_prefix: "!ask",
    llm_provider: "openai",
    llm_model: "gpt-4o-mini",
    llm_api_key: "",
    llm_api_base_url: "",
    llm_temperature: 0.3,
    system_prompt: "",
    confidence_threshold: 0.7,
    max_context_turns: 10,
    fallback_message: "I'm not sure about that. Let me connect you with our team.",
  });

  useEffect(() => {
    lineOAApi.list({ workspace_id: WORKSPACE_ID }).then((res) => {
      const oas = res.data ?? [];
      setLineOAs(oas);
      if (oas.length > 0) setSelectedOAId(oas[0].id);
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (!selectedOAId) return;
    setLoading(true);
    setConfig(null);
    aiChatbotConfigApi.get(selectedOAId)
      .then((cfg) => {
        setConfig(cfg);
        setForm({
          is_enabled: cfg.is_enabled,
          enable_group_chat: cfg.enable_group_chat,
          group_chat_trigger_prefix: cfg.group_chat_trigger_prefix || "!ask",
          llm_provider: cfg.llm_provider || "openai",
          llm_model: cfg.llm_model || "gpt-4o-mini",
          llm_api_key: "", // never pre-fill the key
          llm_api_base_url: cfg.llm_api_base_url || "",
          llm_temperature: cfg.llm_temperature ?? 0.3,
          system_prompt: cfg.system_prompt || "",
          confidence_threshold: cfg.confidence_threshold ?? 0.7,
          max_context_turns: cfg.max_context_turns ?? 10,
          fallback_message: cfg.fallback_message || "I'm not sure about that. Let me connect you with our team.",
        });
      })
      .catch(() => {
        // Config not found for this OA — reset to defaults
        setConfig(null);
        setForm({
          is_enabled: false,
          enable_group_chat: false,
          group_chat_trigger_prefix: "!ask",
          llm_provider: "openai",
          llm_model: "gpt-4o-mini",
          llm_api_key: "",
          llm_api_base_url: "",
          llm_temperature: 0.3,
          system_prompt: "",
          confidence_threshold: 0.7,
          max_context_turns: 10,
          fallback_message: "I'm not sure about that. Let me connect you with our team.",
        });
      })
      .finally(() => setLoading(false));
  }, [selectedOAId]);

  const handleSave = async () => {
    if (!selectedOAId) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await aiChatbotConfigApi.upsert({
        workspace_id: WORKSPACE_ID,
        line_oa_id: selectedOAId,
        ...form,
      });
      setSuccess("Chatbot settings saved successfully.");
      setTimeout(() => setSuccess(null), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async () => {
    if (!selectedOAId) return;
    const newEnabled = !form.is_enabled;
    try {
      await aiChatbotConfigApi.toggle(selectedOAId, newEnabled);
      setForm((f) => ({ ...f, is_enabled: newEnabled }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to toggle chatbot");
    }
  };

  const update = (key: string, value: unknown) => setForm((f) => ({ ...f, [key]: value }));

  return (
    <AppLayout title="AI Chatbot Settings">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot size={20} />
            <p className="text-sm text-muted-foreground">Configure AI chatbot per LINE OA</p>
          </div>
          <div className="flex items-center gap-2">
            {config && (
              <button onClick={handleToggle} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                {form.is_enabled
                  ? <ToggleRight size={20} className="text-green-600" />
                  : <ToggleLeft size={20} />}
                <span>{form.is_enabled ? "Enabled" : "Disabled"}</span>
              </button>
            )}
            <Button onClick={handleSave} disabled={saving || !selectedOAId} size="sm">
              <Save size={14} className="mr-1" />
              {saving ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </div>

        {/* OA Selector */}
        <Card>
          <CardContent className="pt-4">
            <label className="block text-sm font-medium mb-1">LINE OA</label>
            <select
              className="w-full border rounded-md px-3 py-2 text-sm"
              value={selectedOAId}
              onChange={(e) => setSelectedOAId(e.target.value)}
            >
              {lineOAs.map((oa) => (
                <option key={oa.id} value={oa.id}>{oa.name}</option>
              ))}
            </select>
          </CardContent>
        </Card>

        {error && <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">{error}</div>}
        {success && <div className="p-3 bg-green-50 border border-green-200 rounded-md text-sm text-green-700">{success}</div>}

        {loading ? (
          <div className="text-center py-8 text-muted-foreground text-sm">Loading...</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* LLM Provider */}
            <Card>
              <CardHeader><CardTitle className="text-base">LLM Provider</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Provider</label>
                  <select
                    className="w-full border rounded-md px-3 py-2 text-sm"
                    value={form.llm_provider}
                    onChange={(e) => {
                      update("llm_provider", e.target.value);
                      const models = LLM_MODELS[e.target.value] || [];
                      if (models.length > 0) update("llm_model", models[0]);
                    }}
                  >
                    {LLM_PROVIDERS.map((p) => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Model</label>
                  {LLM_MODELS[form.llm_provider]?.length > 0 ? (
                    <select
                      className="w-full border rounded-md px-3 py-2 text-sm"
                      value={form.llm_model}
                      onChange={(e) => update("llm_model", e.target.value)}
                    >
                      {LLM_MODELS[form.llm_provider].map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      className="w-full border rounded-md px-3 py-2 text-sm"
                      value={form.llm_model}
                      onChange={(e) => update("llm_model", e.target.value)}
                      placeholder="e.g. gpt-4o-mini"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    API Key
                    {config && <Badge variant="secondary" className="ml-2 text-xs">already set</Badge>}
                  </label>
                  <input
                    type="password"
                    className="w-full border rounded-md px-3 py-2 text-sm"
                    value={form.llm_api_key}
                    onChange={(e) => update("llm_api_key", e.target.value)}
                    placeholder={config ? "Leave blank to keep existing key" : "Enter API key"}
                  />
                </div>

                {(form.llm_provider === "custom" || form.llm_provider === "openai") && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Base URL (optional)</label>
                    <input
                      type="text"
                      className="w-full border rounded-md px-3 py-2 text-sm"
                      value={form.llm_api_base_url}
                      onChange={(e) => update("llm_api_base_url", e.target.value)}
                      placeholder="https://api.openai.com"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Temperature: {form.llm_temperature.toFixed(2)}
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    className="w-full"
                    value={form.llm_temperature}
                    onChange={(e) => update("llm_temperature", parseFloat(e.target.value))}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>Precise (0)</span>
                    <span>Creative (1)</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Behavior */}
            <Card>
              <CardHeader><CardTitle className="text-base">Behavior</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Confidence Threshold: {form.confidence_threshold.toFixed(2)}
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    className="w-full"
                    value={form.confidence_threshold}
                    onChange={(e) => update("confidence_threshold", parseFloat(e.target.value))}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>Low (0)</span>
                    <span>High (1)</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Max Context Turns</label>
                  <input
                    type="number"
                    className="w-full border rounded-md px-3 py-2 text-sm"
                    min={1}
                    max={50}
                    value={form.max_context_turns}
                    onChange={(e) => update("max_context_turns", parseInt(e.target.value) || 10)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Fallback Message</label>
                  <textarea
                    className="w-full border rounded-md px-3 py-2 text-sm resize-none"
                    rows={3}
                    value={form.fallback_message}
                    onChange={(e) => update("fallback_message", e.target.value)}
                    placeholder="Message sent when AI cannot answer..."
                  />
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="group_chat"
                    checked={form.enable_group_chat}
                    onChange={(e) => update("enable_group_chat", e.target.checked)}
                  />
                  <label htmlFor="group_chat" className="text-sm font-medium">Enable Group Chat</label>
                </div>

                {form.enable_group_chat && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Group Chat Trigger Prefix</label>
                    <input
                      type="text"
                      className="w-full border rounded-md px-3 py-2 text-sm"
                      value={form.group_chat_trigger_prefix}
                      onChange={(e) => update("group_chat_trigger_prefix", e.target.value)}
                      placeholder="!ask"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* System Prompt */}
            <Card className="lg:col-span-2">
              <CardHeader><CardTitle className="text-base">System Prompt</CardTitle></CardHeader>
              <CardContent>
                <textarea
                  className="w-full border rounded-md px-3 py-2 text-sm resize-none font-mono"
                  rows={8}
                  value={form.system_prompt}
                  onChange={(e) => update("system_prompt", e.target.value)}
                  placeholder="You are a helpful customer service assistant for [Company Name]. Answer questions based on the provided knowledge base context. Be concise and friendly."
                />
                <p className="text-xs text-muted-foreground mt-1">
                  The system prompt sets the AI's persona and behavior. Leave blank for a sensible default.
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
