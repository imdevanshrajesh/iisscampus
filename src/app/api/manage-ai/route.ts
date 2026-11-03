import { NextResponse } from "next/server";
import {
  callAiChat,
  fetchProviderModels,
  PROVIDERS,
  type AiChatMessage,
  type AiProvider,
} from "@/lib/ai/providers";
import {
  saveAiConfigToStore,
} from "@/lib/data/file-content";
import { getAiConfig } from "@/lib/data/queries";
import { contentMode } from "@/lib/data/content-mode";
import { getStaffWorkspace } from "@/lib/data/staff";
import { createStaffClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function extractJson(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch && jsonMatch[1]) {
      try {
        return JSON.parse(jsonMatch[1]);
      } catch {
        // Continue
      }
    }
    const firstBrace = text.indexOf("{");
    const lastBrace = text.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      try {
        return JSON.parse(text.slice(firstBrace, lastBrace + 1));
      } catch {
        // Continue
      }
    }
  }
  return null;
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
    }

    const { action = "generate" } = body;
    const storedConfig = await getAiConfig();

    const provider: AiProvider = (body.provider || storedConfig.provider || "xai") as AiProvider;
    const apiKey =
      (typeof body.apiKey === "string" ? body.apiKey : null) ||
      (typeof body.key === "string" ? body.key : null) ||
      request.headers.get("x-ai-api-key") ||
      request.headers.get("x-grok-api-key") ||
      storedConfig.apiKey;
    const model =
      (typeof body.model === "string" ? body.model : null) || storedConfig.model;
    const baseUrl =
      (typeof body.baseUrl === "string" ? body.baseUrl : null) || storedConfig.baseUrl;

    // Action 1: Dynamically Fetch Live Models from Provider
    if (action === "fetch-models") {
      if (!apiKey && provider !== "custom") {
        return NextResponse.json(
          { ok: false, error: "Please enter an API key to fetch available models." },
          { status: 400 },
        );
      }

      const result = await fetchProviderModels({
        provider,
        apiKey: apiKey || "",
        baseUrl,
      });

      return NextResponse.json(result);
    }

    // Action 2: Save AI Configuration to Database & Store
    if (action === "save-settings" || action === "save-key") {
      const keyToSave = typeof body.apiKey === "string" ? body.apiKey : typeof body.key === "string" ? body.key : null;
      const providerToSave: AiProvider = body.provider || provider;
      const modelToSave = body.model || model;
      const baseUrlToSave = body.baseUrl || baseUrl;

      const mode = await contentMode();

      if (mode === "supabase") {
        const supabase = await createStaffClient();
        if (!supabase) {
          return NextResponse.json(
            { ok: false, error: "Staff session required to update database settings." },
            { status: 401 },
          );
        }

        const updateRes = await supabase
          .from("campus_settings")
          .update({
            ai_provider: providerToSave,
            ai_api_key: keyToSave ? keyToSave.trim() : null,
            ai_model: modelToSave ? modelToSave.trim() : null,
            ai_base_url: baseUrlToSave ? baseUrlToSave.trim() : null,
          })
          .eq("id", true);

        if (updateRes.error) {
          console.error("Supabase settings update error:", updateRes.error);
          return NextResponse.json(
            { ok: false, error: `Database error: ${updateRes.error.message}` },
            { status: 500 },
          );
        }

        // Also sync local file as non-blocking backup if writable
        try {
          saveAiConfigToStore({
            provider: providerToSave,
            apiKey: keyToSave,
            model: modelToSave,
            baseUrl: baseUrlToSave,
          });
        } catch {
          // Ignore file errors in database mode
        }

        return NextResponse.json({
          ok: true,
          message: "AI configuration saved successfully to Supabase database (campus_settings).",
        });
      } else {
        const fileSaved = saveAiConfigToStore({
          provider: providerToSave,
          apiKey: keyToSave,
          model: modelToSave,
          baseUrl: baseUrlToSave,
        });

        if (!fileSaved) {
          return NextResponse.json(
            { ok: false, error: "Could not persist AI settings to local store." },
            { status: 500 },
          );
        }

        return NextResponse.json({
          ok: true,
          message: "AI configuration saved successfully to local campus store.",
        });
      }
    }

    // Action 3: Generate / Fill Event & Content Fields
    if (action === "generate" || action === "fill-event") {
      const userPrompt = String(body.prompt ?? "").trim();
      if (!userPrompt) {
        return NextResponse.json(
          { error: "Please enter event notes or instructions." },
          { status: 400 },
        );
      }

      const targetSection = action === "fill-event" ? "event" : body.targetSection || "auto";
      const currentEvent = body.currentEvent || null;

      // Fetch categories from workspace so the AI picks the matching category
      const workspace = await getStaffWorkspace();
      const categories = (workspace?.categories || []).map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
      }));

      const today = new Date().toISOString().split("T")[0];

      const systemPrompt = `You are the Content Copilot for the India International School Campus management desk.
Today's date: ${today}.
Available categories for activities:
${JSON.stringify(categories, null, 2)}
${currentEvent ? `Existing event details being edited:\n${JSON.stringify(currentEvent, null, 2)}` : ""}

TASK:
Convert the user's input (rough notes, email, WhatsApp message, or instructions) into a complete, structured record.

REQUIREMENTS & RULES:
1. Target Section: ${
        targetSection !== "auto"
          ? `The user specifically wants an "${targetSection}".`
          : "Auto-detect: 'event', 'announcement', 'achievement', 'faq', 'marquee', or 'wellness'."
      }
2. DESCRIPTIONS (VERY IMPORTANT):
   - If the user did not provide a description or only provided brief bullet points, YOU MUST AUTO-GENERATE high-quality, inspiring, informative descriptions!
   - 'shortDescription': A clear, punchy 1-2 sentence overview for event cards (max 200 characters).
   - 'fullDescription': 2 to 4 detailed paragraphs covering event objectives, rules, eligibility, house participation, and atmosphere. Formatted cleanly with paragraphs.
3. SCHEDULE & ACTIVITIES:
   - For events, suggest 2 to 5 logical schedule entries with time (HH:MM), title, and brief detail.
   - Outline key activities and purpose.
4. WHAT NEEDS TO BE UPLOADED (CHECKLIST):
   - Clearly state what digital assets or URLs the manager still needs to upload:
     * Cover image: "Upload a 16:9 landscape banner (min 1200x675px) hosted on Cloudinary or approved host."
     * Registration: "If registrations are needed, provide Google Form or registration page URL."
     * Document: "Attach rulebook or permission slip PDF if available."
5. MATCH CATEGORY & SLUG:
   - Assign the best matching category ID from the list.
   - Generate a clean kebab-case slug (e.g. 'inter-house-badminton-2026').

OUTPUT FORMAT:
Respond ONLY with a valid JSON object matching this exact schema:
{
  "section": "event" | "announcement" | "achievement" | "faq" | "marquee" | "wellness",
  "summary": "One sentence summary of the generated content",
  "checklist": [
    { "item": "Name of upload/item", "required": boolean, "detail": "Specific instructions on what to add" }
  ],
  "fields": {
    "title": "Event or Item Title",
    "slug": "kebab-case-slug",
    "shortDescription": "Concise summary...",
    "fullDescription": "Rich multi-paragraph description...",
    "categoryId": "UUID from categories list",
    "listing": "event" | "competition" | "external",
    "eventDate": "YYYY-MM-DD or null",
    "endDate": "YYYY-MM-DD or null",
    "startTime": "HH:MM or null",
    "endTime": "HH:MM or null",
    "locationName": "Venue name or null",
    "gradeFrom": number | null,
    "gradeTo": number | null,
    "feeAed": number | null,
    "purpose": "Purpose statement...",
    "activities": "Activities list...",
    "packingList": "What to bring or null",
    "schedule": [
      { "time": "09:00", "title": "Assembly & Registration", "detail": "Report to venue" }
    ]
  }
}`;

      const messages: AiChatMessage[] = [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ];

      const aiResponse = await callAiChat(messages, {
        provider,
        apiKey,
        model,
        baseUrl,
        temperature: 0.2,
      });

      if (!aiResponse.ok) {
        return NextResponse.json({ error: aiResponse.error }, { status: 502 });
      }

      const parsedJson = extractJson(aiResponse.content);
      if (!parsedJson) {
        return NextResponse.json(
          {
            error: "The AI responded, but the output could not be parsed as structured JSON.",
            raw: aiResponse.content,
          },
          { status: 502 },
        );
      }

      return NextResponse.json({
        ok: true,
        data: parsedJson,
      });
    }

    return NextResponse.json({ error: `Unknown action '${action}'.` }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
