import Link from "next/link";

const sections = [
  {
    href: "/settings/general",
    title: "تنظیمات عمومی",
    desc: "نام سایت، توضیحات، فاوآیکون، تم و رنگ‌بندی پنل مدیریت",
    icon: "⚙",
  },
  {
    href: "/settings/ai",
    title: "هوش مصنوعی",
    desc: "اتصال به سرویس‌های Gemini، OpenRouter و DeepSeek، پرامپت‌ها و آمار مصرف",
    icon: "◇",
  },
];

export default function SettingsHubPage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8">
      <div>
        <h1 className="text-3xl font-semibold">تنظیمات</h1>
        <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
          مدیریت تنظیمات پنل مدیریت
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {sections.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="group flex flex-col gap-4 rounded-xl border p-6 no-underline transition-all hover:scale-[1.02]"
            style={{
              borderColor: "var(--border)",
              background: "var(--glass-bg)",
              backdropFilter: "blur(var(--blur-sm))",
              WebkitBackdropFilter: "blur(var(--blur-sm))",
            }}
          >
            <span className="text-2xl">{s.icon}</span>
            <div>
              <h2 className="text-lg font-bold" style={{ color: "var(--text)" }}>{s.title}</h2>
              <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>{s.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
