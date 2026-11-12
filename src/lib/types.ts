export type PublicationStatus = "draft" | "in_review" | "published" | "archived";

export type EventStatus = "upcoming" | "ongoing" | "completed";

export type EventListing = "event" | "competition" | "external";

export type RegistrationProvider = "arigo" | "page" | "google_form";

export type CouncilKind = "current" | "upcoming" | "past";

export type CouncilBoard = "main" | "junior";

export type CampusRole = "editor" | "administrator";

export type ResourceKind = "card" | "link" | "pdf" | "video";

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
  academicYear?: string | null;
  startTime: string | null;
  endTime: string | null;
  locationName: string | null;
  locationMapUrl: string | null;
  hostName: string | null;
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
  pushToArigo: boolean;
  registrationProvider: RegistrationProvider | null;
  registrationUrl: string | null;
  registrationLabel: string | null;
  registrationDeadline: string | null;
  registrationLimit: number | null;
  registrationCount: number;
  overflowRegistrationUrl: string | null;
  overflowRegistrationLabel: string | null;
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

export type ExtraSiteLink = {
  id: string;
  label: string;
  url: string;
};

export type SocialLinks = {
  schoolLabel: string;
  schoolUrl: string;
  instagramLabel: string;
  instagramUrl: string;
  scixcomLabel: string;
  scixcomInstagramUrl: string;
  extraLinks: ExtraSiteLink[];
};

export type SocialPost = {
  id: string;
  instagramUrl: string;
  caption: string | null;
  imageUrl: string | null;
  pinned: boolean;
  sortOrder: number;
  councilTag: string;
  academicYear?: string | null;
  publishedOn: string;
  createdAt: string;
};

export type SiteBrand = {
  councilLogoUrl: string | null;
  contactEmail: string | null;
  navLogoUrl: string | null;
  navLogoHref: string | null;
  navLabel: string;
};

export type MarqueeMessage = {
  id: string;
  message: string;
  eventId: string | null;
  enabled: boolean;
  sortOrder: number;
};

export type NavIncludeListing = "event" | "competition";

export type NavItem = {
  id: string;
  groupId: string;
  title: string;
  description: string;
  href: string | null;
  eventId: string | null;
  enabled: boolean;
  sortOrder: number;
};

export type NavGroup = {
  id: string;
  label: string;
  href: string | null;
  includeListing: NavIncludeListing | null;
  enabled: boolean;
  sortOrder: number;
  items: NavItem[];
};

export type PublicNavLink = {
  title: string;
  description: string;
  href: string;
};

export type PublicNavGroup = {
  id: string;
  label: string;
  href: string | null;
  links: PublicNavLink[];
};

export type Announcement = {
  id: string;
  title: string;
  body: string;
  resources: ContentResource[];
  eventId: string | null;
  programId?: string | null;
  wellnessId?: string | null;
  category?: string;
  academicYear?: string | null;
  coverImageUrl?: string | null;
  enabled: boolean;
  sortOrder: number;
  createdAt: string;
};

export type HeadTier = "executive" | "section" | "department";

export type SchoolHead = {
  id: string;
  name: string;
  role: string;
  tier: HeadTier;
  tierLabel: string;
  department: string | null;
  photoUrl: string | null;
  message: string;
  about?: string;
  email: string | null;
  phone: string | null;
  sortOrder: number;
  published: boolean;
  createdAt: string;
};

export type SchoolIncharge = SchoolHead;

export type FacultyTier = "principal" | "vice_principal" | "head" | "supervisor";

export type FacultyMember = {
  id: string;
  name: string;
  role: string;
  tier: FacultyTier;
  department: string | null;
  photoUrl: string | null;
  message: string;
  email: string | null;
  sortOrder: number;
  published: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Faq = {
  id: string;
  question: string;
  answer: string;
  sortOrder: number;
  published: boolean;
};

export type CustomProgramPhoto = {
  url: string;
  alt: string;
};

export type CustomProgramLink = {
  label: string;
  url: string;
};

export type CustomProgramEvent = {
  title: string;
  slug: string;
};

export type CustomProgram = {
  id: string;
  title: string;
  summary: string;
  websiteLabel: string | null;
  websiteUrl: string | null;
  photos: CustomProgramPhoto[];
  links: CustomProgramLink[];
  eventId: string | null;
  event: CustomProgramEvent | null;
  sortOrder: number;
  published: boolean;
  category?: string;
  timing?: string | null;
  pdfUrl?: string | null;
};

export type WellnessImageOrientation = "auto" | "portrait" | "landscape" | "square";

export type WellnessCategory = {
  id: string;
  name: string;
  sortOrder: number;
};

export type WellnessItem = {
  id: string;
  title: string;
  body: string;
  categoryId: string | null;
  imageUrl: string | null;
  imageAlt: string;
  imageOrientation: WellnessImageOrientation;
  pdfUrl: string | null;
  sortOrder: number;
  published: boolean;
};

export type WellnessPageSettings = {
  pageTitle: string;
  navLabel: string;
};

export type AcademicTermConfig = {
  label: string | null;
  startDate: string | null;
};

export type PublicCatalog = {
  source: "local" | "supabase";
  categories: Category[];
  events: CampusEvent[];
  achievements: Achievement[];
  councilYears: CouncilYear[];
  mediaHosts: string[];
  councilLogoUrl: string | null;
  activeTerm: AcademicTermConfig;
};

export type HouseColor = "ruby" | "sapphire" | "topaz" | "emerald";

export type House = {
  id: string;
  name: string;
  slug: string;
  color: HouseColor;
  points?: number | null;
  inchargeName: string;
  inchargeTitle: string | null;
  inchargePhotoUrl: string | null;
  inchargeMessage: string | null;
  captainName: string;
  captainPhotoUrl: string | null;
  viceCaptainName: string;
  viceCaptainPhotoUrl: string | null;
  motto: string | null;
  description: string | null;
  sortOrder: number;
  published: boolean;
  updatedAt: string;
};
