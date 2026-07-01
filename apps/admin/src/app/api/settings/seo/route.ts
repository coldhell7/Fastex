import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import type { SeoSettings } from "@repo/shared";
import { SEO_DEFAULTS as BASE_SEO_DEFAULTS } from "@repo/shared";

const SEO_FILE = path.join(process.cwd(), ".data", "seo-settings.json");
const SEO_DIR = path.dirname(SEO_FILE);
const STOREFRONT_PUBLIC = path.join(process.cwd(), "..", "..", "apps", "storefront", "public");

/** Admin-specific SeoSettings that extends the shared one with robots/llms fields. */
type AdminSeoSettings = SeoSettings & {
  robotsTxt: string;
  llmsTxt: string;
};

const DEFAULTS: AdminSeoSettings = {
  ...BASE_SEO_DEFAULTS,
  robotsTxt: "User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /_next/\n\nSitemap: https://medalino.ir/sitemap.xml",
  llmsTxt: "# Medalino\nOnline health and wellness store.",
};

function load(): AdminSeoSettings {
  try {
    if (!fs.existsSync(SEO_FILE)) return { ...DEFAULTS };
    return { ...DEFAULTS, ...JSON.parse(fs.readFileSync(SEO_FILE, "utf8")) };
  } catch {
    return { ...DEFAULTS };
  }
}

function save(settings: Partial<AdminSeoSettings>) {
  if (!fs.existsSync(SEO_DIR)) {
    fs.mkdirSync(SEO_DIR, { recursive: true });
  }
  const current = load();
  fs.writeFileSync(SEO_FILE, JSON.stringify({ ...current, ...settings }, null, 2), "utf8");
}

function syncStorefrontFiles(settings: Partial<AdminSeoSettings>) {
  if (!fs.existsSync(STOREFRONT_PUBLIC)) return;
  if (settings.robotsTxt !== undefined) {
    fs.writeFileSync(path.join(STOREFRONT_PUBLIC, "robots.txt"), settings.robotsTxt, "utf8");
  }
  if (settings.llmsTxt !== undefined) {
    fs.writeFileSync(path.join(STOREFRONT_PUBLIC, "llms.txt"), settings.llmsTxt, "utf8");
  }
}

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ ok: true, settings: load() });
}

export async function PUT(req: Request) {
  try {
    const body = (await req.json()) as { settings?: Partial<AdminSeoSettings> };
    if (!body.settings || typeof body.settings !== "object") {
      return NextResponse.json({ ok: false, message: "فیلد settings معتبر نیست." }, { status: 400 });
    }
    save(body.settings);
    syncStorefrontFiles(body.settings);
    return NextResponse.json({ ok: true, settings: load() });
  } catch (e) {
    return NextResponse.json({ ok: false, message: e instanceof Error ? e.message : "خطا" }, { status: 400 });
  }
}