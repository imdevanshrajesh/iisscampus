"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { can } from "@/lib/auth/permissions";
import { consumeRateLimit, rateLimitAllows } from "@/lib/auth/rate-limit";
import { getCampusSession, sessionActionError } from "@/lib/auth/session";
import { contentMode } from "@/lib/data/content-mode";
import { isMissingTableError } from "@/lib/supabase/errors";
import { createPublicClient } from "@/lib/supabase/public";
import { createStaffClient } from "@/lib/supabase/server";
import {
  SUGGESTION_EMAIL_LIMIT,
  SUGGESTION_EMAIL_WINDOW_MS,
  SUGGESTION_IP_LIMIT,
  SUGGESTION_IP_WINDOW_MS,
  cleanSuggestionBody,
  normalizeSuggestionEmail,
  suggestionRateKey,
  suggestionTimingOk,
} from "@/lib/suggestions";
import { verifyTurnstileToken } from "@/lib/turnstile";

export type SuggestionActionState = {
  error?: string;
  ok?: string;
};

const thanks = "Thanks. The council will read this.";
const rateLimited = "Please wait before sending another suggestion.";
const unavailable = "Suggestions are not open yet. Try again later.";

async function clientAddress() {
  const headerStore = await headers();
  const forwarded = headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() || "";
  return /^[0-9a-fA-F:.]+$/.test(forwarded) && forwarded.length <= 64 ? forwarded : "local";
}

export async function submitSuggestion(
  _state: SuggestionActionState,
  formData: FormData,
): Promise<SuggestionActionState> {
  if (String(formData.get("company") ?? "").trim()) return { ok: thanks };

  const token = formData.get("cf-turnstile-response");
  const ip = await clientAddress();
  const headerStore = await headers();
  const host = (headerStore.get("x-forwarded-host") || headerStore.get("host") || "")
    .split(":")[0]
    .trim();

  const turnstile = await verifyTurnstileToken({
    token,
    expectedAction: "suggestion",
    clientIp: ip,
    clientHost: host,
  });
  if (!turnstile.success) {
    console.error("[submitSuggestion] Turnstile verification failed:", {
      error: turnstile.error,
      code: turnstile.code,
      host,
    });
    return { error: "Security check failed. Please refresh and try again." };
  }

  if (!suggestionTimingOk(String(formData.get("openedAt") ?? ""))) {
    return { error: "Please wait a moment, then send it again." };
  }

  const email = normalizeSuggestionEmail(String(formData.get("email") ?? ""));
  const emailKey = email ? suggestionRateKey(email) : null;
  if (!email || !emailKey) return { error: "Use a @gmail.com or @iiss.ae address." };

  const cleaned = cleanSuggestionBody(String(formData.get("suggestion") ?? ""));
  if (!cleaned.ok) return { error: cleaned.error };

  const ipKey = `suggestion-ip:${ip}`;
  const emailLimitKey = `suggestion-email:${emailKey}`;
  if (
    !rateLimitAllows(ipKey, SUGGESTION_IP_LIMIT, SUGGESTION_IP_WINDOW_MS) ||
    !rateLimitAllows(emailLimitKey, SUGGESTION_EMAIL_LIMIT, SUGGESTION_EMAIL_WINDOW_MS)
  ) {
    return { error: rateLimited };
  }

  function rememberSend() {
    consumeRateLimit(ipKey, SUGGESTION_IP_LIMIT, SUGGESTION_IP_WINDOW_MS);
    consumeRateLimit(emailLimitKey, SUGGESTION_EMAIL_LIMIT, SUGGESTION_EMAIL_WINDOW_MS);
  }

  if ((await contentMode()) === "file") {
    const { saveSuggestionToStore } = await import("@/lib/data/file-content");
    const saved = saveSuggestionToStore({ email, emailKey, body: cleaned.body, ip });
    if (saved === "rate") {
      rememberSend();
      return { error: rateLimited };
    }
    if (saved !== "ok") return { error: "That suggestion could not be sent." };
    rememberSend();
    revalidatePath("/manage/suggestions");
    revalidatePath("/manage");
    return { ok: thanks };
  }

  const supabase = createPublicClient();
  if (!supabase) return { error: unavailable };

  const result = await supabase.rpc("submit_campus_suggestion", {
    raw_email: email,
    raw_body: cleaned.body,
    raw_ip: ip,
  });

  if (result.error) {
    console.error(result.error.code, result.error.message);
    const missing =
      isMissingTableError(result.error) ||
      result.error.code === "PGRST202" ||
      result.error.code === "42702" ||
      (result.error.message ?? "").toLowerCase().includes("submit_campus_suggestion");
    return { error: missing ? unavailable : "That suggestion could not be sent." };
  }
  if (result.data === "rate") {
    rememberSend();
    return { error: rateLimited };
  }
  if (result.data !== "ok") return { error: "Check the email and suggestion, then try again." };
  rememberSend();

  revalidatePath("/manage/suggestions");
  revalidatePath("/manage");
  return { ok: thanks };
}

export async function deleteSuggestion(
  _state: SuggestionActionState,
  formData: FormData,
): Promise<SuggestionActionState> {
  if (formData.get("confirm") !== "yes") return { error: "Confirm the delete, then try again." };
  const id = String(formData.get("id") ?? "");
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return { error: "That suggestion could not be deleted." };
  }

  const session = await getCampusSession();
  const denied = sessionActionError(session);
  if (denied || session.status !== "ok") return { error: denied ?? "Sign in is required." };
  if (!can(session.actor, "manage_settings")) return { error: "You do not have permission to do that." };

  if ((await contentMode()) === "file") {
    const { deleteSuggestionFromStore } = await import("@/lib/data/file-content");
    if (!deleteSuggestionFromStore(id)) return { error: "That suggestion could not be deleted." };
    revalidatePath("/manage/suggestions");
    revalidatePath("/manage");
    return { ok: "Deleted." };
  }

  const supabase = await createStaffClient();
  if (!supabase) return { error: "Sign in is required." };
  const removed = await supabase.from("campus_suggestions").delete().eq("id", id);
  if (removed.error) {
    return {
      error: isMissingTableError(removed.error)
        ? "Run supabase/SUGGESTIONS.sql in the database, then try again."
        : "That suggestion could not be deleted.",
    };
  }
  revalidatePath("/manage/suggestions");
  revalidatePath("/manage");
  return { ok: "Deleted." };
}
