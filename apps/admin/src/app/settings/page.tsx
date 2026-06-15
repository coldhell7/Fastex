import Link from "next/link";

const sections = [
  {
    href: "/settings/general",
    title: "تنظیمات عمومی",
    desc: "نام سایت، توضیحات، فاوآیکون، تم و رنگ‌بندی پنل مدیریت",
    icon: "⚙",
    gradient: "from-sky-500/20 to-blue-600/10",
    badge: "اصلی",
  },
  {
    href: "/settings/ai",
    title: "هوش مصنوعی",
    desc: "مدیریت سرویس‌های Gemini، OpenRouter و DeepSeek، پرامپت‌ها و آمار مصرف",
    icon: "◇",
    gradient: "from-violet-500/20 to-purple-600/10",
    badge: "AI",
  },
];

export default function SettingsHubPage() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8">
      <div>
        <h1 className="text-3xl font-semibold">تنظیمات</h1>
        <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
          مدیریت تمام تنظیمات پنل مدیریت
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {sections.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="group relative flex flex-col gap-5 overflow-hidden rounded-xl border p-6 no-underline transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
            style={{
              borderColor: "var(--border)",
              background: "var(--glass-bg)",
              backdropFilter: "blur(var(--blur-sm))",
              WebkitBackdropFilter: "blur(var(--blur-sm))",
            }}
          >
            <div
              className="pointer-events-none absolute -inset-x-4 -top-20 h-40 rounded-full opacity-60 blur-3xl transition-opacity duration-300 group-hover:opacity-100"
              style={{ background: `linear-gradient(135deg, ${s.gradient})` }}
            />
            <div className="flex items-start justify-between">
              <span
                className="relative flex h-12 w-12 items-center justify-center rounded-xl text-xl"
                style={{ background: "var(--accent-dim)" }}
              >
                {s.icon}
              </span>
              {s.badge && (
                <span
                  className="rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider"
                  style={{
                    background: "var(--accent-dim)",
                    color: "var(--accent)",
                  }}
                >
                  {s.badge}
                </span>
              )}
            </div>
            <div className="relative">
              <h2
                className="text-lg font-bold transition-colors group-hover:text-sky-400"
                style={{ color: "var(--text)" }}
              >
                {s.title}
              </h2>
              <p
                className="mt-1.5 text-sm leading-relaxed"
                style={{ color: "var(--text-muted)" }}
              >
                {s.desc}
              </p>
            </div>
            <div
              className="relative flex items-center gap-1 text-xs font-medium"
              style={{ color: "var(--accent)" }}
            >
              <span>ورود به تنظیمات</span>
              <span className="transition-transform duration-200 group-hover:translate-x-1 rtl:block hidden">
                ←
              </span>
              <span className="transition-transform duration-200 group-hover:-translate-x-1 ltr:block hidden">
                →
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
