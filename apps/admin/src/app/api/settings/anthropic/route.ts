import { NextResponse } from "next/server";
import {
  getEffectiveAnthropicApiKey,
  maskApiKey,
  readAnthropicApiKeyFromFile,
  writeAnthropicApiKeyToFile,
} from "@/lib/site-settings";

export const runtime = "nodejs";

export async function GET() {
  const envSet = Boolean(process.env.ANTHROPIC_API_KEY?.trim());
  const fileKey = readAnthropicApiKeyFromFile();
  const effective = getEffectiveAnthropicApiKey();

  let source: "env" | "file" | "none" = "none";
  if (envSet) source = "env";
  else if (fileKey) source = "file";

  return NextResponse.json({
    ok: true,
    source,
    configured: Boolean(effective),
    maskedKey: effective ? maskApiKey(effective) : null,
  });
}

export async function POST(req: Request) {
  const body = (await req.json()) as { apiKey?: string };
  const apiKey = body.apiKey?.trim() ?? "";
  if (!apiKey) {
    return NextResponse.json({ ok: false, message: "توکن خالی است." }, { status: 400 });
  }
  writeAnthropicApiKeyToFile(apiKey);
  return NextResponse.json({
    ok: true,
    source: process.env.ANTHROPIC_API_KEY?.trim() ? "env" : "file",
    maskedKey: maskApiKey(getEffectiveAnthropicApiKey() ?? ""),
  });
}
