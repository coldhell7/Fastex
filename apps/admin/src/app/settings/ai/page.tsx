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

type ProviderUsage = {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  requests: number;
};

type Tab = "providers" | "prompts" | "usage";

const PROVIDERS = [
  { id: "gemini", label: "Google Gemini", placeholder: "AIza…", icon: "◇", color: "#4285F4" },
  { id: "openrouter", label: "OpenRouter", placeholder: "sk-or-v1-…", icon: "◇", color: "#10b981" },
  { id: "deepseek", label: "DeepSeek", placeholder: "sk-…", icon: "◇", color: "#f59e0b" },
] as const;

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "providers", label: "سرویس‌ها", icon: "◇" },
  { id: "prompts", label: "پرامپت‌ها", icon: "☰" },
  { id: "usage", label: "آمار مصرف", icon: "◉" },
];

export default function AiSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
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

  const [selectedProvider, setSelectedProvider] = useState("deepseek");
  const [tokenInput, setTokenInput] = useState("");
  const [savingToken, setSavingToken] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [clientTesting, setClientTesting] = useState(false);
  const [clientTestResult, setClientTestResult] = useState<string | null>(null);

  const [geminiStatus, setGeminiStatus] = useState<AiStatus>({ source: "none", configured: false, maskedKey: null });
  const [openrouterStatus, setOpenrouterStatus] = useState<AiStatus>({ source: "none", configured: false, maskedKey: null });
  const [deepseekStatus, setDeepseekStatus] = useState<AiStatus>({ source: "none", configured: false, maskedKey: null });

  const [aiConnections, setAiConnections] = useState<Record<string, ConnectionState>>({
    gemini: "untested",
    openrouter: "untested",
    deepseek: "untested",
  });

  const [models, setModels] = useState<OpenRouterModel[]>([]);
  const [selectedModel, setSelectedModel] = useState("");
  const [loadingModels, setLoadingModels] = useState(false);
  const [savingModel, setSavingModel] = useState(false);

  const providerStatus = (() => {
    if (selectedProvider === "gemini") return geminiStatus;
    if (selectedProvider === "openrouter") return openrouterStatus;
    return deepseekStatus;
  })();

  const currentPlaceholder = PROVIDERS.find((p) => p.id === selectedProvider)?.placeholder ?? "توکن API";

  const checkConnection = useCallback(async (provider: string) => {
    setAiConnections(prev => ({ ...prev, [provider]: "testing" }));
    try {
      const res = await fetch("/api/settings/ai/test", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ provider }),
      });
      const j = await res.json();
      setAiConnections(prev => ({ ...prev, [provider]: j.ok ? "connected" : "failed" }));
    } catch {
      setAiConnections(prev => ({ ...prev, [provider]: "failed" }));
    }
  }, []);

  const fetchModels = useCallback(async () => {
    setLoadingModels(true);
    try {
      const res = await fetch("/api/settings/ai/models");
      const j = await res.json();
      if (j.ok && Array.isArray(j.models)) setModels(j.models);
    } catch {
    } finally {
      setLoadingModels(false);
    }
  }, []);

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
      setMessage(j.ok ? "مدل ذخیره شد." : "خطا در ذخیره مدل");
    } catch {
      setMessage("خطا در ذخیره مدل");
    } finally {
      setSavingModel(false);
    }
  };

  const fetchUsage = useCallback(async () => {
    setUsageLoading(true);
    try {
      const res = await fetch("/api/settings/ai/usage");
      const j = await res.json();
      if (j.ok) {
        setTokenUsage(j.usage || {});
        setUsageTotals(j.totals || null);
      }
    } catch {
    } finally {
      setUsageLoading(false);
    }
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/settings/site");
        const j = await res.json();
        if (j.ok) {
          setSettings((prev) => ({ ...prev, ...j.settings }));
          setGeminiStatus(j.gemini);
          setOpenrouterStatus(j.openrouter || { source: "none", configured: false, maskedKey: null });
          setDeepseekStatus(j.deepseek || { source: "none", configured: false, maskedKey: null });
          if (j.settings?.defaultAiProvider) setSelectedProvider(j.settings.defaultAiProvider);
          if (j.settings?.openrouterModel) setSelectedModel(j.settings.openrouterModel);
          if (j.settings?.contentPrompt) setContentPrompt(j.settings.contentPrompt);
          if (j.settings?.productPrompt) setProductPrompt(j.settings.productPrompt);
        }
      } catch {
        setMessage("خطا در بارگذاری تنظیمات");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (loading) return;
    const configured = [
      { id: "gemini", status: geminiStatus },
      { id: "openrouter", status: openrouterStatus },
      { id: "deepseek", status: deepseekStatus },
    ].filter(p => p.status.configured);
    configured.forEach(({ id }) => void checkConnection(id));
    if (openrouterStatus.configured) void fetchModels();
  }, [loading, geminiStatus.configured, openrouterStatus.configured, deepseekStatus.configured, checkConnection, fetchModels]);

  const saveToken = async () => {
    const t = tokenInput.trim();
    if (!t) return;
    setSavingToken(true);
    setMessage("");
    setTestResult(null);
    try {
      const endpoint = selectedProvider === "gemini"
        ? "/api/settings/gemini"
        : selectedProvider === "openrouter"
          ? "/api/settings/openrouter"
          : "/api/settings/deepseek";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ apiKey: t }),
      });
      const j = await res.json();
      if (j.ok) {
        setMessage(`توکن ${PROVIDERS.find((p) => p.id === selectedProvider)?.label} ذخیره شد.`);
        setTokenInput("");
        await fetch("/api/settings/site", {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ defaultAiProvider: selectedProvider }),
        });
        const check = await fetch("/api/settings/site");
        const st = await check.json();
        if (st.ok) {
          setSettings((prev) => ({ ...prev, ...st.settings }));
          setGeminiStatus(st.gemini);
          setOpenrouterStatus(st.openrouter || { source: "none", configured: false, maskedKey: null });
          setDeepseekStatus(st.deepseek || { source: "none", configured: false, maskedKey: null });
        }
        if (selectedProvider === "openrouter") void fetchModels();
        void checkConnection(selectedProvider);
      } else {
        setMessage(j.message ?? "خطا در ذخیره توکن");
      }
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "خطا");
    } finally {
      setSavingToken(false);
    }
  };

  const testConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/settings/ai/test", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ provider: selectedProvider }),
      });
      const j = await res.json();
      if (j.ok) {
        setTestResult(j.message);
        if (selectedProvider === "openrouter") void fetchModels();
      } else setTestResult(j.message || "خطا در تست اتصال");
    } catch (e) {
      setTestResult(e instanceof Error ? e.message : "خطا");
    } finally {
      setTesting(false);
    }
  };

  const testDirectConnection = async () => {
    const key = tokenInput.trim();
    if (!key) {
      setClientTestResult("لطفاً ابتدا توکن را در فیلد بالا وارد کنید.");
      return;
    }
    setClientTesting(true);
    setClientTestResult(null);
    try {
      let ok = false;
      let msg = "";
      if (selectedProvider === "gemini") {
        const res = await fetch(
          "https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=" + encodeURIComponent(key),
          { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents: [{ parts: [{ text: "سلام" }] }] }) },
        );
        const body = await res.text().catch(() => "");
        ok = res.ok;
        msg = ok ? "اتصال موفق از مرورگر به Gemini" : `خطا ${res.status}: ${body.slice(0, 120)}`;
      } else if (selectedProvider === "openrouter") {
        const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json",
            "HTTP-Referer": window.location.origin,
            "X-Title": "Medalino",
          },
          body: JSON.stringify({ model: "deepseek/deepseek-chat", messages: [{ role: "user", content: "سلام" }], max_tokens: 10 }),
        });
        const body = await res.text().catch(() => "");
        ok = res.ok;
        msg = ok ? "اتصال موفق از مرورگر به OpenRouter" : `خطا ${res.status}: ${body.slice(0, 120)}`;
      } else {
        const res = await fetch("https://api.deepseek.com/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
          body: JSON.stringify({ model: "deepseek-chat", messages: [{ role: "user", content: "سلام" }], max_tokens: 10 }),
        });
        const body = await res.text().catch(() => "");
        ok = res.ok;
        msg = ok ? "اتصال موفق از مرورگر به DeepSeek" : `خطا ${res.status}: ${body.slice(0, 120)}`;
      }
      setClientTestResult(msg);
    } catch (e) {
      setClientTestResult(e instanceof Error ? e.message : "خطا");
    } finally {
      setClientTesting(false);
    }
  };

  const savePrompts = async () => {
    setSavingPrompts(true);
    setMessage("");
    try {
      const res = await fetch("/api/settings/site", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ contentPrompt, productPrompt }),
      });
      const j = await res.json();
      if (j.ok) setMessage("پرامپت‌ها ذخیره شدند.");
      else setMessage(j.message ?? "خطا در ذخیره پرامپت");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "خطا");
    } finally {
      setSavingPrompts(false);
    }
  };

  if (loading) return <p className="p-8 text-sm">در حال بارگذاری…</p>;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <style>{`
        @keyframes ai-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.2; }
        }
        .dot-blink {
          animation: ai-blink 1.2s ease-in-out infinite;
        }
      `}</style>

      <div>
        <h1 className="text-3xl font-semibold">تنظیمات هوش مصنوعی</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
          مدیریت سرویس‌های هوش مصنوعی، پرامپت‌های پیش‌فرض و آمار مصرف
        </p>
        <div
          className="mt-3 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold"
          style={{
            background: "var(--accent-dim)",
            color: "var(--accent)",
            border: "1px solid var(--border-active)",
          }}
        >
          <span>AI پیش‌فرض:</span>
          <span className="font-mono">
            {settings.defaultAiProvider === "gemini"
              ? "Google Gemini"
              : settings.defaultAiProvider === "openrouter"
                ? "OpenRouter"
                : "DeepSeek"}
          </span>
        </div>
      </div>

      {message && (
        <div
          className="rounded-md border p-3 text-sm"
          style={{
            borderColor: message.includes("خطا") ? "#ef4444" : "var(--border)",
            background: message.includes("خطا") ? "rgba(239,68,68,0.1)" : "var(--surface)",
            color: message.includes("خطا") ? "#ef4444" : "var(--text)",
          }}
        >
          {message}
        </div>
      )}

      <div
        className="flex gap-1 rounded-xl border p-1"
        style={{ borderColor: "var(--border)", background: "var(--surface)" }}
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold transition-all"
            style={{
              background: activeTab === tab.id ? "var(--accent-dim)" : "transparent",
              color: activeTab === tab.id ? "var(--accent)" : "var(--text-muted)",
              border: activeTab === tab.id ? "1px solid var(--border-active)" : "1px solid transparent",
            }}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {activeTab === "providers" && (
        <div className="grid gap-6 lg:grid-cols-3">
          {PROVIDERS.map((p) => {
            const st = p.id === "gemini" ? geminiStatus : p.id === "openrouter" ? openrouterStatus : deepseekStatus;
            const conn = aiConnections[p.id];
            const isSelected = selectedProvider === p.id;
            const isConfigured = st.configured;

            const connColor = !isConfigured
              ? "#6b7280"
              : conn === "testing"
                ? "#f59e0b"
                : conn === "connected"
                  ? "#22c55e"
                  : conn === "failed"
                    ? "#ef4444"
                    : "#6b7280";

            const connLabel = !isConfigured
              ? "پیکربندی نشده"
              : conn === "testing"
                ? "در حال بررسی…"
                : conn === "connected"
                  ? "متصل"
                  : conn === "failed"
                    ? "خطا"
                    : "—";

            return (
              <div
                key={p.id}
                className="flex flex-col gap-4 rounded-xl border p-5 transition-all duration-200"
                style={{
                  borderColor: isSelected ? "var(--border-active)" : "var(--border)",
                  background: "var(--glass-bg)",
                  backdropFilter: "blur(var(--blur-sm))",
                  WebkitBackdropFilter: "blur(var(--blur-sm))",
                  boxShadow: isSelected ? "var(--glow)" : "none",
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-lg text-lg"
                      style={{ background: `${p.color}20`, color: p.color }}
                    >
                      {p.icon}
                    </div>
                    <div>
                      <p className="text-sm font-bold">{p.label}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span
                          className={`inline-block h-2 w-2 rounded-full ${conn === "testing" ? "" : ""}`}
                          style={{
                            backgroundColor: connColor,
                            animation: conn === "testing" ? "ai-blink 1.2s ease-in-out infinite" : "none",
                          }}
                        />
                        <span className="text-[11px]" style={{ color: connColor }}>{connLabel}</span>
                      </div>
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="provider-select"
                    checked={isSelected}
                    onChange={() => {
                      setSelectedProvider(p.id);
                      setTestResult(null);
                      setClientTestResult(null);
                    }}
                    className="h-4 w-4 cursor-pointer accent-sky-500"
                  />
                </div>

                {isSelected && (
                  <div className="flex flex-col gap-3 border-t pt-4" style={{ borderColor: "var(--border)" }}>
                    {isConfigured && (
                      <div className="flex items-center gap-2 rounded-md px-3 py-2 text-xs" style={{ background: "var(--surface)" }}>
                        <span style={{ color: "#22c55e" }}>●</span>
                        <span className="font-mono" style={{ color: "var(--text-muted)" }}>
                          {st.maskedKey}
                        </span>
                        <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                          ({st.source === "env" ? "متغیر محیطی" : "ذخیره محلی"})
                        </span>
                      </div>
                    )}

                    <label className="block text-xs font-medium" style={{ color: "var(--text-muted)" }}>
                      توکن API جدید
                      <input
                        type="password"
                        autoComplete="off"
                        className="mt-1 w-full rounded-md border p-2 text-sm font-mono"
                        style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" }}
                        value={tokenInput}
                        onChange={(e) => setTokenInput(e.target.value)}
                        placeholder={currentPlaceholder}
                        dir="ltr"
                      />
                    </label>

                    <div className="flex flex-col gap-2">
                      <button
                        type="button"
                        disabled={savingToken || !tokenInput.trim()}
                        onClick={() => void saveToken()}
                        className="w-full rounded-md px-4 py-2 text-sm font-bold text-white transition-opacity disabled:opacity-50"
                        style={{ background: "var(--accent)" }}
                      >
                        {savingToken ? "در حال ذخیره…" : "ذخیرهٔ توکن"}
                      </button>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={testing || !isConfigured}
                          onClick={() => void testConnection()}
                          className="flex-1 rounded-md border px-3 py-2 text-sm font-bold transition-opacity disabled:opacity-50"
                          style={{ borderColor: "var(--border)", color: "var(--text)" }}
                        >
                          {testing ? "در حال تست…" : "تست (سرور)"}
                        </button>
                        <button
                          type="button"
                          disabled={clientTesting || !tokenInput.trim()}
                          onClick={() => void testDirectConnection()}
                          className="flex-1 rounded-md border px-3 py-2 text-sm font-bold transition-opacity disabled:opacity-50"
                          style={{ borderColor: "var(--border)", color: "var(--text)" }}
                        >
                          {clientTesting ? "در حال تست…" : "تست (مرورگر)"}
                        </button>
                      </div>
                    </div>

                    {testResult && (
                      <div
                        className="rounded-md border p-2.5 text-xs"
                        style={{
                          borderColor: testResult.includes("موفق") ? "#22c55e" : "#ef4444",
                          background: testResult.includes("موفق") ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)",
                          color: testResult.includes("موفق") ? "#22c55e" : "#ef4444",
                        }}
                      >
                        <span className="text-[9px] font-bold opacity-60">SERVER</span> {testResult}
                      </div>
                    )}

                    {clientTestResult && (
                      <div
                        className="rounded-md border p-2.5 text-xs"
                        style={{
                          borderColor: clientTestResult.includes("موفق") ? "#22c55e" : "#ef4444",
                          background: clientTestResult.includes("موفق") ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)",
                          color: clientTestResult.includes("موفق") ? "#22c55e" : "#ef4444",
                        }}
                      >
                        <span className="text-[9px] font-bold opacity-60">CLIENT</span> {clientTestResult}
                      </div>
                    )}

                    {p.id === "openrouter" && models.length > 0 && (
                      <div className="border-t pt-3" style={{ borderColor: "var(--border)" }}>
                        <label className="block text-xs font-medium" style={{ color: "var(--text-muted)" }}>
                          مدل OpenRouter
                          <div className="mt-1 flex gap-2">
                            <select
                              className="flex-1 rounded-md border p-2 text-xs"
                              style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" }}
                              value={selectedModel}
                              onChange={(e) => setSelectedModel(e.target.value)}
                            >
                              {models.map((m) => (
                                <option key={m.id} value={m.id}>{m.name || m.id}</option>
                              ))}
                            </select>
                            <button
                              type="button"
                              disabled={savingModel || !selectedModel}
                              onClick={() => void saveModel(selectedModel)}
                              className="rounded-md px-3 py-2 text-xs font-bold text-white transition-opacity disabled:opacity-50"
                              style={{ background: "var(--accent)" }}
                            >
                              {savingModel ? "…" : "✓"}
                            </button>
                          </div>
                        </label>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {activeTab === "prompts" && (
        <div className="flex flex-col gap-6">
          <Surface title="پرامپت تولید محتوا">
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              برای تولید محتوای متنی (مقالات، صفحات). متغیرهای {'{title}'}، {'{body}'} و {'{keywords}'} خودکار جایگزین می‌شوند.
            </p>
            <textarea
              className="mt-4 w-full rounded-md border p-3 text-sm font-mono leading-relaxed"
              style={{
                borderColor: "var(--border)",
                background: "var(--surface)",
                color: "var(--text)",
                minHeight: "280px",
                direction: "ltr",
              }}
              value={contentPrompt}
              onChange={(e) => setContentPrompt(e.target.value)}
              dir="ltr"
            />
          </Surface>

          <Surface title="پرامپت تولید محصول">
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              برای تولید خودکار توضیحات و متادیتای محصولات. متغیرهای {'{title}'}، {'{body}'} و {'{keywords}'} خودکار جایگزین می‌شوند.
            </p>
            <textarea
              className="mt-4 w-full rounded-md border p-3 text-sm font-mono leading-relaxed"
              style={{
                borderColor: "var(--border)",
                background: "var(--surface)",
                color: "var(--text)",
                minHeight: "280px",
                direction: "ltr",
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
              className="rounded-md px-8 py-2.5 text-sm font-bold text-white transition-opacity disabled:opacity-50"
              style={{ background: "var(--accent)" }}
            >
              {savingPrompts ? "در حال ذخیره…" : "ذخیرهٔ پرامپت‌ها"}
            </button>
          </div>
        </div>
      )}

      {activeTab === "usage" && (
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <Surface title="مصرف توکن‌ها">
            {usageLoading ? (
              <p className="py-8 text-center text-sm" style={{ color: "var(--text-muted)" }}>
                در حال بارگذاری…
              </p>
            ) : Object.keys(tokenUsage).length > 0 ? (
              <div className="overflow-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b" style={{ borderColor: "var(--border)" }}>
                      <th className="pb-3 text-right font-medium">سرویس</th>
                      <th className="pb-3 text-right font-medium">درخواست‌ها</th>
                      <th className="pb-3 text-right font-medium">ورودی</th>
                      <th className="pb-3 text-right font-medium">خروجی</th>
                      <th className="pb-3 text-right font-medium">مجموع توکن</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(tokenUsage).map(([provider, u]) => (
                      <tr key={provider} className="border-b" style={{ borderColor: "var(--border)" }}>
                        <td className="py-3 font-medium">
                          {provider === "gemini" ? "Gemini" : provider === "openrouter" ? "OpenRouter" : "DeepSeek"}
                        </td>
                        <td className="py-3 font-mono text-xs">{u.requests.toLocaleString("fa-IR")}</td>
                        <td className="py-3 font-mono text-xs">{u.promptTokens.toLocaleString("fa-IR")}</td>
                        <td className="py-3 font-mono text-xs">{u.completionTokens.toLocaleString("fa-IR")}</td>
                        <td className="py-3 font-mono text-xs font-bold">{u.totalTokens.toLocaleString("fa-IR")}</td>
                      </tr>
                    ))}
                    {usageTotals && (
                      <tr className="font-bold" style={{ color: "var(--accent)" }}>
                        <td className="py-3">جمع کل</td>
                        <td className="py-3 font-mono text-xs">{usageTotals.requests.toLocaleString("fa-IR")}</td>
                        <td className="py-3 font-mono text-xs">{usageTotals.promptTokens.toLocaleString("fa-IR")}</td>
                        <td className="py-3 font-mono text-xs">{usageTotals.completionTokens.toLocaleString("fa-IR")}</td>
                        <td className="py-3 font-mono text-xs">{usageTotals.totalTokens.toLocaleString("fa-IR")}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="py-8 text-center text-sm" style={{ color: "var(--text-muted)" }}>
                هنوز مصرفی ثبت نشده است.
              </p>
            )}
          </Surface>

          <div className="flex flex-col gap-4">
            <Surface title="خلاصه">
              {usageTotals ? (
                <div className="flex flex-col gap-3">
                  <div
                    className="rounded-lg p-4 text-center"
                    style={{ background: "var(--accent-dim)" }}
                  >
                    <p className="text-2xl font-bold" style={{ color: "var(--accent)" }}>
                      {usageTotals.totalTokens.toLocaleString("fa-IR")}
                    </p>
                    <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
                      مجموع توکن مصرفی
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-lg p-3 text-center" style={{ background: "var(--surface)" }}>
                      <p className="text-lg font-bold">{usageTotals.requests.toLocaleString("fa-IR")}</p>
                      <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>درخواست</p>
                    </div>
                    <div className="rounded-lg p-3 text-center" style={{ background: "var(--surface)" }}>
                      <p className="text-lg font-bold">{Object.keys(tokenUsage).length}</p>
                      <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>سرویس فعال</p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  داده‌ای برای نمایش وجود ندارد.
                </p>
              )}
            </Surface>

            <button
              type="button"
              disabled={usageLoading}
              onClick={() => void fetchUsage()}
              className="w-full rounded-md border px-4 py-2.5 text-sm font-bold transition-opacity disabled:opacity-50"
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
