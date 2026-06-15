"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const nav = [
  { href: "/dashboard", label: "داشبورد", icon: "◉" },
  { href: "/cms", label: "مدیریت محتوا", icon: "⊞" },
  { href: "/cms/products", label: "محصولات", icon: "◈" },
  { href: "/orders", label: "سفارش‌ها", icon: "☰" },
  { href: "/users", label: "کاربران", icon: "◎" },
  { href: "/seo", label: "تحلیلگر سئو", icon: "◎" },
  { href: "/homepage-builder", label: "طراحی صفحه اصلی", icon: "▣" },
  { href: "/content", label: "محتوا و هوش مصنوعی", icon: "◇" },
  { href: "/settings", label: "تنظیمات", icon: "⚙" },
];

const storefrontUrl = process.env.NEXT_PUBLIC_STOREFRONT_URL ?? "https://medalino.ir";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [siteName, setSiteName] = useState("مدالینو");
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    void (async () => {
      try {
        const res = await fetch("/api/settings/site");
        const j = await res.json();
        if (j.ok && j.settings.siteName) {
          setSiteName(j.settings.siteName);
        }
      } catch {
        // use defaults
      }
    })();
  }, []);

  if (pathname === "/login") {
    return <>{children}</>;
  }

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  };

  return (
    <div
      data-theme="admin"
      className="min-h-screen"
      style={{
        display: "grid",
        gridTemplateColumns: collapsed ? "var(--sidebar-collapsed) 1fr" : "var(--sidebar-width) 1fr",
        background: "var(--bg)",
        color: "var(--text)",
        fontFamily: "var(--font-sans)",
        transition: "grid-template-columns var(--transition-slow)",
      }}
    >
      <aside
        className="flex flex-col gap-1 overflow-hidden p-3"
        style={{
          borderInlineEnd: "1px solid var(--glass-border)",
          background: "var(--glass-bg)",
          backdropFilter: `blur(var(--blur-md))`,
          WebkitBackdropFilter: `blur(var(--blur-md))`,
          height: "100vh",
          position: "sticky",
          top: 0,
          transition: "all var(--transition-slow)",
        }}
      >
        <div className="flex items-center justify-between gap-2 px-2 py-3" style={{ minHeight: 48 }}>
          {mounted && !collapsed ? (
            <span className="truncate text-lg font-bold" style={{ color: "var(--accent)" }}>
              {siteName}
            </span>
          ) : !collapsed ? (
            <span className="truncate text-lg font-bold" style={{ color: "var(--accent)" }}>
              مدالینو
            </span>
          ) : null}
          <button
            type="button"
            aria-label={collapsed ? "باز کردن نوار کناری" : "جمع کردن نوار کناری"}
            onClick={() => setCollapsed((c) => !c)}
            className="flex cursor-pointer items-center justify-center rounded-lg text-sm transition-all"
            style={{
              width: 32,
              height: 32,
              background: "var(--surface)",
              border: "1px solid var(--border)",
              color: "var(--text-muted)",
            }}
          >
            <span style={{ transition: "transform var(--transition-base)", display: "inline-block", transform: collapsed ? "rotate(180deg)" : "rotate(0deg)" }}>
              ⟨
            </span>
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto py-2">
          {nav.map((item) => {
            const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm no-underline transition-all"
                style={{
                  color: active ? "var(--accent)" : "var(--text-muted)",
                  background: active ? "var(--accent-dim)" : "transparent",
                  border: active ? "1px solid var(--border-active)" : "1px solid transparent",
                  fontWeight: active ? 700 : 400,
                }}
              >
                <span className="flex-shrink-0 text-base" style={{ width: 20, textAlign: "center" }}>
                  {item.icon}
                </span>
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {!collapsed && (
          <div
            className="mt-auto flex items-center gap-3 rounded-xl px-3 py-3 text-xs"
            style={{
              borderTop: "1px solid var(--glass-border)",
              color: "var(--text-muted)",
            }}
          >
            <span style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--accent-dim)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--accent)", fontSize: 12, fontWeight: 700 }}>
              A
            </span>
            <span className="truncate">مدیر سیستم</span>
          </div>
        )}
      </aside>

      <div className="flex min-h-screen min-w-0 flex-col">
        <header
          className="flex flex-wrap items-center justify-between gap-3 border-b px-6 py-3"
          style={{
            borderColor: "var(--border)",
            background: "var(--glass-bg)",
            backdropFilter: `blur(var(--blur-sm))`,
            WebkitBackdropFilter: `blur(var(--blur-sm))`,
            position: "sticky",
            top: 0,
            zIndex: 10,
          }}
        >
          <span className="text-sm" style={{ color: "var(--text-muted)" }}>
            پنل مدیریت
          </span>
          <span className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void logout()}
              className="cursor-pointer rounded-xl border px-4 py-2 text-sm font-bold transition-all"
              style={{
                borderColor: "var(--border)",
                color: "var(--text-muted)",
                background: "transparent",
              }}
            >
              خروج
            </button>
            <Link
              href={storefrontUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl border px-4 py-2 text-sm font-bold no-underline transition-all"
              style={{
                borderColor: "var(--accent)",
                color: "var(--accent)",
                background: "var(--accent-dim)",
              }}
            >
              مشاهدهٔ فروشگاه
            </Link>
          </span>
        </header>
        <main
          className="flex-1 overflow-auto p-8"
          style={{
            minHeight: "calc(100vh - 60px)",
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
