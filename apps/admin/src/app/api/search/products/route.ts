import { NextResponse } from "next/server";
import { readProducts } from "@/lib/cms-files";
import { logger } from "@repo/shared";

export const runtime = "nodejs";

/**
 * GET /api/search/products?q=...
 * Returns filtered products matching the search query.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim().toLowerCase();

  try {
    const products = readProducts().filter((p) => p.status === "publish");

    if (!q) {
      return NextResponse.json({ ok: true, products: [] });
    }

    const filtered = products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.summary.toLowerCase().includes(q) ||
        (p.keywords && p.keywords.some((k) => k.toLowerCase().includes(q))),
    );

    logger.info(`search/products: q="${q}" → ${filtered.length} results`);

    return NextResponse.json({ ok: true, products: filtered });
  } catch (e) {
    logger.error("search/products error", e);
    return NextResponse.json(
      { ok: false, message: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}
