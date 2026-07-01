import fs from "node:fs";
import path from "node:path";
import type { SeoSettings } from "@repo/shared";
import { SEO_DEFAULTS } from "@repo/shared";

const SETTINGS_FILE = path.join(
  process.cwd(),
  "..",
  "..",
  "apps",
  "admin",
  ".data",
  "site-settings.json",
);

const SEO_FILE = path.join(
  process.cwd(),
  "..",
  "..",
  "apps",
  "admin",
  ".data",
  "seo-settings.json",
);

export type SiteSettings = {
  siteName: string;
  siteDescription: string;
  siteUrl: string;
  faviconDataUrl: string;
  theme: string;
  accentColor: string;
};

const DEFAULTS: SiteSettings = {
  siteName: "مدالینو",
  siteDescription: "فروشگاه و مجله سلامت مدالینو",
  siteUrl: "https://medalino.ir",
  faviconDataUrl: "",
  theme: "dark",
  accentColor: "#38bdf8",
};

// Use the shared SEO defaults to avoid duplication
// (SEO_DEFAULTS imported from @repo/shared)

export function getSiteSettings(): SiteSettings {
  try {
    if (!fs.existsSync(SETTINGS_FILE)) return { ...DEFAULTS };
    const raw = fs.readFileSync(SETTINGS_FILE, "utf8");
    const parsed = JSON.parse(raw) as Partial<SiteSettings>;
    return { ...DEFAULTS, ...parsed };
  } catch {
    return { ...DEFAULTS };
  }
}

export function getSeoSettings(): SeoSettings {
  try {
    if (!fs.existsSync(SEO_FILE)) return { ...SEO_DEFAULTS };
    const raw = fs.readFileSync(SEO_FILE, "utf8");
    const parsed = JSON.parse(raw) as Partial<SeoSettings>;
    return { ...SEO_DEFAULTS, ...parsed };
  } catch {
    return { ...SEO_DEFAULTS };
  }
}

export function applyMetaTemplate(template: string, vars: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, "g"), value);
  }
  return result;
}