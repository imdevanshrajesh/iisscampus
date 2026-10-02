export type PublicationStatus = "draft" | "in_review" | "published" | "archived";

export type EventStatus = "upcoming" | "ongoing" | "completed";

export type CampusRole = "editor" | "administrator";

export type Category = {
  id: string;
  slug: string;
  name: string;
  description: string;
  sortOrder: number;
};

export type GalleryImage = {
  id: string;
  url: string;
  alt: string;
  caption: string | null;
  attribution: string | null;
  sortOrder: number;
};

export type ScheduleItem = {
  time: string;
  title: string;
  detail: string | null;
};

export type ParticipatingGroup = {
  name: string;
  detail: string | null;
};

export type CampusEvent = {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  fullDescription: string;
  categoryId: string;
  coverImageUrl: string | null;
  coverAlt: string | null;
  coverAttribution: string | null;
  eventDate: string | null;
  endDate: string | null;
  publicationStatus: PublicationStatus;
  eventStatus: EventStatus | null;
  featured: boolean;
  isSample: boolean;
  registrationEnabled: boolean;
  registrationProvider: string | null;
  registrationUrl: string | null;
  registrationLabel: string | null;
  registrationDeadline: string | null;
  registrationInstructions: string | null;
  instagramUrl: string | null;
  purpose: string | null;
  activities: string | null;
  schedule: ScheduleItem[];
  groups: ParticipatingGroup[];
  videoUrl: string | null;
  images: GalleryImage[];
  relatedIds: string[];
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
};

export type Achievement = {
  id: string;
  title: string;
  competitionName: string;
  winnerName: string | null;
  award: string | null;
  eventDate: string | null;
  academicYear: string | null;
  categoryId: string | null;
  eventId: string | null;
  imageUrl: string | null;
  imageAlt: string | null;
  publicationStatus: PublicationStatus;
  isSample: boolean;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
};

export type PublicCatalog = {
  source: "local" | "supabase";
  categories: Category[];
  events: CampusEvent[];
  achievements: Achievement[];
  mediaHosts: string[];
};
