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
import { extractEventFromNaturalText } from "@/lib/ai/smart-extractor";
import { autoAddAiRecord } from "@/lib/manage/ai-actions";

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

    // Action 3: Conversational Chat Assistant (Can create & add events interactively)
    if (action === "chat") {
      const userMessage = String(body.message ?? body.prompt ?? "").trim();
      if (!userMessage) {
        return NextResponse.json({ error: "Please enter a message to chat." }, { status: 400 });
      }

      const autoAdd = Boolean(body.autoAdd);
      const workspace = await getStaffWorkspace();
      const categories = (workspace?.categories || []).map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
      }));

      const isEventIntent =
        /(add|create|new|schedule|organize|host|post|setup)\s+(an?\s+)?(event|match|tournament|competition|gala|quiz|meet|exhibition|carnival|session|assembly)/i.test(
          userMessage,
        ) ||
        /(tournament|championship|gala|sports day|science exhibition|debate|quiz|swimming|football|volleyball|basketball)/i.test(
          userMessage,
        ) ||
        body.targetSection === "event";

      let generatedEvent = null;
      let conversationalReply = "";

      // Try LLM call if API key exists
      if (apiKey) {
        const today = new Date().toISOString().split("T")[0];
        const systemPrompt = `You are the AI Operations Copilot for the India International School Campus management desk.
Today is ${today}.
Available campus categories:
${JSON.stringify(categories, null, 2)}

The user is interacting in an administrative chat interface.
If the user asks to add, create, or schedule an event or competition, extract all relevant details and output valid JSON.
If the user is asking a general question or greeting, reply helpfully.

NO EMOJIS OR UNICODE SYMBOLS in generated titles, summaries, descriptions, or schedules.
Keep language clean, professional, and suitable for a senior secondary school.

When an event is detected, format your entire output as JSON:
{
  "reply": "Conversational reply acknowledging what was created or answered...",
  "isEvent": true,
  "event": {
    "title": "Title",
    "slug": "kebab-case-slug",
    "shortDescription": "Concise 1-2 sentence overview...",
    "fullDescription": "Multi-paragraph rich description...",
    "categoryId": "UUID matching category",
    "listing": "event",
    "eventDate": "YYYY-MM-DD",
    "startTime": "HH:MM",
    "endTime": "HH:MM",
    "locationName": "Venue",
    "gradeFrom": 5,
    "gradeTo": 12,
    "feeAed": 0,
    "schedule": [
      { "time": "09:00", "title": "Assembly", "detail": "Details..." }
    ],
    "checklist": [
      { "item": "Cover Image", "required": true, "detail": "Upload 16:9 banner" }
    ]
  }
}
If NOT an event, reply with:
{
  "reply": "Your helpful response...",
  "isEvent": false
}`;

        const chatMessages: AiChatMessage[] = [
          { role: "system", content: systemPrompt },
          ...(Array.isArray(body.history)
            ? body.history.slice(-6).map((m: any) => ({
                role: (m.role === "assistant" ? "assistant" : "user") as "user" | "assistant",
                content: String(m.content || ""),
              }))
            : []),
          { role: "user", content: userMessage },
        ];

        const aiRes = await callAiChat(chatMessages, {
          provider,
          apiKey,
          model,
          baseUrl,
          temperature: 0.2,
        });

        if (aiRes.ok) {
          const parsed = extractJson(aiRes.content);
          if (parsed && typeof parsed === "object") {
            conversationalReply = parsed.reply || "";
            if (parsed.isEvent && parsed.event) {
              generatedEvent = parsed.event;
            }
          } else {
            conversationalReply = aiRes.content;
          }
        }
      }

      // If no API key or LLM failed or didn't return an event when intent is clear:
      if (!generatedEvent && isEventIntent) {
        generatedEvent = extractEventFromNaturalText(userMessage, categories);
        if (!conversationalReply) {
          conversationalReply = `I've prepared the event details for **${generatedEvent.title}** on ${
            generatedEvent.eventDate || "the upcoming date"
          }. I generated the complete schedule, school descriptions, category, and asset checklist for you.`;
        }
      } else if (!conversationalReply) {
        conversationalReply = `Hello! I am your Campus Operations Assistant. You can chat with me to instantly add events, generate student announcements, or draft house updates. Try typing: "Add an Inter-House Swimming Gala next Tuesday at 3 PM at the main pool".`;
      }

      // If auto-add is requested or toggled on, immediately save the event
      let savedResult = null;
      if (generatedEvent && (autoAdd || /add (it|this) now|save (it|this) now|auto-add/i.test(userMessage))) {
        try {
          const addRes = await autoAddAiRecord({
            section: "event",
            fields: generatedEvent,
          });
          if (addRes.ok) {
            savedResult = addRes;
            conversationalReply += `\n\n✓ **Event Added Successfully:** "${generatedEvent.title}" is now published to your campus workspace.`;
          }
        } catch {
          // If autoAdd fails, keep draft for manual confirmation
        }
      }

      return NextResponse.json({
        ok: true,
        reply: conversationalReply,
        event: generatedEvent,
        savedEvent: savedResult,
        engine: apiKey ? "live-ai" : "builtin",
      });
    }

    // Action 4: Generate / Fill Event & Content Fields (Studio Mode)
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

      const workspace = await getStaffWorkspace();
      const categories = (workspace?.categories || []).map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
      }));

      // Try LLM call if key is present
      if (apiKey) {
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
            : "Auto-detect: 'event', 'announcement', 'achievement', 'faq', 'marquee', 'wellness', 'incharge', or 'program'."
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
6. STRICT BAN ON EMOJIS & UNICODE SYMBOLS:
   - NEVER output emojis or decorative unicode symbols (NO ⚽, 🏆, 📅, ✨, 🤖, 📢, etc.) in any generated titles, summaries, descriptions, activities, or checklist items. Use clean, professional school language only.

OUTPUT FORMAT:
Respond ONLY with a valid JSON object matching this exact schema:
{
  "section": "event" | "announcement" | "achievement" | "faq" | "marquee" | "wellness" | "incharge" | "program" | "house",
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

        if (aiResponse.ok) {
          const parsedJson = extractJson(aiResponse.content);
          if (parsedJson) {
            return NextResponse.json({
              ok: true,
              data: parsedJson,
              engine: "live-ai",
            });
          }
        }
      }

      // Built-in intelligent fallback for events (guaranteed zero failure)
      const fallbackEvent = extractEventFromNaturalText(userPrompt, categories);
      return NextResponse.json({
        ok: true,
        data: {
          section: targetSection === "auto" ? "event" : targetSection,
          summary: `Extracted & generated ${fallbackEvent.title} with dates, timing, descriptions, and schedule.`,
          checklist: fallbackEvent.checklist,
          fields: fallbackEvent,
        },
        engine: "builtin",
      });
    }

    return NextResponse.json({ error: `Unknown action '${action}'.` }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
