"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type AiStatus = { source: string; configured: boolean };

const SECTIONS = [
  {
    href: "/settings/general",
    title: "تنظیمات عمومی",
    desc: "نام سایت، توضیحات، فاوآیکون، تم و رنگ‌بندی",
    icon: "⚙",
    color: "#38bdf8",
    bg: "rgba(56,189,248,0.08)",
    badge: "اصلی",
  },
  {
    href: "/settings/ai",
    title: "هوش مصنوعی",
    desc: "Anthropic، Gemini، OpenRouter، DeepSeek — کلیدها، پرامپت‌ها و آمار مصرف",
    icon: "◈",
    color: "#a78bfa",
    bg: "rgba(167,139,250,0.08)",
    badge: "AI",
  },
] as const;

export default function SettingsHubPage() {
  const [aiStatuses, setAiStatuses] = useState<{
    gemini: AiStatus;
    openrouter: AiStatus;
    deepseek: AiStatus;
    anthropic: AiStatus;
    defaultProvider: string;
  } | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/settings/site");
        const j = await res.json();
        if (j.ok) {
          setAiStatuses({
            gemini: j.gemini ?? { configured: false },
            openrouter: j.openrouter ?? { configured: false },
            deepseek: j.deepseek ?? { configured: false },
            anthropic: j.anthropic ?? { configured: false },
            defaultProvider: j.settings?.defaultAiProvider ?? "deepseek",
          });
        }
      } catch {
        // non-critical
      }
    })();
  }, []);

  const configuredCount = aiStatuses
    ? [aiStatuses.gemini, aiStatuses.openrouter, aiStatuses.deepseek, aiStatuses.anthropic].filter(
        (s) => s.configured,
      ).length
    : null;

  const PROVIDER_LABELS: Record<string, string> = {
    gemini: "Gemini",
    openrouter: "OpenRouter",
    deepseek: "DeepSeek",
    anthropic: "Claude",
  };

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8">
      <div>
        <h1 className="text-3xl font-semibold">تنظیمات</h1>
        <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
          مدیریت تمام پیکربندی‌های پنل
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {SECTIONS.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="group relative flex flex-col gap-5 overflow-hidden rounded-2xl border p-6 no-underline transition-all duration-300 hover:scale-[1.015] hover:shadow-xl"
            style={{
              borderColor: "var(--border)",
              background: "var(--glass-bg)",
              backdropFilter: "blur(var(--blur-sm))",
              WebkitBackdropFilter: "blur(var(--blur-sm))",
            }}
          >
            {/* glow */}
            <div
              className="pointer-events-none absolute -inset-x-8 -top-16 h-36 rounded-full opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100"
              style={{ background: s.bg }}
            />

            <div className="relative flex items-start justify-between">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-xl text-xl"
                style={{ background: s.bg, color: s.color }}
              >
                {s.icon}
              </div>
              <span
                className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest"
                style={{ background: s.bg, color: s.color }}
              >
                {s.badge}
              </span>
            </div>

            <div className="relative flex flex-col gap-1.5">
              <h2 className="text-lg font-bold transition-colors duration-200 group-hover:text-sky-400" style={{ color: "var(--text)" }}>
                {s.title}
              </h2>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                {s.desc}
              </p>
            </div>

            {/* AI-specific status row */}
            {s.href === "/settings/ai" && aiStatuses && (
              <div className="relative flex flex-wrap items-center gap-2">
                {(["anthropic", "gemini", "openrouter", "deepseek"] as const).map((id) => {
                  const configured = aiStatuses[id]?.configured;
                  const isDefault = aiStatuses.defaultProvider === id;
                  return (
                    <span
                      key={id}
                      className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-[10px] font-bold"
                      style={{
                        background: configured ? `${s.color}15` : "var(--surface)",
                        color: configured ? s.color : "var(--text-muted)",
                        border: `1px solid ${configured ? `${s.color}30` : "var(--border)"}`,
                      }}
                    >
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ background: configured ? s.color : "var(--text-muted)", opacity: configured ? 1 : 0.4 }}
                      />
                      {PROVIDER_LABELS[id]}
                      {isDefault && <span className="opacity-60">★</span>}
                    </span>
                  );
                })}
                {configuredCount !== null && (
                  <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                    {configuredCount} از ۴ سرویس فعال
                  </span>
                )}
              </div>
            )}

            <div className="relative flex items-center gap-1.5 text-xs font-bold" style={{ color: s.color }}>
              <span>ورود به تنظیمات</span>
              <span className="transition-transform duration-200 ltr:group-hover:translate-x-1 rtl:group-hover:-translate-x-1">
                ←
              </span>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick tips panel */}
      <div
        className="rounded-2xl border p-5"
        style={{ borderColor: "var(--border)", background: "var(--glass-bg)" }}
      >
        <p className="mb-3 text-sm font-bold" style={{ color: "var(--text)" }}>راهنمای سریع</p>
        <div className="grid gap-3 text-sm sm:grid-cols-3" style={{ color: "var(--text-muted)" }}>
          <div className="flex flex-col gap-1">
            <span className="font-bold" style={{ color: "var(--text)" }}>۱. شروع کنید</span>
            <span>ابتدا حداقل یک سرویس AI را در تنظیمات هوش مصنوعی پیکربندی کنید.</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="font-bold" style={{ color: "var(--text)" }}>۲. پیش‌فرض تنظیم کنید</span>
            <span>سرویس را تست کنید، سپس به‌عنوان پیش‌فرض انتخاب کنید.</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="font-bold" style={{ color: "var(--text)" }}>۳. محتوا تولید کنید</span>
            <span>از بخش CMS یا محتوا برای تولید خودکار با AI استفاده کنید.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
