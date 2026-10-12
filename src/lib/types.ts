export type PublicationStatus = "draft" | "in_review" | "published" | "archived";

export type EventStatus = "upcoming" | "ongoing" | "completed";

export type EventListing = "event" | "competition";

export type RegistrationProvider = "arigo" | "page" | "google_form";

export type CouncilKind = "current" | "upcoming" | "past";

export type CouncilBoard = "main" | "junior";

export type CampusRole = "editor" | "administrator";

export type ResourceKind = "card" | "link" | "pdf";

export type ContentResource = {
  title: string;
  detail: string | null;
  href: string | null;
  kind: ResourceKind;
};

export type Category = {
  id: string;
  slug: string;
  name: string;
  description: string;
  sortOrder: number;
  imageUrl: string | null;
  pdfUrl: string | null;
};

export type GalleryImage = {
  id: string;
  url: string;
  alt: string;
  caption: string | null;
  attribution: string | null;
  pinned: boolean;
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
  categoryIds: string[];
  listing: EventListing;
  coverImageUrl: string | null;
  coverAlt: string | null;
  coverAttribution: string | null;
  eventDate: string | null;
  endDate: string | null;
  startTime: string | null;
  endTime: string | null;
  locationName: string | null;
  locationMapUrl: string | null;
  gradeFrom: number | null;
  gradeTo: number | null;
  feeAed: number | null;
  capacity: number | null;
  packingList: string | null;
  publicationStatus: PublicationStatus;
  eventStatus: EventStatus | null;
  featured: boolean;
  isSample: boolean;
  registrationEnabled: boolean;
  registrationProvider: RegistrationProvider | null;
  registrationUrl: string | null;
  registrationLabel: string | null;
  registrationDeadline: string | null;
  registrationInstructions: string | null;
  instagramUrl: string | null;
  purpose: string | null;
  activities: string | null;
  schedule: ScheduleItem[];
  groups: ParticipatingGroup[];
  resources: ContentResource[];
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
  resources: ContentResource[];
  publicationStatus: PublicationStatus;
  isSample: boolean;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
};

export type CouncilMember = {
  id: string;
  role: string;
  name: string;
  imageUrl: string | null;
  imageAlt: string | null;
  quote: string | null;
  about: string | null;
  work: string | null;
  slug: string;
  board: CouncilBoard;
  sortOrder: number;
};

export type CouncilPhoto = {
  id: string;
  url: string;
  alt: string;
  caption: string | null;
  sortOrder: number;
};

export type CouncilPost = {
  id: string;
  title: string;
  body: string;
  publishedOn: string | null;
  imageUrl: string | null;
  imageAlt: string | null;
  sortOrder: number;
};

export type CouncilYear = {
  id: string;
  label: string;
  slug: string;
  kind: CouncilKind;
  summary: string;
  juniorHeading: string;
  publicationStatus: PublicationStatus;
  sortOrder: number;
  isSample: boolean;
  members: CouncilMember[];
  photos: CouncilPhoto[];
  posts: CouncilPost[];
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
};

export type Newsletter = {
  title: string;
  imageUrl: string | null;
  href: string | null;
  pdfUrl: string | null;
  published: boolean;
};

export type SocialLinks = {
  instagramUrl: string;
  scixcomInstagramUrl: string;
};

export type SiteBrand = {
  councilLogoUrl: string | null;
  contactEmail: string | null;
};

export type Announcement = {
  id: string;
  message: string;
  eventId: string | null;
  enabled: boolean;
  sortOrder: number;
};

export type Faq = {
  id: string;
  question: string;
  answer: string;
  sortOrder: number;
  published: boolean;
};

export type PublicCatalog = {
  source: "local" | "supabase";
  categories: Category[];
  events: CampusEvent[];
  achievements: Achievement[];
  councilYears: CouncilYear[];
  mediaHosts: string[];
  councilLogoUrl: string | null;
};
