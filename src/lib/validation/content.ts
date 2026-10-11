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
  sortOrder: z.number().int().min(0).max(500).optional().default(0),
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

export const resourceSchema = z
  .object({
    title: z.string().trim().min(1).max(120),
    detail: optionalText(500),
    href: optionalText(2048),
    kind: z.enum(["card", "link", "pdf"]).default("card"),
  })
  .superRefine((value, context) => {
    if (value.kind === "card") {
      if (value.href) {
        const classified = classifyNavigationUrl(value.href);
        if (!classified.ok) {
          context.addIssue({
            code: "custom",
            path: ["href"],
            message: "Use a valid https:// link, or leave the link blank.",
          });
        }
      }
      return;
    }
    if (!value.href) {
      context.addIssue({
        code: "custom",
        path: ["href"],
        message: value.kind === "pdf" ? "Add an https:// PDF link." : "Add an https:// link.",
      });
      return;
    }
    const classified = classifyNavigationUrl(value.href);
    if (!classified.ok) {
      context.addIssue({
        code: "custom",
        path: ["href"],
        message: "Use a valid https:// link.",
      });
    }
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
    resources: z.array(resourceSchema).max(40).default([]),
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
    if (value.registrationEnabled && value.registrationUrl) {
      const classified = classifyNavigationUrl(value.registrationUrl);
      if (!classified.ok) {
        context.addIssue({
          code: "custom",
          path: ["registrationUrl"],
          message: "Use a valid https:// registration link, or leave the field blank to use Arigo signup.",
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
    else input.coverImageUrl = cover.url;
    if (!input.coverAlt) errors.coverAlt = "Add alternative text for the cover image.";
  }

  input.images.forEach((image, index) => {
    const classified = classifyMediaUrl(image.url, allowedHosts);
    if (!classified.ok) errors[`images.${index}.url`] = classified.message;
    else image.url = classified.url;
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
  resources: z.array(resourceSchema).max(40).default([]),
});

export type AchievementInput = z.infer<typeof achievementInputSchema>;

export const categoryInputSchema = z.object({
  name: z.string().trim().min(2).max(60),
  slug: slugSchema,
  description: optionalText(280),
  sortOrder: z.coerce.number().int().min(0).max(500).default(0),
  imageUrl: optionalText(2048),
  pdfUrl: optionalText(2048),
});

export type CategoryInput = z.infer<typeof categoryInputSchema>;

const councilMemberSchema = z.object({
  id: z.string().uuid().optional(),
  role: z.string().trim().min(2).max(80),
  name: z.string().trim().min(2).max(80),
  imageUrl: optionalText(2048),
  imageAlt: optionalText(200),
  quote: optionalText(400),
  about: optionalText(4000),
  work: optionalText(4000),
});

const councilPhotoSchema = z.object({
  id: z.string().uuid().optional(),
  url: z.string().trim().min(1).max(2048),
  alt: z.string().trim().min(1).max(200),
  caption: optionalText(240),
});

const councilPostSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(2).max(140),
  body: z.string().trim().min(10).max(8000),
  publishedOn: dateSchema,
  imageUrl: optionalText(2048),
  imageAlt: optionalText(200),
});

export const councilInputSchema = z.object({
  label: z.string().trim().min(2).max(40),
  slug: slugSchema,
  kind: z.enum(["current", "upcoming", "past"]),
  summary: z.string().trim().max(800).default(""),
  sortOrder: z.coerce.number().int().min(0).max(999).default(0),
  members: z.array(councilMemberSchema).max(80).default([]),
  photos: z.array(councilPhotoSchema).max(40).default([]),
  posts: z.array(councilPostSchema).max(40).default([]),
});

export type CouncilInput = z.infer<typeof councilInputSchema>;

function indexed(formData: FormData, prefix: string) {
  const indexes = new Set<string>();
  for (const key of formData.keys()) {
    const match = new RegExp(`^${prefix}\\.(\\d+)\\.`).exec(String(key));
    if (match?.[1]) indexes.add(match[1]);
  }
  return [...indexes].sort((a, b) => Number(a) - Number(b));
}

function optionalId(value: string) {
  return /^[0-9a-f-]{36}$/i.test(value) ? value : undefined;
}

export function councilInputFromForm(formData: FormData) {
  const members = indexed(formData, "members").flatMap((index) => {
    const role = String(formData.get(`members.${index}.role`) ?? "").trim();
    const name = String(formData.get(`members.${index}.name`) ?? "").trim();
    if (!role && !name) return [];
    return [
      {
        id: optionalId(String(formData.get(`members.${index}.id`) ?? "")),
        role,
        name,
        imageUrl: String(formData.get(`members.${index}.imageUrl`) ?? ""),
        imageAlt: String(formData.get(`members.${index}.imageAlt`) ?? ""),
        quote: String(formData.get(`members.${index}.quote`) ?? ""),
        about: String(formData.get(`members.${index}.about`) ?? ""),
        work: String(formData.get(`members.${index}.work`) ?? ""),
      },
    ];
  });

  const photos = indexed(formData, "photos").flatMap((index) => {
    const url = String(formData.get(`photos.${index}.url`) ?? "").trim();
    if (!url) return [];
    return [
      {
        id: optionalId(String(formData.get(`photos.${index}.id`) ?? "")),
        url,
        alt: String(formData.get(`photos.${index}.alt`) ?? ""),
        caption: String(formData.get(`photos.${index}.caption`) ?? ""),
      },
    ];
  });

  const posts = indexed(formData, "posts").flatMap((index) => {
    const title = String(formData.get(`posts.${index}.title`) ?? "").trim();
    const body = String(formData.get(`posts.${index}.body`) ?? "").trim();
    if (!title && !body) return [];
    return [
      {
        id: optionalId(String(formData.get(`posts.${index}.id`) ?? "")),
        title,
        body,
        publishedOn: String(formData.get(`posts.${index}.publishedOn`) ?? ""),
        imageUrl: String(formData.get(`posts.${index}.imageUrl`) ?? ""),
        imageAlt: String(formData.get(`posts.${index}.imageAlt`) ?? ""),
      },
    ];
  });

  return councilInputSchema.safeParse({
    label: formData.get("label"),
    slug: formData.get("slug"),
    kind: formData.get("kind"),
    summary: formData.get("summary"),
    sortOrder: formData.get("sortOrder") || 0,
    members,
    photos,
    posts,
  });
}

export function validateCouncilMedia(input: CouncilInput, allowedHosts: readonly string[]) {
  for (const member of input.members) {
    if (!member.imageUrl) continue;
    const classified = classifyMediaUrl(member.imageUrl, allowedHosts);
    if (!classified.ok) return classified.message;
    if (!member.imageAlt) return "Add alternative text for each council photograph.";
    member.imageUrl = classified.url;
  }
  for (const photo of input.photos) {
    const classified = classifyMediaUrl(photo.url, allowedHosts);
    if (!classified.ok) return classified.message;
    photo.url = classified.url;
  }
  for (const post of input.posts) {
    if (!post.imageUrl) continue;
    const classified = classifyMediaUrl(post.imageUrl, allowedHosts);
    if (!classified.ok) return classified.message;
    if (!post.imageAlt) return "Add alternative text for each post photograph.";
    post.imageUrl = classified.url;
  }
  return null;
}
