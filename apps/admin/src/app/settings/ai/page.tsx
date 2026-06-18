"use client";

import { useEffect, useState, useCallback } from "react";
import { Surface } from "@repo/ui/react";

type AiStatus = {
  source: string;
  configured: boolean;
  maskedKey: string | null;
};

type ConnectionState = "untested" | "testing" | "connected" | "failed";
type OpenRouterModel = { id: string; name: string };
type Tab = "providers" | "prompts" | "usage";

type ProviderUsage = {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  requests: number;
};

const PROVIDERS = [
  {
    id: "anthropic",
    label: "Anthropic Claude",
    placeholder: "sk-ant-…",
    color: "#d97706",
    bg: "rgba(217,119,6,0.12)",
    desc: "Claude Haiku / Sonnet — سریع و دقیق",
    docUrl: "https://console.anthropic.com/",
  },
  {
    id: "gemini",
    label: "Google Gemini",
    placeholder: "AIza…",
    color: "#4285F4",
    bg: "rgba(66,133,244,0.12)",
    desc: "Gemini 2.0 Flash — رایگان و قدرتمند",
    docUrl: "https://aistudio.google.com/",
  },
  {
    id: "openrouter",
    label: "OpenRouter",
    placeholder: "sk-or-v1-…",
    color: "#10b981",
    bg: "rgba(16,185,129,0.12)",
    desc: "دسترسی به ۲۰۰+ مدل مختلف",
    docUrl: "https://openrouter.ai/keys",
  },
  {
    id: "deepseek",
    label: "DeepSeek",
    placeholder: "sk-…",
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.12)",
    desc: "DeepSeek Chat — ارزان و کارآمد",
    docUrl: "https://platform.deepseek.com/",
  },
] as const;

const TABS: { id: Tab; label: string }[] = [
  { id: "providers", label: "سرویس‌ها" },
  { id: "prompts", label: "پرامپت‌ها" },
  { id: "usage", label: "آمار مصرف" },
];

const PROVIDER_LABELS: Record<string, string> = {
  gemini: "Google Gemini",
  openrouter: "OpenRouter",
  deepseek: "DeepSeek",
  anthropic: "Anthropic Claude",
};

export default function AiSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("providers");

  const [settings, setSettings] = useState({
    openrouterModel: "deepseek/deepseek-chat",
    openrouterBaseUrl: "https://openrouter.ai",
    defaultAiProvider: "deepseek",
  });

  const [contentPrompt, setContentPrompt] = useState("");
  const [productPrompt, setProductPrompt] = useState("");
  const [savingPrompts, setSavingPrompts] = useState(false);

  const [tokenUsage, setTokenUsage] = useState<Record<string, ProviderUsage>>({});
  const [usageTotals, setUsageTotals] = useState<ProviderUsage | null>(null);
  const [usageLoading, setUsageLoading] = useState(false);

  const [selectedProvider, setSelectedProvider] = useState("anthropic");
  const [tokenInput, setTokenInput] = useState("");
  const [savingToken, setSavingToken] = useState(false);
  const [savingDefault, setSavingDefault] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ text: string; ok: boolean } | null>(null);

  const [statuses, setStatuses] = useState<Record<string, AiStatus>>({
    gemini: { source: "none", configured: false, maskedKey: null },
    openrouter: { source: "none", configured: false, maskedKey: null },
    deepseek: { source: "none", configured: false, maskedKey: null },
    anthropic: { source: "none", configured: false, maskedKey: null },
  });

  const [connections, setConnections] = useState<Record<string, ConnectionState>>({
    gemini: "untested",
    openrouter: "untested",
    deepseek: "untested",
    anthropic: "untested",
  });

  const [models, setModels] = useState<OpenRouterModel[]>([]);
  const [selectedModel, setSelectedModel] = useState("");
  const [loadingModels, setLoadingModels] = useState(false);
  const [savingModel, setSavingModel] = useState(false);

  const showMsg = (text: string, ok = true) => {
    setMessage({ text, ok });
    setTimeout(() => setMessage(null), 4000);
  };

  const checkConnection = useCallback(async (provider: string) => {
    setConnections((prev) => ({ ...prev, [provider]: "testing" }));
    try {
      const res = await fetch("/api/settings/ai/test", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ provider }),
      });
      const j = await res.json();
      setConnections((prev) => ({ ...prev, [provider]: j.ok ? "connected" : "failed" }));
    } catch {
      setConnections((prev) => ({ ...prev, [provider]: "failed" }));
    }
  }, []);

  const fetchModels = useCallback(async () => {
    setLoadingModels(true);
    try {
      const res = await fetch("/api/settings/ai/models");
      const j = await res.json();
      if (j.ok && Array.isArray(j.models)) setModels(j.models);
    } finally {
      setLoadingModels(false);
    }
  }, []);

  const fetchUsage = useCallback(async () => {
    setUsageLoading(true);
    try {
      const res = await fetch("/api/settings/ai/usage");
      const j = await res.json();
      if (j.ok) {
        setTokenUsage(j.usage || {});
        setUsageTotals(j.totals || null);
      }
    } finally {
      setUsageLoading(false);
    }
  }, []);

  const reloadStatuses = useCallback(async () => {
    const res = await fetch("/api/settings/site");
    const st = await res.json();
    if (st.ok) {
      setSettings((prev) => ({ ...prev, ...st.settings }));
      setStatuses({
        gemini: st.gemini || { source: "none", configured: false, maskedKey: null },
        openrouter: st.openrouter || { source: "none", configured: false, maskedKey: null },
        deepseek: st.deepseek || { source: "none", configured: false, maskedKey: null },
        anthropic: st.anthropic || { source: "none", configured: false, maskedKey: null },
      });
      if (st.settings?.defaultAiProvider) setSelectedProvider(st.settings.defaultAiProvider);
      if (st.settings?.openrouterModel) setSelectedModel(st.settings.openrouterModel);
      if (st.settings?.contentPrompt) setContentPrompt(st.settings.contentPrompt);
      if (st.settings?.productPrompt) setProductPrompt(st.settings.productPrompt);
    }
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        await reloadStatuses();
      } catch {
        showMsg("خطا در بارگذاری تنظیمات", false);
      } finally {
        setLoading(false);
      }
    })();
  }, [reloadStatuses]);

  useEffect(() => {
    if (loading) return;
    Object.entries(statuses).forEach(([id, st]) => {
      if (st.configured) void checkConnection(id);
    });
    if (statuses.openrouter?.configured) void fetchModels();
  }, [loading]); // eslint-disable-line react-hooks/exhaustive-deps

  const [activeConfig, setActiveConfig] = useState<string | null>(null);

  const saveToken = async (providerId: string) => {
    const t = tokenInput.trim();
    if (!t) return;
    setSavingToken(true);
    setTestResult(null);
    try {
      const endpoint =
        providerId === "gemini" ? "/api/settings/gemini"
        : providerId === "openrouter" ? "/api/settings/openrouter"
        : providerId === "anthropic" ? "/api/settings/anthropic"
        : "/api/settings/deepseek";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ apiKey: t }),
      });
      const j = await res.json();
      if (j.ok) {
        showMsg(`توکن ${PROVIDER_LABELS[providerId]} ذخیره شد.`);
        setTokenInput("");
        await reloadStatuses();
        if (providerId === "openrouter") void fetchModels();
        void checkConnection(providerId);
      } else {
        showMsg(j.message ?? "خطا در ذخیره توکن", false);
      }
    } catch (e) {
      showMsg(e instanceof Error ? e.message : "خطا", false);
    } finally {
      setSavingToken(false);
    }
  };

  const setDefault = async (providerId: string) => {
    setSavingDefault(true);
    try {
      const res = await fetch("/api/settings/site", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ defaultAiProvider: providerId }),
      });
      const j = await res.json();
      if (j.ok) {
        setSettings((prev) => ({ ...prev, defaultAiProvider: providerId }));
        showMsg(`${PROVIDER_LABELS[providerId]} به‌عنوان سرویس پیش‌فرض تنظیم شد.`);
      } else {
        showMsg(j.message ?? "خطا", false);
      }
    } catch (e) {
      showMsg(e instanceof Error ? e.message : "خطا", false);
    } finally {
      setSavingDefault(false);
    }
  };

  const testConnection = async (providerId: string) => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/settings/ai/test", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ provider: providerId }),
      });
      const j = await res.json();
      setTestResult({ text: j.message || (j.ok ? "موفق" : "خطا"), ok: j.ok });
      if (j.ok && providerId === "openrouter") void fetchModels();
    } catch (e) {
      setTestResult({ text: e instanceof Error ? e.message : "خطا", ok: false });
    } finally {
      setTesting(false);
    }
  };

  const saveModel = async (model: string) => {
    if (!model) return;
    setSavingModel(true);
    try {
      const res = await fetch("/api/settings/site", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ openrouterModel: model }),
      });
      const j = await res.json();
      if (j.ok) showMsg("مدل ذخیره شد.");
      else showMsg("خطا در ذخیره مدل", false);
    } finally {
      setSavingModel(false);
    }
  };

  const savePrompts = async () => {
    setSavingPrompts(true);
    try {
      const res = await fetch("/api/settings/site", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ contentPrompt, productPrompt }),
      });
      const j = await res.json();
      if (j.ok) showMsg("پرامپت‌ها ذخیره شدند.");
      else showMsg(j.message ?? "خطا", false);
    } finally {
      setSavingPrompts(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-16">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-sky-400 border-t-transparent" />
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>بارگذاری…</p>
        </div>
      </div>
    );
  }

  const connColor = (state: ConnectionState, configured: boolean) =>
    !configured ? "#4b5563"
    : state === "testing" ? "#f59e0b"
    : state === "connected" ? "#22c55e"
    : state === "failed" ? "#ef4444"
    : "#4b5563";

  const connLabel = (state: ConnectionState, configured: boolean) =>
    !configured ? "پیکربندی نشده"
    : state === "testing" ? "بررسی…"
    : state === "connected" ? "متصل"
    : state === "failed" ? "خطا"
    : "—";

  const defaultProvider = settings.defaultAiProvider;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <style>{`
        @keyframes spin-slow { to { transform: rotate(360deg); } }
        .spin { animation: spin-slow 1s linear infinite; }
        @keyframes fadein { from { opacity:0; transform:translateY(4px); } to { opacity:1; transform:translateY(0); } }
        .fadein { animation: fadein 0.2s ease; }
      `}</style>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">تنظیمات هوش مصنوعی</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            مدیریت سرویس‌ها، پرامپت‌ها و آمار مصرف
          </p>
        </div>
        <div
          className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold"
          style={{ background: "var(--accent-dim)", color: "var(--accent)", border: "1px solid var(--border-active)" }}
        >
          <span className="h-2 w-2 rounded-full" style={{ background: "var(--accent)" }} />
          <span>پیش‌فرض: {PROVIDER_LABELS[defaultProvider] ?? defaultProvider}</span>
        </div>
      </div>

      {/* Toast */}
      {message && (
        <div
          className="fadein rounded-xl border px-4 py-3 text-sm font-medium"
          style={{
            borderColor: message.ok ? "#22c55e50" : "#ef444450",
            background: message.ok ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)",
            color: message.ok ? "#22c55e" : "#ef4444",
          }}
        >
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div
        className="flex gap-1 rounded-xl border p-1"
        style={{ borderColor: "var(--border)", background: "var(--surface)" }}
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className="flex-1 rounded-lg px-4 py-2.5 text-sm font-bold transition-all"
            style={{
              background: activeTab === tab.id ? "var(--accent-dim)" : "transparent",
              color: activeTab === tab.id ? "var(--accent)" : "var(--text-muted)",
              border: activeTab === tab.id ? "1px solid var(--border-active)" : "1px solid transparent",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── PROVIDERS TAB ── */}
      {activeTab === "providers" && (
        <div className="flex flex-col gap-4">
          {/* Provider grid */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {PROVIDERS.map((p) => {
              const st = statuses[p.id] ?? { source: "none", configured: false, maskedKey: null };
              const conn = connections[p.id] ?? "untested";
              const isDefault = defaultProvider === p.id;
              const isOpen = activeConfig === p.id;

              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setActiveConfig(isOpen ? null : p.id)}
                  className="flex flex-col gap-3 rounded-xl border p-4 text-right transition-all duration-200 hover:scale-[1.01]"
                  style={{
                    borderColor: isOpen ? "var(--border-active)" : st.configured ? `${p.color}40` : "var(--border)",
                    background: isOpen ? p.bg : "var(--glass-bg)",
                    backdropFilter: "blur(var(--blur-sm))",
                    boxShadow: isOpen ? `0 0 0 1px ${p.color}30` : "none",
                    cursor: "pointer",
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold"
                      style={{ background: p.bg, color: p.color }}
                    >
                      {p.id === "anthropic" ? "A" : p.id === "gemini" ? "G" : p.id === "openrouter" ? "R" : "D"}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{
                          backgroundColor: connColor(conn, st.configured),
                          animation: conn === "testing" ? "ai-blink 1.2s ease-in-out infinite" : "none",
                        }}
                      />
                      {isDefault && (
                        <span
                          className="rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider"
                          style={{ background: "var(--accent-dim)", color: "var(--accent)" }}
                        >
                          پیش‌فرض
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-bold" style={{ color: "var(--text)" }}>{p.label}</p>
                    <p className="mt-0.5 text-[11px]" style={{ color: "var(--text-muted)" }}>{p.desc}</p>
                  </div>

                  <div className="flex items-center justify-between">
                    <span
                      className="text-[11px] font-medium"
                      style={{ color: connColor(conn, st.configured) }}
                    >
                      {connLabel(conn, st.configured)}
                    </span>
                    {st.maskedKey && (
                      <span className="font-mono text-[10px]" style={{ color: "var(--text-muted)" }}>
                        {st.maskedKey}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Config panel for selected provider */}
          {activeConfig && (() => {
            const p = PROVIDERS.find((x) => x.id === activeConfig)!;
            const st = statuses[p.id] ?? { source: "none", configured: false, maskedKey: null };
            const conn = connections[p.id] ?? "untested";
            const isDefault = defaultProvider === p.id;

            return (
              <div
                className="fadein rounded-xl border p-6"
                style={{
                  borderColor: `${p.color}40`,
                  background: "var(--glass-bg)",
                  backdropFilter: "blur(var(--blur-md))",
                }}
              >
                <div className="mb-5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-xl text-base font-bold"
                      style={{ background: p.bg, color: p.color }}
                    >
                      {p.id === "anthropic" ? "A" : p.id === "gemini" ? "G" : p.id === "openrouter" ? "R" : "D"}
                    </div>
                    <div>
                      <h3 className="font-bold" style={{ color: "var(--text)" }}>{p.label}</h3>
                      <a
                        href={p.docUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] no-underline hover:underline"
                        style={{ color: p.color }}
                      >
                        دریافت کلید API ←
                      </a>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {st.configured && (
                      <button
                        type="button"
                        disabled={testing}
                        onClick={() => void testConnection(p.id)}
                        className="rounded-lg border px-3 py-1.5 text-xs font-bold transition-opacity disabled:opacity-50"
                        style={{ borderColor: "var(--border)", color: "var(--text)" }}
                      >
                        {testing ? "تست…" : "تست اتصال"}
                      </button>
                    )}
                    {!isDefault && st.configured && (
                      <button
                        type="button"
                        disabled={savingDefault}
                        onClick={() => void setDefault(p.id)}
                        className="rounded-lg px-3 py-1.5 text-xs font-bold text-white transition-opacity disabled:opacity-50"
                        style={{ background: p.color }}
                      >
                        {savingDefault ? "…" : "تنظیم به‌عنوان پیش‌فرض"}
                      </button>
                    )}
                    {isDefault && (
                      <span
                        className="rounded-lg px-3 py-1.5 text-xs font-bold"
                        style={{ background: "var(--accent-dim)", color: "var(--accent)" }}
                      >
                        ✓ سرویس پیش‌فرض
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid gap-5 lg:grid-cols-2">
                  <div className="flex flex-col gap-3">
                    {st.configured && (
                      <div
                        className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-xs"
                        style={{ background: "var(--surface)" }}
                      >
                        <span style={{ color: connColor(conn, st.configured) }}>●</span>
                        <span className="font-mono" style={{ color: "var(--text-muted)" }}>{st.maskedKey}</span>
                        <span style={{ color: "var(--text-muted)" }}>
                          ({st.source === "env" ? "متغیر محیطی" : "ذخیره محلی"})
                        </span>
                      </div>
                    )}

                    <label className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
                      {st.configured ? "جایگزینی کلید API" : "کلید API"}
                      <input
                        type="password"
                        autoComplete="new-password"
                        className="mt-1.5 w-full rounded-lg border p-2.5 text-sm font-mono"
                        style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" }}
                        value={tokenInput}
                        onChange={(e) => setTokenInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter" && tokenInput.trim()) void saveToken(p.id); }}
                        placeholder={p.placeholder}
                        dir="ltr"
                      />
                    </label>

                    <button
                      type="button"
                      disabled={savingToken || !tokenInput.trim()}
                      onClick={() => void saveToken(p.id)}
                      className="w-full rounded-lg py-2.5 text-sm font-bold text-white transition-opacity disabled:opacity-40"
                      style={{ background: p.color }}
                    >
                      {savingToken ? "در حال ذخیره…" : "ذخیرهٔ کلید"}
                    </button>

                    {testResult && (
                      <div
                        className="fadein rounded-lg border p-3 text-xs font-medium"
                        style={{
                          borderColor: testResult.ok ? "#22c55e50" : "#ef444450",
                          background: testResult.ok ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)",
                          color: testResult.ok ? "#22c55e" : "#ef4444",
                        }}
                      >
                        {testResult.text}
                      </div>
                    )}
                  </div>

                  {/* OpenRouter model selector */}
                  {p.id === "openrouter" && (
                    <div className="flex flex-col gap-3">
                      <label className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
                        مدل OpenRouter
                        {loadingModels && <span className="ml-2 text-xs opacity-60">در حال بارگذاری…</span>}
                        <div className="mt-1.5 flex gap-2">
                          <select
                            className="flex-1 rounded-lg border p-2.5 text-sm"
                            style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" }}
                            value={selectedModel}
                            onChange={(e) => setSelectedModel(e.target.value)}
                            dir="ltr"
                          >
                            {models.length === 0 && (
                              <option value={selectedModel}>{selectedModel || "—"}</option>
                            )}
                            {models.map((m) => (
                              <option key={m.id} value={m.id}>{m.name || m.id}</option>
                            ))}
                          </select>
                          <button
                            type="button"
                            disabled={savingModel || !selectedModel}
                            onClick={() => void saveModel(selectedModel)}
                            className="rounded-lg px-4 py-2 text-sm font-bold text-white transition-opacity disabled:opacity-40"
                            style={{ background: p.color }}
                          >
                            {savingModel ? "…" : "ذخیره"}
                          </button>
                        </div>
                      </label>
                      {models.length === 0 && st.configured && (
                        <button
                          type="button"
                          onClick={() => void fetchModels()}
                          className="text-xs underline"
                          style={{ color: "var(--text-muted)" }}
                        >
                          بارگذاری مجدد مدل‌ها
                        </button>
                      )}
                    </div>
                  )}

                  {/* Anthropic model info */}
                  {p.id === "anthropic" && (
                    <div
                      className="flex flex-col gap-2 rounded-lg border p-4 text-sm"
                      style={{ borderColor: "var(--border)", background: "var(--surface)" }}
                    >
                      <p className="font-bold" style={{ color: "var(--text)" }}>مدل فعال</p>
                      <p className="font-mono text-xs" dir="ltr" style={{ color: p.color }}>
                        claude-haiku-4-5-20251001
                      </p>
                      <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
                        برای تغییر مدل، متغیر محیطی <code className="rounded px-1" style={{ background: "var(--bg)" }}>ANTHROPIC_MODEL</code> را تنظیم کنید.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Quick status row when no config panel open */}
          {!activeConfig && (
            <div
              className="rounded-xl border p-4 text-sm"
              style={{ borderColor: "var(--border)", background: "var(--surface)" }}
            >
              <p className="mb-3 font-bold" style={{ color: "var(--text)" }}>وضعیت سرویس‌ها</p>
              <div className="flex flex-wrap gap-3">
                {PROVIDERS.map((p) => {
                  const st = statuses[p.id] ?? { configured: false };
                  const conn = connections[p.id] ?? "untested";
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setActiveConfig(p.id)}
                      className="flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-all hover:scale-[1.02]"
                      style={{
                        borderColor: "var(--border)",
                        background: "var(--glass-bg)",
                        color: "var(--text)",
                      }}
                    >
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: connColor(conn, st.configured) }} />
                      {p.label}
                      {defaultProvider === p.id && (
                        <span className="text-[9px] opacity-60">★</span>
                      )}
                    </button>
                  );
                })}
              </div>
              <p className="mt-3 text-xs" style={{ color: "var(--text-muted)" }}>
                روی یک سرویس کلیک کنید تا آن را پیکربندی کنید.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── PROMPTS TAB ── */}
      {activeTab === "prompts" && (
        <div className="flex flex-col gap-5">
          <Surface title="پرامپت تولید محتوا">
            <p className="mb-3 text-sm" style={{ color: "var(--text-muted)" }}>
              برای تولید محتوای متنی (مقالات، صفحات). متغیرهای{" "}
              <code className="rounded px-1 text-xs" style={{ background: "var(--bg)", color: "var(--accent)" }}>{"{title}"}</code>،{" "}
              <code className="rounded px-1 text-xs" style={{ background: "var(--bg)", color: "var(--accent)" }}>{"{body}"}</code> و{" "}
              <code className="rounded px-1 text-xs" style={{ background: "var(--bg)", color: "var(--accent)" }}>{"{keywords}"}</code>{" "}
              خودکار جایگزین می‌شوند.
            </p>
            <textarea
              className="w-full rounded-lg border p-3 text-sm font-mono leading-relaxed"
              style={{
                borderColor: "var(--border)",
                background: "var(--surface)",
                color: "var(--text)",
                minHeight: "260px",
                direction: "ltr",
                resize: "vertical",
              }}
              value={contentPrompt}
              onChange={(e) => setContentPrompt(e.target.value)}
              dir="ltr"
            />
          </Surface>

          <Surface title="پرامپت تولید محصول">
            <p className="mb-3 text-sm" style={{ color: "var(--text-muted)" }}>
              برای تولید خودکار توضیحات و متادیتای محصولات. همان متغیرها.
            </p>
            <textarea
              className="w-full rounded-lg border p-3 text-sm font-mono leading-relaxed"
              style={{
                borderColor: "var(--border)",
                background: "var(--surface)",
                color: "var(--text)",
                minHeight: "260px",
                direction: "ltr",
                resize: "vertical",
              }}
              value={productPrompt}
              onChange={(e) => setProductPrompt(e.target.value)}
              dir="ltr"
            />
          </Surface>

          <div className="flex justify-end">
            <button
              type="button"
              disabled={savingPrompts}
              onClick={() => void savePrompts()}
              className="rounded-xl px-8 py-2.5 text-sm font-bold text-white transition-opacity disabled:opacity-50"
              style={{ background: "var(--accent)" }}
            >
              {savingPrompts ? "در حال ذخیره…" : "ذخیرهٔ پرامپت‌ها"}
            </button>
          </div>
        </div>
      )}

      {/* ── USAGE TAB ── */}
      {activeTab === "usage" && (
        <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
          <Surface title="مصرف توکن‌ها">
            {usageLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-sky-400 border-t-transparent" />
              </div>
            ) : Object.keys(tokenUsage).length > 0 ? (
              <div className="overflow-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b" style={{ borderColor: "var(--border)" }}>
                      {["سرویس", "درخواست", "ورودی", "خروجی", "مجموع"].map((h) => (
                        <th key={h} className="pb-3 text-right text-xs font-bold" style={{ color: "var(--text-muted)" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(tokenUsage).map(([provider, u]) => (
                      <tr key={provider} className="border-b" style={{ borderColor: "var(--border)" }}>
                        <td className="py-3 font-bold">{PROVIDER_LABELS[provider] ?? provider}</td>
                        <td className="py-3 font-mono text-xs">{u.requests.toLocaleString("fa-IR")}</td>
                        <td className="py-3 font-mono text-xs">{u.promptTokens.toLocaleString("fa-IR")}</td>
                        <td className="py-3 font-mono text-xs">{u.completionTokens.toLocaleString("fa-IR")}</td>
                        <td className="py-3 font-mono text-xs font-bold" style={{ color: "var(--accent)" }}>
                          {u.totalTokens.toLocaleString("fa-IR")}
                        </td>
                      </tr>
                    ))}
                    {usageTotals && (
                      <tr style={{ color: "var(--accent)" }}>
                        <td className="py-3 font-bold">جمع کل</td>
                        <td className="py-3 font-mono text-xs">{usageTotals.requests.toLocaleString("fa-IR")}</td>
                        <td className="py-3 font-mono text-xs">{usageTotals.promptTokens.toLocaleString("fa-IR")}</td>
                        <td className="py-3 font-mono text-xs">{usageTotals.completionTokens.toLocaleString("fa-IR")}</td>
                        <td className="py-3 font-mono text-xs font-bold">{usageTotals.totalTokens.toLocaleString("fa-IR")}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 py-12">
                <p className="text-2xl opacity-30">◈</p>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>هنوز مصرفی ثبت نشده است.</p>
              </div>
            )}
          </Surface>

          <div className="flex flex-col gap-4">
            {usageTotals && (
              <Surface title="خلاصه">
                <div
                  className="mb-4 rounded-xl p-4 text-center"
                  style={{ background: "var(--accent-dim)" }}
                >
                  <p className="text-3xl font-bold" style={{ color: "var(--accent)" }}>
                    {usageTotals.totalTokens.toLocaleString("fa-IR")}
                  </p>
                  <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>توکن مصرفی</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-xl p-3 text-center" style={{ background: "var(--surface)" }}>
                    <p className="text-lg font-bold">{usageTotals.requests.toLocaleString("fa-IR")}</p>
                    <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>درخواست</p>
                  </div>
                  <div className="rounded-xl p-3 text-center" style={{ background: "var(--surface)" }}>
                    <p className="text-lg font-bold">{Object.keys(tokenUsage).length}</p>
                    <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>سرویس فعال</p>
                  </div>
                </div>
              </Surface>
            )}

            <button
              type="button"
              disabled={usageLoading}
              onClick={() => void fetchUsage()}
              className="w-full rounded-xl border px-4 py-3 text-sm font-bold transition-opacity disabled:opacity-50"
              style={{ borderColor: "var(--border)", color: "var(--text)" }}
            >
              {usageLoading ? "در حال بروزرسانی…" : "بروزرسانی آمار"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
