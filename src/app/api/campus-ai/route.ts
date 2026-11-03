import { NextResponse } from "next/server";
import { callAiChat, type AiChatMessage } from "@/lib/ai/providers";
import { buildCampusAiSystemPrompt } from "@/lib/ai/campus-knowledge";
import { readAiConfig } from "@/lib/data/file-content";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || !Array.isArray(body.messages)) {
      return NextResponse.json(
        { error: "Invalid request payload. Expected 'messages' array." },
        { status: 400 },
      );
    }

    const clientMessages: AiChatMessage[] = body.messages
      .slice(-8) // Keep last 8 turns for safety and context window
      .filter((m: unknown): m is AiChatMessage => {
        if (!m || typeof m !== "object") return false;
        const msg = m as Record<string, unknown>;
        return (
          (msg.role === "user" || msg.role === "assistant") &&
          typeof msg.content === "string" &&
          msg.content.trim().length > 0 &&
          msg.content.length < 2000
        );
      });

    if (clientMessages.length === 0) {
      return NextResponse.json({ error: "No valid messages found." }, { status: 400 });
    }

    const systemPrompt = await buildCampusAiSystemPrompt();
    const fullMessages: AiChatMessage[] = [
      { role: "system", content: systemPrompt },
      ...clientMessages,
    ];

    // Optional client-provided API key from header or body, fallback to server store
    const headerKey = request.headers.get("x-grok-api-key") || request.headers.get("x-ai-api-key");
    const aiConfig = readAiConfig();
    const providedKey =
      (typeof body.apiKey === "string" ? body.apiKey : null) || headerKey || aiConfig.apiKey;

    const result = await callAiChat(fullMessages, {
      provider: aiConfig.provider,
      apiKey: providedKey,
      model: aiConfig.model,
      baseUrl: aiConfig.baseUrl,
      temperature: 0.3,
      maxTokens: 1000,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 502 });
    }

    return NextResponse.json({ reply: result.content });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
