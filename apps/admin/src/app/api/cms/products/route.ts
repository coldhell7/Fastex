import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { readProducts, writeProducts } from "@/lib/cms-files";
import { mergeProductPayload } from "@/lib/cms-product-payload";
import type { CmsProduct } from "@repo/cms/types";
import { okResponse, errorResponse } from "@/lib/cms-utils";
import { logger } from "@repo/shared";

export const runtime = "nodejs";

export async function PUT(req: Request) {
  try {
    const body = (await req.json()) as Partial<CmsProduct>;
    if (!body.id) {
      return NextResponse.json({ ok: false, message: "id_required" }, { status: 400 });
    }
    const products = readProducts();
    const idx = products.findIndex((p) => p.id === body.id);
    if (idx === -1) {
      return NextResponse.json({ ok: false, message: "not_found" }, { status: 404 });
    }
    products[idx] = { ...products[idx], ...body };
    writeProducts(products);
    logger.info(`products (list PUT): updated ${body.id}`);
    return okResponse({ product: products[idx] });
  } catch (e) {
    return errorResponse(e);
  }
}

export async function GET() {
  try {
    const products = readProducts();
    logger.info(`products (list GET): ${products.length} items`);
    return okResponse({ products });
  } catch (e) {
    return errorResponse(e);
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<CmsProduct>;
    const merged = mergeProductPayload(body);
    if (!merged.name || !merged.slug) {
      return NextResponse.json({ ok: false, message: "name_and_slug_required" }, { status: 400 });
    }
    const products = readProducts();
    if (products.some((p) => p.slug === merged.slug)) {
      return NextResponse.json({ ok: false, message: "slug_exists" }, { status: 409 });
    }
    const product: CmsProduct = { ...merged, id: randomUUID() };
    products.unshift(product);
    writeProducts(products);
    logger.info(`products (POST): created ${product.slug}`);
    return okResponse({ product });
  } catch (e) {
    return errorResponse(e);
  }
}
