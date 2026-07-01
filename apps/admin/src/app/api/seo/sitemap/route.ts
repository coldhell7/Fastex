import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { readProducts, readPosts, readPages } from "@/lib/cms-files";

export const runtime = "nodejs";

function nowIso(): string {
  return new Date().toISOString();
}

export async function GET() {
  try {
    const products = readProducts();
    const publishedProducts = products.filter((p) => p.status === "publish");
    const posts = readPosts();
    const publishedPosts = posts.filter((p) => p.status === "publish");
    const pages = readPages();
    const publishedPages = pages.filter((p) => p.status === "publish");
    const baseUrl = process.env.NEXT_PUBLIC_STOREFRONT_URL ?? "https://medalino.ir";

    const urls: Array<{ path: string; changefreq: string; priority: string; lastmod: string }> = [
      { path: "/", changefreq: "daily", priority: "1.0", lastmod: nowIso() },
      { path: "/blog", changefreq: "weekly", priority: "0.7", lastmod: nowIso() },
      ...publishedProducts.map((p) => ({
        path: `/products/${p.slug}`,
        changefreq: "weekly",
        priority: "0.8",
        lastmod: nowIso(),
      })),
      ...publishedPosts.map((p) => ({
        path: `/blog/${p.slug}`,
        changefreq: "weekly",
        priority: "0.6",
        lastmod: p.date,
      })),
      ...publishedPages.map((p) => ({
        path: `/p/${p.slug}`,
        changefreq: "monthly",
        priority: "0.5",
        lastmod: p.date,
      })),
    ];

    const xmlUrls = urls
      .map(
        (u) => `  <url>
    <loc>${baseUrl.replace(/\/$/, "")}${u.path}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`,
      )
      .join("\n");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${xmlUrls}
</urlset>`;

    return new NextResponse(xml, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, message: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}
