import { z } from "zod";
import { classifyMediaUrl, classifyNavigationUrl } from "@/lib/media/url";
import { googleFormUrl } from "@/lib/registration";

const slugSchema = z
  .string()
  .trim()
  .min(2, "Address slug must be at least 2 characters.")
  .max(80, "Address slug cannot exceed 80 characters.")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Address slug must use lowercase letters, numbers, and hyphens.");

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
  pinned: z.boolean().default(false),
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

const timeSchema = z
  .string()
  .trim()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:MM.")
  .optional()
  .or(z.literal(""))
  .transform((value) => value || null);

const optionalGrade = z
  .union([z.string(), z.number()])
  .optional()
  .or(z.literal(""))
  .transform((value) => {
    if (value === "" || value === undefined || value === null) return null;
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  })
  .pipe(z.number().int().min(1).max(12).nullable());

const optionalMoney = z
  .union([z.string(), z.number()])
  .optional()
  .or(z.literal(""))
  .transform((value) => {
    if (value === "" || value === undefined || value === null) return null;
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  })
  .pipe(z.number().min(0).nullable());

const optionalCapacity = z
  .union([z.string(), z.number()])
  .optional()
  .or(z.literal(""))
  .transform((value) => {
    if (value === "" || value === undefined || value === null) return null;
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  })
  .pipe(z.number().int().min(1).nullable());

const registrationCount = z
  .union([z.string(), z.number()])
  .optional()
  .or(z.literal(""))
  .transform((value) => {
    if (value === "" || value === undefined || value === null) return 0;
    return Number(value);
  })
  .pipe(z.number().int().min(0).max(100000));

export const eventInputSchema = z
  .object({
    title: z.string().trim().min(2, "Title must be at least 2 characters.").max(140, "Title cannot exceed 140 characters."),
    slug: slugSchema,
    shortDescription: z.string().trim().min(10, "Short description must be at least 10 characters.").max(280, "Short description cannot exceed 280 characters."),
    fullDescription: z.string().trim().min(20, "Full description must be at least 20 characters.").max(12000, "Full description cannot exceed 12,000 characters."),
    categoryId: z.string().uuid("Please select a primary category."),
    categoryIds: z.array(z.string().uuid()).max(12).default([]),
    listing: z.enum(["event", "competition", "external"]).default("event"),
    coverImageUrl: optionalText(2048),
    coverAlt: optionalText(200),
    coverAttribution: optionalText(160),
    eventDate: dateSchema,
    endDate: dateSchema,
    startTime: timeSchema,
    endTime: timeSchema,
    locationName: optionalText(160),
    locationMapUrl: optionalText(2048),
    hostName: optionalText(120),
    gradeFrom: optionalGrade,
    gradeTo: optionalGrade,
    feeAed: optionalMoney,
    capacity: optionalCapacity,
    packingList: optionalText(4000),
    eventStatus: z.enum(["upcoming", "ongoing", "completed"]).optional().or(z.literal("")).transform((value) => value || null),
    featured: z.boolean().default(false),
    registrationEnabled: z.boolean().default(false),
    pushToArigo: z.boolean().default(false),
    registrationProvider: z
      .enum(["arigo", "page", "google_form"])
      .optional()
      .or(z.literal(""))
      .transform((value) => value || null),
    registrationUrl: optionalText(2048),
    registrationLabel: optionalText(80),
    registrationDeadline: dateSchema,
    registrationLimit: optionalCapacity,
    registrationCount,
    overflowRegistrationUrl: optionalText(2048),
    overflowRegistrationLabel: optionalText(80),
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
    if ((value.gradeFrom == null) !== (value.gradeTo == null)) {
      context.addIssue({
        code: "custom",
        path: ["gradeTo"],
        message: "Set both grade from and grade to, or leave both blank.",
      });
    }
    if (value.gradeFrom != null && value.gradeTo != null && value.gradeTo < value.gradeFrom) {
      context.addIssue({
        code: "custom",
        path: ["gradeTo"],
        message: "Grade to must be on or after grade from.",
      });
    }
    if (value.listing === "external" && !value.hostName) {
      context.addIssue({
        code: "custom",
        path: ["hostName"],
        message: "Enter the host school.",
      });
    }
    if (value.locationMapUrl) {
      const classified = classifyNavigationUrl(value.locationMapUrl);
      if (!classified.ok) {
        context.addIssue({
          code: "custom",
          path: ["locationMapUrl"],
          message: "Use a valid https:// map link.",
        });
      }
    }
    if (value.registrationEnabled) {
      const provider = value.registrationProvider ?? "arigo";
      if (provider === "arigo" && !value.pushToArigo) {
        context.addIssue({
          code: "custom",
          path: ["pushToArigo"],
          message: "Tick Push to Arigo when registration uses Arigo.",
        });
      }
      if (provider === "page" || provider === "google_form") {
        if (!value.registrationUrl) {
          context.addIssue({
            code: "custom",
            path: ["registrationUrl"],
            message: provider === "page" ? "Add the page path or https:// link." : "Add the Google Form link.",
          });
        } else if (provider === "google_form" && !googleFormUrl(value.registrationUrl)) {
          context.addIssue({
            code: "custom",
            path: ["registrationUrl"],
            message: "Use a docs.google.com/forms or forms.gle link.",
          });
        } else if (provider === "page") {
          const raw = value.registrationUrl;
          if (raw.startsWith("/")) {
            if (!/^\/[a-z0-9/_\-?=&%.]*$/i.test(raw)) {
              context.addIssue({
                code: "custom",
                path: ["registrationUrl"],
                message: "Use a path that starts with /.",
              });
            }
          } else {
            const classified = classifyNavigationUrl(raw);
            if (!classified.ok) {
              context.addIssue({
                code: "custom",
                path: ["registrationUrl"],
                message: "Use a path starting with / or a valid https:// link.",
              });
            }
          }
        }
      }
    }
    if (value.overflowRegistrationUrl && !googleFormUrl(value.overflowRegistrationUrl)) {
      context.addIssue({
        code: "custom",
        path: ["overflowRegistrationUrl"],
        message: "Use a docs.google.com/forms or forms.gle link for the form shown when registration is full.",
      });
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

  if (input.registrationEnabled && input.registrationUrl && input.registrationProvider !== "page") {
    try {
      optionalHttps(input.registrationUrl, "Registration URL");
    } catch (error) {
      errors.registrationUrl = error instanceof Error ? error.message : "Invalid registration URL.";
    }
  }

  if (input.overflowRegistrationUrl) {
    const overflow = googleFormUrl(input.overflowRegistrationUrl);
    if (!overflow) {
      errors.overflowRegistrationUrl =
        "Use a docs.google.com/forms or forms.gle link for the form shown when registration is full.";
    } else {
      input.overflowRegistrationUrl = overflow;
    }
  }

  if (input.locationMapUrl) {
    try {
      optionalHttps(input.locationMapUrl, "Map URL");
    } catch (error) {
      errors.locationMapUrl = error instanceof Error ? error.message : "Invalid map URL.";
    }
  }

  return errors;
}

export const achievementInputSchema = z.object({
  title: z.string().trim().min(2, "Title must be at least 2 characters.").max(140, "Title cannot exceed 140 characters."),
  competitionName: z.string().trim().min(2, "Competition name must be at least 2 characters.").max(140, "Competition name cannot exceed 140 characters."),
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
  name: z.string().trim().min(2, "Category name must be at least 2 characters.").max(60, "Category name cannot exceed 60 characters."),
  slug: slugSchema,
  description: optionalText(280),
  sortOrder: z.coerce.number().int().min(0).max(500).default(0),
  imageUrl: optionalText(2048),
  pdfUrl: optionalText(2048),
});

export type CategoryInput = z.infer<typeof categoryInputSchema>;

const councilMemberSchema = z.object({
  id: z.string().uuid().optional(),
  role: z.string().trim().min(2, "Member role must be at least 2 characters.").max(80, "Member role cannot exceed 80 characters."),
  name: z.string().trim().min(2, "Member name must be at least 2 characters.").max(80, "Member name cannot exceed 80 characters."),
  imageUrl: optionalText(2048),
  imageAlt: optionalText(200),
  quote: optionalText(400),
  about: optionalText(4000),
  work: optionalText(4000),
  board: z.enum(["main", "junior"]).default("main"),
});

const councilPhotoSchema = z.object({
  id: z.string().uuid().optional(),
  url: z.string().trim().min(1, "Photo URL is required.").max(2048, "Photo URL is too long."),
  alt: z.string().trim().min(1, "Alternative text is required for the photo.").max(200, "Photo alt text cannot exceed 200 characters."),
  caption: optionalText(240),
});

const councilPostSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(2, "Post title must be at least 2 characters.").max(140, "Post title cannot exceed 140 characters."),
  body: z.string().trim().min(10, "Post body must be at least 10 characters.").max(8000, "Post body cannot exceed 8000 characters."),
  publishedOn: dateSchema,
  imageUrl: optionalText(2048),
  imageAlt: optionalText(200),
});

export const councilInputSchema = z.object({
  label: z.string().trim().min(2, "Council year label must be at least 2 characters.").max(40, "Label cannot exceed 40 characters."),
  slug: slugSchema,
  kind: z.enum(["current", "upcoming", "past"]),
  summary: z.string().trim().max(800).default(""),
  juniorHeading: z.string().trim().min(2).max(80).default("Junior Student Council"),
  sortOrder: z.coerce.number().int().min(0).max(999).default(0),
  members: z.array(councilMemberSchema).max(120).default([]),
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
    const boardRaw = String(formData.get(`members.${index}.board`) ?? "main").trim();
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
        board: boardRaw === "junior" ? "junior" : "main",
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
    juniorHeading: formData.get("juniorHeading") || "Junior Student Council",
    sortOrder: formData.get("sortOrder") || 0,
    members,
    photos,
    posts,
  });
}

export const announcementInputSchema = z.object({
  title: z.string().trim().min(2, "Notice title must be at least 2 characters.").max(200, "Notice title cannot exceed 200 characters."),
  body: z.string().trim().max(8000).default(""),
  resources: z.array(resourceSchema).max(40).default([]),
  eventId: z.string().uuid().nullable().default(null),
  programId: z.string().uuid().nullable().optional().default(null),
  wellnessId: z.string().trim().max(100).nullable().optional().default(null),
  category: z.string().trim().max(100).default("General"),
  coverImageUrl: z.string().trim().max(2048).nullable().optional().default(null),
  enabled: z.boolean().default(true),
});

export const schoolInchargeInputSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters.").max(120),
  role: z.string().trim().min(2, "Role / Designation is required.").max(120),
  tier: z.enum(["executive", "section", "department"]).default("section"),
  tierLabel: optionalText(80),
  department: optionalText(120),
  photoUrl: optionalText(2048),
  message: z.string().trim().max(4000).default(""),
  about: z.string().trim().max(4000).optional(),
  email: optionalText(160),
  phone: optionalText(60),
  sortOrder: z.coerce.number().int().min(-9999).max(9999).default(0),
  published: z.boolean().default(true),
});

export const schoolHeadInputSchema = schoolInchargeInputSchema;

export const houseInputSchema = z.object({
  name: z.string().trim().min(2, "House name is required.").max(80),
  slug: z.string().trim().min(2).max(40),
  color: z.enum(["ruby", "sapphire", "topaz", "emerald"]),
  points: z.coerce.number().int().min(0, "Points must be non-negative.").max(999999).optional().nullable(),
  inchargeName: z.string().trim().min(2, "Incharge name is required.").max(120),
  inchargeTitle: optionalText(120),
  inchargePhotoUrl: optionalText(2048),
  inchargeMessage: optionalText(1000),
  captainName: z.string().trim().min(2, "Captain name is required.").max(120),
  captainPhotoUrl: optionalText(2048),
  viceCaptainName: z.string().trim().min(2, "Vice captain name is required.").max(120),
  viceCaptainPhotoUrl: optionalText(2048),
  motto: optionalText(240),
  description: optionalText(4000),
  sortOrder: z.coerce.number().int().min(-9999).max(9999).default(0),
  published: z.boolean().default(true),
});

export const housePointsUpdateSchema = z.object({
  id: z.string().min(1, "House ID or Slug is required."),
  points: z.coerce.number().int().min(0, "Points must be non-negative.").max(999999),
});

const customProgramPhotoSchema = z.object({
  url: z.string().trim().min(1).max(2048),
  alt: z.string().trim().min(1, "Add a description for each photo.").max(200),
});

const customProgramLinkSchema = z
  .object({
    label: z.string().trim().min(1).max(80),
    url: z.string().trim().min(1).max(2048),
  })
  .superRefine((value, context) => {
    const classified = classifyNavigationUrl(value.url);
    if (!classified.ok) {
      context.addIssue({
        code: "custom",
        path: ["url"],
        message: "Each extra link must be a valid https:// address.",
      });
    }
  });

export const customProgramInputSchema = z
  .object({
    title: z.string().trim().min(2, "Program title must be at least 2 characters.").max(120, "Program title cannot exceed 120 characters."),
    summary: z.string().trim().max(4000).default(""),
    websiteLabel: optionalText(80),
    websiteUrl: optionalText(2048),
    photos: z.array(customProgramPhotoSchema).max(24).default([]),
    links: z.array(customProgramLinkSchema).max(12).default([]),
    eventId: z.string().uuid().nullable().default(null),
    published: z.boolean().default(true),
    sortOrder: z.coerce.number().int().min(-9999).max(9999).default(0),
    category: z.string().trim().max(100).default("Awareness"),
    timing: optionalText(120),
    pdfUrl: optionalText(2048),
  })
  .superRefine((value, context) => {
    if (!value.websiteUrl) return;
    const classified = classifyNavigationUrl(value.websiteUrl);
    if (!classified.ok) {
      context.addIssue({
        code: "custom",
        path: ["websiteUrl"],
        message: "The website must be a valid https:// link.",
      });
    }
  });

export const marqueeInputSchema = z.object({
  message: z.string().trim().min(2, "Marquee message must be at least 2 characters.").max(500, "Marquee message cannot exceed 500 characters."),
  eventId: z.string().uuid().nullable().default(null),
  enabled: z.boolean().default(true),
  sortOrder: z.number().int().min(0).max(500).default(0),
});

const optionalSiteHref = z
  .string()
  .trim()
  .max(300)
  .optional()
  .or(z.literal(""))
  .transform((value) => value || null);

export function parseSiteHref(raw: string | null) {
  if (!raw) return null;
  if (raw.startsWith("/") && !raw.startsWith("//") && !/\s/.test(raw)) return raw;
  const classified = classifyNavigationUrl(raw);
  return classified.ok ? classified.url : null;
}

export const navGroupInputSchema = z.object({
  label: z.string().trim().min(1, "Enter a navigation label.").max(40, "Label cannot exceed 40 characters."),
  href: optionalSiteHref,
  includeListing: z.enum(["event", "competition"]).nullable().default(null),
  enabled: z.boolean().default(true),
  sortOrder: z.number().int().min(0).max(500).default(0),
});

export const navItemInputSchema = z.object({
  groupId: z.string().trim().min(1).max(80),
  title: z.string().trim().max(80).default(""),
  description: z.string().trim().max(160).default(""),
  href: optionalSiteHref,
  eventId: z.string().uuid().nullable().default(null),
  enabled: z.boolean().default(true),
  sortOrder: z.number().int().min(0).max(500).default(0),
});

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

export const socialPostInputSchema = z.object({
  instagramUrl: z
    .string()
    .trim()
    .min(5, "Enter an Instagram post or reel address.")
    .refine((url) => {
      try {
        const parsed = new URL(url);
        const host = parsed.hostname.toLowerCase().replace(/^www\./, "");
        return host === "instagram.com" || host === "instagr.am";
      } catch {
        return false;
      }
    }, "Enter a valid Instagram link (e.g. https://www.instagram.com/p/...)."),
  caption: z
    .string()
    .trim()
    .max(1000)
    .optional()
    .nullable()
    .transform((value) => value || null),
  imageUrl: z
    .string()
    .trim()
    .max(1000)
    .optional()
    .nullable()
    .transform((value) => value || null),
  pinned: z.boolean().default(true),
  sortOrder: z.number().int().min(0).max(10000).default(0),
  councilTag: z.string().trim().default("all"),
});
export type SocialPostInput = z.infer<typeof socialPostInputSchema>;

