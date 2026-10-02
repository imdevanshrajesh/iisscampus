import { z } from "zod";
import { classifyMediaUrl, classifyNavigationUrl } from "@/lib/media/url";

const slugSchema = z
  .string()
  .trim()
  .min(2)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens.");

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .or(z.literal(""))
    .transform((value) => value || null);

const dateSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use a YYYY-MM-DD date.")
  .optional()
  .or(z.literal(""))
  .transform((value) => value || null);

function optionalHttps(value: string | null, label: string) {
  if (!value) return null;
  const classified = classifyNavigationUrl(value);
  if (!classified.ok) {
    throw new Error(`${label} must be a valid https:// link.`);
  }
  return classified.url;
}

export const galleryImageSchema = z.object({
  id: z.string().uuid().optional(),
  url: z.string().trim().min(1).max(2048),
  alt: z.string().trim().min(1).max(200),
  caption: z.string().trim().max(240).optional().or(z.literal("")).transform((value) => value || null),
  attribution: z.string().trim().max(160).optional().or(z.literal("")).transform((value) => value || null),
  sortOrder: z.number().int().min(0).max(500),
});

export const scheduleItemSchema = z.object({
  time: z.string().trim().min(1).max(40),
  title: z.string().trim().min(1).max(120),
  detail: optionalText(240),
});

export const groupSchema = z.object({
  name: z.string().trim().min(1).max(80),
  detail: optionalText(160),
});

export const eventInputSchema = z
  .object({
    title: z.string().trim().min(2).max(140),
    slug: slugSchema,
    shortDescription: z.string().trim().min(10).max(280),
    fullDescription: z.string().trim().min(20).max(12000),
    categoryId: z.string().uuid(),
    coverImageUrl: optionalText(2048),
    coverAlt: optionalText(200),
    coverAttribution: optionalText(160),
    eventDate: dateSchema,
    endDate: dateSchema,
    eventStatus: z.enum(["upcoming", "ongoing", "completed"]).optional().or(z.literal("")).transform((value) => value || null),
    featured: z.boolean().default(false),
    registrationEnabled: z.boolean().default(false),
    registrationProvider: optionalText(40),
    registrationUrl: optionalText(2048),
    registrationLabel: optionalText(80),
    registrationDeadline: dateSchema,
    registrationInstructions: optionalText(500),
    instagramUrl: optionalText(2048),
    purpose: optionalText(2000),
    activities: optionalText(4000),
    videoUrl: optionalText(2048),
    schedule: z.array(scheduleItemSchema).max(40).default([]),
    groups: z.array(groupSchema).max(40).default([]),
    images: z.array(galleryImageSchema).max(40).default([]),
    relatedIds: z.array(z.string().uuid()).max(8).default([]),
  })
  .superRefine((value, context) => {
    if (value.endDate && value.eventDate && value.endDate < value.eventDate) {
      context.addIssue({
        code: "custom",
        path: ["endDate"],
        message: "The end date must be on or after the start date.",
      });
    }
    if (value.registrationEnabled) {
      const classified = value.registrationUrl
        ? classifyNavigationUrl(value.registrationUrl)
        : null;
      if (!classified?.ok) {
        context.addIssue({
          code: "custom",
          path: ["registrationUrl"],
          message: "Add an https:// registration link, or turn registration off.",
        });
      }
    }
  });

export type EventInput = z.infer<typeof eventInputSchema>;

export function validateEventMedia(input: EventInput, allowedHosts: readonly string[]) {
  const errors: Record<string, string> = {};

  if (input.coverImageUrl) {
    const cover = classifyMediaUrl(input.coverImageUrl, allowedHosts);
    if (!cover.ok) errors.coverImageUrl = cover.message;
    if (!input.coverAlt) errors.coverAlt = "Add alternative text for the cover image.";
  }

  input.images.forEach((image, index) => {
    const classified = classifyMediaUrl(image.url, allowedHosts);
    if (!classified.ok) errors[`images.${index}.url`] = classified.message;
  });

  try {
    optionalHttps(input.instagramUrl, "Instagram URL");
  } catch (error) {
    errors.instagramUrl = error instanceof Error ? error.message : "Invalid Instagram URL.";
  }

  try {
    optionalHttps(input.videoUrl, "Video URL");
  } catch (error) {
    errors.videoUrl = error instanceof Error ? error.message : "Invalid video URL.";
  }

  if (input.registrationEnabled && input.registrationUrl) {
    try {
      optionalHttps(input.registrationUrl, "Registration URL");
    } catch (error) {
      errors.registrationUrl = error instanceof Error ? error.message : "Invalid registration URL.";
    }
  }

  return errors;
}

export const achievementInputSchema = z.object({
  title: z.string().trim().min(2).max(140),
  competitionName: z.string().trim().min(2).max(140),
  winnerName: optionalText(120),
  award: optionalText(80),
  eventDate: dateSchema,
  academicYear: optionalText(20),
  categoryId: z.string().uuid().optional().or(z.literal("")).transform((value) => value || null),
  eventId: z.string().uuid().optional().or(z.literal("")).transform((value) => value || null),
  imageUrl: optionalText(2048),
  imageAlt: optionalText(200),
});

export type AchievementInput = z.infer<typeof achievementInputSchema>;
