/**
 * Generic CMS route utilities to reduce duplication between
 * posts/pages/products route handlers.
 */

import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";

/**
 * Read JSON from a content file.
 */
export function readContentFile<T>(filePath: string): T[] {
  const raw = fs.readFileSync(filePath, "utf8");
  return JSON.parse(raw) as T[];
}

/**
 * Write JSON array to a content file.
 */
export function writeContentFile<T>(filePath: string, data: T[]): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
}

/**
 * Return a 500 error response with a consistent shape.
 */
export function errorResponse(e: unknown, status = 500): NextResponse {
  return NextResponse.json(
    { ok: false, message: e instanceof Error ? e.message : String(e) },
    { status },
  );
}

/**
 * Return a 400 validation error.
 */
export function validationError(message: string): NextResponse {
  return NextResponse.json({ ok: false, message }, { status: 400 });
}

/**
 * Return a 404 not-found error.
 */
export function notFoundError(message = "not_found"): NextResponse {
  return NextResponse.json({ ok: false, message }, { status: 404 });
}

/**
 * Return a 409 conflict error.
 */
export function conflictError(message: string): NextResponse {
  return NextResponse.json({ ok: false, message }, { status: 409 });
}

/**
 * Return a success JSON with the given payload.
 */
export function okResponse(payload: Record<string, unknown>): NextResponse {
  return NextResponse.json({ ok: true, ...payload });
}

/**
 * Generic GET handler to list all items from a file.
 */
export function handleList<T>(filePath: string, key: string): NextResponse {
  try {
    const items = readContentFile<T>(filePath);
    return okResponse({ [key]: items });
  } catch (e) {
    return errorResponse(e);
  }
}

/**
 * Generic GET by ID handler.
 */
export function handleGetById<T extends { id: string }>(
  filePath: string,
  id: string,
  key: string,
): NextResponse {
  try {
    const items = readContentFile<T>(filePath);
    const item = items.find((i) => i.id === id);
    if (!item) return notFoundError();
    return okResponse({ [key]: item });
  } catch (e) {
    return errorResponse(e);
  }
}

/**
 * Generic DELETE handler.
 */
export function handleDelete<T extends { id: string }>(
  filePath: string,
  id: string,
): NextResponse {
  try {
    const all = readContentFile<T>(filePath);
    const next = all.filter((i) => i.id !== id);
    if (next.length === all.length) return notFoundError();
    writeContentFile(filePath, next);
    return okResponse({});
  } catch (e) {
    return errorResponse(e);
  }
}

/**
 * Generic PUT (update by ID) handler.
 */
export function handleUpdate<T extends { id: string }>(
  filePath: string,
  id: string,
  updates: Partial<T>,
): NextResponse {
  try {
    const items = readContentFile<T>(filePath);
    const idx = items.findIndex((i) => i.id === id);
    if (idx === -1) return notFoundError();
    items[idx] = { ...items[idx], ...updates };
    writeContentFile(filePath, items);
    return okResponse({} as Record<string, unknown>);
  } catch (e) {
    return errorResponse(e);
  }
}

/**
 * Generate a URL-safe slug from a string.
 */
export function toSlug(input: string): string {
  return String(input ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\u0600-\u06FF-]/gi, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
