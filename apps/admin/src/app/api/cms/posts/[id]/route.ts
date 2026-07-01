import { NextResponse } from "next/server";
import { readPosts, writePosts } from "@/lib/cms-files";
import type { CmsPost } from "@repo/cms/types";
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
    const post = readPosts().find((p) => p.id === id);
    if (!post) return notFoundError();
    return okResponse({ post });
  } catch (e) {
    return errorResponse(e);
  }
}

export async function PUT(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  try {
    const body = (await req.json()) as Partial<CmsPost>;
    const posts = readPosts();
    const idx = posts.findIndex((p) => p.id === id);
    if (idx === -1) return notFoundError();
    const cur = posts[idx]!;
    const slug = body.slug !== undefined ? String(body.slug).trim().toLowerCase().replace(/\s+/g, "-") : cur.slug;
    if (slug !== cur.slug && posts.some((p) => p.slug === slug && p.id !== id)) {
      return NextResponse.json({ ok: false, message: "slug_exists" }, { status: 409 });
    }
    const updated: CmsPost = {
      ...cur,
      slug,
      title: body.title !== undefined ? String(body.title).trim() : cur.title,
      excerpt: body.excerpt !== undefined ? String(body.excerpt) : cur.excerpt,
      body: body.body !== undefined ? String(body.body) : cur.body,
      status: body.status === "publish" || body.status === "draft" ? body.status : cur.status,
      date: body.date !== undefined ? String(body.date) : cur.date,
      categories: body.categories !== undefined ? (Array.isArray(body.categories) ? body.categories.map(String) : cur.categories) : cur.categories,
      coverImage: body.coverImage !== undefined ? (String(body.coverImage || "").trim() || undefined) : cur.coverImage,
      metaTitle: body.metaTitle !== undefined ? (String(body.metaTitle || "").trim() || undefined) : cur.metaTitle,
      metaDescription:
        body.metaDescription !== undefined ? (String(body.metaDescription || "").trim() || undefined) : cur.metaDescription,
    };
    posts[idx] = updated;
    writePosts(posts);
    logger.info(`posts/${id}: updated`);
    return okResponse({ post: updated });
  } catch (e) {
    return errorResponse(e);
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  try {
    const all = readPosts();
    const posts = all.filter((p) => p.id !== id);
    if (posts.length === all.length) return notFoundError();
    writePosts(posts);
    logger.info(`posts/${id}: deleted`);
    return okResponse({});
  } catch (e) {
    return errorResponse(e);
  }
}
