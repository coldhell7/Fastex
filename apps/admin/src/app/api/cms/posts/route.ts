import { NextResponse } from "next/server";
import { readPosts, writePosts } from "@/lib/cms-files";
import type { CmsPost } from "@repo/cms/types";
import { randomUUID } from "node:crypto";
import { okResponse, errorResponse } from "@/lib/cms-utils";
import { logger } from "@repo/shared";

export const runtime = "nodejs";

export async function PUT(req: Request) {
  try {
    const body = (await req.json()) as Partial<CmsPost>;
    if (!body.id) {
      return NextResponse.json({ ok: false, message: "id_required" }, { status: 400 });
    }
    const posts = readPosts();
    const idx = posts.findIndex((p) => p.id === body.id);
    if (idx === -1) {
      return NextResponse.json({ ok: false, message: "not_found" }, { status: 404 });
    }
    posts[idx] = { ...posts[idx], ...body };
    writePosts(posts);
    logger.info(`posts (list PUT): updated ${body.id}`);
    return okResponse({ post: posts[idx] });
  } catch (e) {
    return errorResponse(e);
  }
}

export async function GET() {
  try {
    const posts = readPosts();
    logger.info(`posts (list GET): ${posts.length} items`);
    return okResponse({ posts });
  } catch (e) {
    return errorResponse(e);
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<CmsPost>;
    const title = String(body.title ?? "").trim();
    const slug = String(body.slug ?? "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9\u0600-\u06FF-]/gi, "-")
      .replace(/-+/g, "-");
    if (!title || !slug) {
      return NextResponse.json({ ok: false, message: "title_and_slug_required" }, { status: 400 });
    }
    const posts = readPosts();
    if (posts.some((p) => p.slug === slug)) {
      return NextResponse.json({ ok: false, message: "slug_exists" }, { status: 409 });
    }
    const now = new Date().toISOString();
    const post: CmsPost = {
      id: randomUUID(),
      slug,
      title,
      excerpt: String(body.excerpt ?? "").trim(),
      body: String(body.body ?? "").trim() || "<p></p>",
      status: body.status === "publish" ? "publish" : "draft",
      date: body.date && String(body.date).trim() ? String(body.date) : now,
      categories: Array.isArray(body.categories) ? body.categories.map(String) : [],
      coverImage: body.coverImage ? String(body.coverImage) : undefined,
      metaTitle: body.metaTitle ? String(body.metaTitle) : undefined,
      metaDescription: body.metaDescription ? String(body.metaDescription) : undefined,
    };
    posts.unshift(post);
    writePosts(posts);
    logger.info(`posts (POST): created ${post.slug}`);
    return okResponse({ post });
  } catch (e) {
    return errorResponse(e);
  }
}
