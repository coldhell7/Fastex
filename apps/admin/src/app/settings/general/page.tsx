"use client";

import { useEffect, useState } from "react";
import { Surface } from "@repo/ui/react";

type SiteSettingsForm = {
  siteName: string;
  siteDescription: string;
  siteUrl: string;
  theme: "dark" | "light" | "auto";
  accentColor: string;
  faviconDataUrl: string;
  bgDark: string;
  bgElevatedDark: string;
  surfaceDark: string;
  textDark: string;
  textMutedDark: string;
  accentDark: string;
  bgLight: string;
  bgElevatedLight: string;
  surfaceLight: string;
  textLight: string;
  textMutedLight: string;
  accentLight: string;
};

const COLOR_FIELDS = {
  dark: [
    { key: "bgDark", label: "پس‌زمینه" },
    { key: "bgElevatedDark", label: "پس‌زمینه بالا" },
    { key: "surfaceDark", label: "سطح" },
    { key: "textDark", label: "متن" },
    { key: "textMutedDark", label: "متن کم‌رنگ" },
    { key: "accentDark", label: "تأکید" },
  ],
  light: [
    { key: "bgLight", label: "پس‌زمینه" },
    { key: "bgElevatedLight", label: "پس‌زمینه بالا" },
    { key: "surfaceLight", label: "سطح" },
    { key: "textLight", label: "متن" },
    { key: "textMutedLight", label: "متن کم‌رنگ" },
    { key: "accentLight", label: "تأکید" },
  ],
} as const;

export default function GeneralSettingsPage() {
  const [settings, setSettings] = useState<SiteSettingsForm>({
    siteName: "",
    siteDescription: "",
    siteUrl: "",
    theme: "dark",
    accentColor: "#38bdf8",
    faviconDataUrl: "",
    bgDark: "#0b1220",
    bgElevatedDark: "#111827",
    surfaceDark: "#151f33",
    textDark: "#e5e7eb",
    textMutedDark: "#94a3b8",
    accentDark: "#38bdf8",
    bgLight: "#f8fafc",
    bgElevatedLight: "#ffffff",
    surfaceLight: "#ffffff",
    textLight: "#0f172a",
    textMutedLight: "#64748b",
    accentLight: "#0284c7",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [colorMode, setColorMode] = useState<"dark" | "light">("dark");

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/settings/site");
        const j = await res.json();
        if (j.ok) {
          setSettings((prev) => ({ ...prev, ...j.settings }));
        }
      } catch {
        setMessage("خطا در بارگذاری تنظیمات");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const saveSettings = async () => {
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/settings/site", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(settings),
      });
      const j = await res.json();
      if (j.ok) setMessage("تنظیمات سایت ذخیره شد.");
      else setMessage(j.message ?? "خطا در ذخیره");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "خطا");
    } finally {
      setSaving(false);
    }
  };

  const handleFaviconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 500_000) { setMessage("حجم فایل باید کمتر از 500KB باشد"); return; }
    const reader = new FileReader();
    reader.onload = () => setSettings((prev) => ({ ...prev, faviconDataUrl: reader.result as string }));
    reader.readAsDataURL(file);
  };

  const update = (key: keyof SiteSettingsForm, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  if (loading) return <p className="p-8 text-sm">در حال بارگذاری…</p>;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">تنظیمات عمومی</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            مدیریت مشخصات سایت
          </p>
        </div>
        <button
          type="button"
          disabled={saving}
          onClick={() => void saveSettings()}
          className="rounded-md px-6 py-2 text-sm font-bold text-white"
          style={{ background: "var(--accent)" }}
        >
          {saving ? "در حال ذخیره…" : "ذخیرهٔ تنظیمات"}
        </button>
      </div>

      {message && (
        <div className="rounded-md border p-3 text-sm" style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" }}>
          {message}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-6">
          <Surface title="مشخصات سایت">
            <div className="flex flex-col gap-4">
              <label className="text-sm font-medium">
                نام سایت
                <input className="mt-1 w-full rounded-md border p-2 text-sm" style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" }} value={settings.siteName} onChange={(e) => update("siteName", e.target.value)} />
              </label>
              <label className="text-sm font-medium">
                توضیحات سایت
                <input className="mt-1 w-full rounded-md border p-2 text-sm" style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" }} value={settings.siteDescription} onChange={(e) => update("siteDescription", e.target.value)} />
              </label>
              <label className="text-sm font-medium">
                آدرس سایت
                <input className="mt-1 w-full rounded-md border p-2 text-sm" style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" }} value={settings.siteUrl} onChange={(e) => update("siteUrl", e.target.value)} dir="ltr" />
              </label>
            </div>

            <div className="mt-6">
              <p className="mb-3 text-sm font-medium">Favicon</p>
              <div className="flex items-center gap-4">
                {settings.faviconDataUrl ? (
                  <img src={settings.faviconDataUrl} alt="favicon" className="h-10 w-10 rounded" />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded text-xs" style={{ background: "var(--surface)", color: "var(--text-muted)" }}>بدون آیکون</div>
                )}
                <div>
                  <input type="file" accept="image/*" onChange={handleFaviconUpload} className="text-sm" />
                  <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>فرمت ICO یا PNG — حداکثر 500KB</p>
                </div>
              </div>
            </div>
          </Surface>

          <Surface title="رنگ‌بندی">
            <label className="text-sm font-medium">
              حالت تم
              <select className="mt-1 w-full rounded-md border p-2 text-sm" style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" }} value={settings.theme} onChange={(e) => update("theme", e.target.value)}>
                <option value="dark">تاریک</option>
                <option value="light">روشن</option>
                <option value="auto">خودکار (سیستم)</option>
              </select>
            </label>

            <div className="mt-4 flex gap-1 rounded-md p-1" style={{ background: "var(--bg-muted)" }}>
              {(["dark", "light"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setColorMode(mode)}
                  className="flex-1 rounded px-3 py-1.5 text-sm font-medium transition-colors"
                  style={{
                    background: colorMode === mode ? "var(--surface)" : "transparent",
                    color: "var(--text)",
                  }}
                >
                  {mode === "dark" ? "تاریک" : "روشن"}
                </button>
              ))}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              {COLOR_FIELDS[colorMode].map(({ key, label }) => (
                <label key={key} className="text-xs">
                  {label}
                  <div className="mt-1 flex items-center gap-2">
                    <input
                      type="color"
                      value={settings[key as keyof SiteSettingsForm] as string}
                      onChange={(e) => update(key as keyof SiteSettingsForm, e.target.value)}
                      className="h-8 w-10 cursor-pointer rounded border"
                    />
                    <input
                      className="flex-1 rounded border p-1 text-xs font-mono"
                      style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" }}
                      value={settings[key as keyof SiteSettingsForm] as string}
                      onChange={(e) => update(key as keyof SiteSettingsForm, e.target.value)}
                      dir="ltr"
                    />
                  </div>
                </label>
              ))}
            </div>
          </Surface>
        </div>

        <div className="flex flex-col gap-6">
          <Surface title="راهنما">
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              تنظیمات عمومی سایت مانند نام، توضیحات، فاوآیکون و رنگ‌بندی پنل را مدیریت کنید.
            </p>
            <p className="mt-3 text-sm" style={{ color: "var(--text-muted)" }}>
              برای تنظیمات هوش مصنوعی به صفحهٔ{" "}
              <a href="/settings/ai" className="font-bold no-underline" style={{ color: "var(--accent)" }}>
                تنظیمات هوش مصنوعی
              </a>{" "}
              بروید.
            </p>
          </Surface>
        </div>
      </div>
    </div>
  );
}
