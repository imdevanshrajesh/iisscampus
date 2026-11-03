import { NextResponse } from "next/server";
import { callGrokChat, testGrokApiKey, type GrokChatMessage } from "@/lib/ai/grok";
import { saveGrokConfigToStore, readContentStore } from "@/lib/data/file-content";
import { getStaffWorkspace } from "@/lib/data/staff";

export const dynamic = "force-dynamic";

function extractJson(text: string) {
  // Try direct parse
  try {
    return JSON.parse(text);
  } catch {
    // Try finding ```json block
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch && jsonMatch[1]) {
      try {
        return JSON.parse(jsonMatch[1]);
      } catch {
        // Continue
      }
    }
    // Try finding outermost { ... }
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

    const { action = "generate", apiKey, model } = body;

    // Action 1: Test API Key
    if (action === "test-key") {
      const keyToTest = apiKey || body.key;
      if (!keyToTest) {
        return NextResponse.json({ error: "Please enter an API key to test." }, { status: 400 });
      }
      const testResult = await testGrokApiKey(keyToTest, model);
      return NextResponse.json(testResult);
    }

    // Action 2: Save API Key
    if (action === "save-key") {
      const keyToSave = typeof body.key === "string" ? body.key : null;
      const modelToSave = typeof body.model === "string" ? body.model : "grok-2-latest";
      const saved = saveGrokConfigToStore(keyToSave, modelToSave);
      if (!saved) {
        return NextResponse.json({ error: "Could not persist Grok API settings." }, { status: 500 });
      }
      return NextResponse.json({ ok: true, message: "Grok API settings saved successfully." });
    }

    // Action 3: Generate structured content
    if (action === "generate") {
      const userPrompt = String(body.prompt ?? "").trim();
      if (!userPrompt) {
        return NextResponse.json({ error: "Please enter event or content details." }, { status: 400 });
      }

      const targetSection = body.targetSection || "auto";

      // Fetch categories from workspace so Grok can select the right category ID
      const workspace = await getStaffWorkspace();
      const categories = (workspace?.categories || []).map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
      }));

      const today = new Date().toISOString().split("T")[0];

      const systemPrompt = `You are the Content Operations AI Agent for India International School Campus management desk.
Today's date: ${today}.
Available categories for events & activities:
${JSON.stringify(categories, null, 2)}

Your task is to take rough input (notes, messages, emails, or bullet points) from a school administrator or editor, and convert it into a structured, publication-ready record.

RULES & INSTRUCTIONS:
1. Target Section: ${
        targetSection !== "auto"
          ? `The user specifically wants a record for "${targetSection}".`
          : "Auto-detect the most appropriate section: 'event', 'announcement', 'achievement', 'faq', 'marquee', or 'wellness'."
      }
2. DESCRIPTION GENERATION:
   - If the user did not provide a description or only gave brief points, YOU MUST AUTO-GENERATE high-quality, professional, inspiring descriptions!
   - Generate both a concise 'shortDescription' (1-2 sentences for cards, 30-200 characters) AND a comprehensive 'fullDescription' (2-4 rich paragraphs with objectives, activities, rules, and expectations).
3. UPLOADS & REQUIREMENTS CHECKLIST:
   - Identify what digital media or links the administrator still needs to upload or configure.
   - For example:
     * Cover Image: "Upload 16:9 landscape photo (min 1200x675px) hosted on approved host like Cloudinary."
     * Registration Link: "Provide Google Form or Arigo link if student signup is required."
     * PDF Document / Rulebook: "Upload rules PDF if competition rules document is available."
4. CATEGORY ASSIGNMENT:
   - Match the content to the best category ID from the list above. Default to the first available category if unsure.
5. SLUG GENERATION:
   - Create a clean kebab-case slug (e.g. "inter-house-basketball-tournament-2026").
6. SCHEDULE:
   - If schedule items can be derived or logically suggested (e.g., Opening, Competition, Finals, Awards), provide 2-4 schedule entries with time (HH:MM), title, and detail.

OUTPUT FORMAT:
Respond ONLY with a valid JSON object (no surrounding conversational text) matching this exact structure:
{
  "section": "event" | "announcement" | "achievement" | "faq" | "marquee" | "wellness",
  "summary": "One sentence summary of what was generated",
  "checklist": [
    { "item": "Name of upload / task", "required": boolean, "detail": "Specific instructions for what to upload or configure" }
  ],
  "fields": {
    "title": "Clear catchy title",
    "slug": "kebab-case-slug",
    "shortDescription": "Concise summary",
    "fullDescription": "Rich descriptive writeup...",
    "categoryId": "UUID from category list above",
    "eventDate": "YYYY-MM-DD or null",
    "endDate": "YYYY-MM-DD or null",
    "startTime": "HH:MM or null",
    "endTime": "HH:MM or null",
    "locationName": "Location venue name or null",
    "gradeFrom": number | null (e.g. 6),
    "gradeTo": number | null (e.g. 12),
    "feeAed": number | null (0 if free),
    "purpose": "Event purpose statement",
    "activities": "Highlights of activities",
    "packingList": "What to bring or null",
    "schedule": [
      { "time": "09:00", "title": "Assembly & Briefing", "detail": "Details..." }
    ],
    // If announcement:
    "body": "Announcement text...",
    // If achievement:
    "competitionName": "Name of competition",
    "winnerName": "Student or team name",
    "award": "First Prize / Gold Medal / etc.",
    "academicYear": "2026–27",
    // If FAQ:
    "question": "Question text",
    "answer": "Answer text",
    // If Marquee:
    "message": "Punchy ticker announcement message"
  }
}`;

      const messages: GrokChatMessage[] = [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ];

      const grokResponse = await callGrokChat(messages, {
        apiKey: apiKey || request.headers.get("x-grok-api-key"),
        model: model || "grok-2-latest",
        temperature: 0.2,
      });

      if (!grokResponse.ok) {
        return NextResponse.json({ error: grokResponse.error }, { status: 502 });
      }

      const parsedJson = extractJson(grokResponse.content);
      if (!parsedJson) {
        return NextResponse.json(
          {
            error: "Grok responded, but the output could not be parsed as structured JSON.",
            raw: grokResponse.content,
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
