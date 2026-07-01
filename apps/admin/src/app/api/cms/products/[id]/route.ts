import { NextResponse } from "next/server";
import { readProducts, writeProducts } from "@/lib/cms-files";
import { mergeProductPayload } from "@/lib/cms-product-payload";
import type { CmsProduct } from "@repo/cms/types";
import {
  okResponse,
  notFoundError,
  errorResponse,
} from "@/lib/cms-utils";
import { logger } from "@repo/shared";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  try {
    const product = readProducts().find((p) => p.id === id);
    if (!product) return notFoundError();
    return okResponse({ product });
  } catch (e) {
    return errorResponse(e);
  }
}

export async function PUT(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  try {
    const body = (await req.json()) as Partial<CmsProduct>;
    const products = readProducts();
    const idx = products.findIndex((p) => p.id === id);
    if (idx === -1) return notFoundError();
    const cur = products[idx]!;
    const merged = mergeProductPayload(body, cur);
    if (merged.slug !== cur.slug && products.some((p) => p.slug === merged.slug && p.id !== id)) {
      return NextResponse.json({ ok: false, message: "slug_exists" }, { status: 409 });
    }
    merged.id = cur.id;
    products[idx] = merged;
    writeProducts(products);
    logger.info(`products/${id}: updated`);
    return okResponse({ product: merged });
  } catch (e) {
    return errorResponse(e);
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  try {
    const all = readProducts();
    const next = all.filter((p) => p.id !== id);
    if (next.length === all.length) return notFoundError();
    writeProducts(next);
    logger.info(`products/${id}: deleted`);
    return okResponse({});
  } catch (e) {
    return errorResponse(e);
  }
}
