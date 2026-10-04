import type { Achievement, CampusEvent, Category, CouncilMember, CouncilYear } from "@/lib/types";

const now = "2026-01-01T00:00:00.000Z";

const councilRoster: [string, string][] = [
  ["Head Boy", "MOHAMMED REHAAN"],
  ["Deputy Head Boy", "DEVANSH RAJESH SINGH"],
  ["Activity Captain", "AFHAM ABUBAKKER"],
  ["Activity Vice Captain", "YASH BHAVSAR"],
  ["Sports Captain", "ROHAN VISVAKARMA"],
  ["Sports Vice Captain", "MUHAMMAD SHIHAN"],
  ["Ruby House Captain", "ZAYAN JASSEER"],
  ["Ruby House Vice Captain", "DANIAL POULOSE"],
  ["Emerald House Captain", "MOHAMMED AAZIM"],
  ["Emerald House Vice Captain", "SHAZ MOHAMMED"],
  ["Sapphire House Captain", "ZAYAN MUHAMMED RIZAM"],
  ["Sapphire House Vice Captain", "SALAH MAHARUS NISAN"],
  ["Topaz House Captain", "MOHAMMED IHSAN"],
  ["Topaz House Vice Captain", "STEPHEN MASCARENHAS"],
  ["Wellness Captain", "MOHAMMED BILAL TARIQ"],
  ["Wellness Vice Captain", "NUAMAAN SHAIKH"],
  ["Discipline Captain", "PRANET PAUL"],
  ["Discipline Vice Captain", "HISHAM HASHEEF"],
  ["Linguistic Captain", "PRANEET SATHISH"],
  ["Linguistic Vice Captain", "ISSAM ISMAIL"],
  ["Eco-Innovator Captain", "SUMITH CHANDRA"],
  ["Eco-Innovator Vice Captain", "RISHIT RENOJ"],
  ["Council Secretary", "MOHAMMED SHAYAAN"],
  ["Council Secretary Vice Captain", "SRIRAM MENON"],
  ["Health & Nutrition Captain", "AKBAR ADHIL"],
  ["Health And Nutrition Vice Captain", "JOSHUA EMMANUEL"],
  ["Digital Defender Captain", "AHAMED BILAL"],
  ["Digital Defender Vice Captain", "NITHISH BALAKRISHNAN"],
  ["Inclusion Captain", "MUHAMMED MUSTHAFA"],
  ["Inclusion Vice Captain", "ALVIN MANU"],
  ["Community Outreach Captain", "GHIYAS ABUBACKER"],
  ["Community Outreach Vice Captain", "MUHAMMAD AZHAR"],
  ["Global Citizen Captain", "SAMEETH"],
  ["Global Citizen Vice Captain", "ASWIN AJITHKUMAR"],
  ["Young Entrepreneurship Captain", "GURU PRAKASH"],
  ["Young Entrepreneurship Vice Captain", "ABHINAND VIMAL"],
  ["Ethos Captain", "MOHAMMED ALI"],
  ["Ethos Vice Captain", "UMER BILAL"],
  ["Nex Gen Captain", "RITVIK SAI"],
  ["Nex Gen Vice Captain", "ABHAY SIVANANDAN"],
];

function councilMember(index: number, role: string, name: string): CouncilMember {
  return {
    id: `31000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
    role,
    name,
    imageUrl: null,
    imageAlt: null,
    sortOrder: index,
  };
}

export const seedCouncilYears: CouncilYear[] = [
  {
    id: "30000000-0000-4000-8000-000000000001",
    label: "2026–27",
    slug: "2026-27",
    kind: "current",
    summary: "Boys' student council for 2026–27.",
    publicationStatus: "published",
    sortOrder: 0,
    isSample: false,
    members: councilRoster.map(([role, name], index) => councilMember(index, role, name)),
    photos: [],
    posts: [],
    createdAt: now,
    updatedAt: now,
    publishedAt: now,
  },
];

export const seedCategories: Category[] = [
  {
    id: "10000000-0000-4000-8000-000000000001",
    slug: "cultural",
    name: "Cultural",
    description: "Performances, heritage programmes, and cultural gatherings.",
    sortOrder: 1,
  },
  {
    id: "10000000-0000-4000-8000-000000000002",
    slug: "sports",
    name: "Sports",
    description: "Matches, house sport, and athletic gatherings.",
    sortOrder: 2,
  },
  {
    id: "10000000-0000-4000-8000-000000000003",
    slug: "academic",
    name: "Academic",
    description: "Subject exhibitions, academic contests, and scholarly work.",
    sortOrder: 3,
  },
  {
    id: "10000000-0000-4000-8000-000000000004",
    slug: "technology",
    name: "Technology",
    description: "Computing, design, and technology showcases.",
    sortOrder: 4,
  },
  {
    id: "10000000-0000-4000-8000-000000000005",
    slug: "sustainability",
    name: "Sustainability",
    description: "Environmental projects and campus sustainability work.",
    sortOrder: 5,
  },
  {
    id: "10000000-0000-4000-8000-000000000006",
    slug: "student-initiatives",
    name: "Student Initiatives",
    description: "Activities organised and led by students.",
    sortOrder: 6,
  },
  {
    id: "10000000-0000-4000-8000-000000000007",
    slug: "celebrations",
    name: "Celebrations",
    description: "Festive days and community celebrations.",
    sortOrder: 7,
  },
];

const sports = seedCategories[1].id;
const sustainability = seedCategories[4].id;
const celebrations = seedCategories[6].id;

function sampleEvent(
  partial: Pick<CampusEvent, "id" | "title" | "slug" | "shortDescription" | "fullDescription" | "categoryId" | "purpose" | "activities"> &
    Partial<CampusEvent>,
): CampusEvent {
  return {
    coverImageUrl: null,
    coverAlt: null,
    coverAttribution: null,
    eventDate: null,
    endDate: null,
    publicationStatus: "published",
    eventStatus: null,
    featured: false,
    isSample: true,
    registrationEnabled: false,
    registrationProvider: null,
    registrationUrl: null,
    registrationLabel: null,
    registrationDeadline: null,
    registrationInstructions: null,
    instagramUrl: null,
    schedule: [],
    groups: [],
    videoUrl: null,
    images: [],
    relatedIds: [],
    createdAt: now,
    updatedAt: now,
    publishedAt: now,
    ...partial,
  };
}

export const seedEvents: CampusEvent[] = [
  sampleEvent({
    id: "20000000-0000-4000-8000-000000000001",
    title: "FIFA Fever",
    slug: "fifa-fever",
    categoryId: sports,
    featured: true,
    shortDescription:
      "Demonstration record for a campus football gathering. This summary is sample copy, not a verified match report.",
    fullDescription:
      "This is a demonstration page for FIFA Fever. It shows how a sports activity can be archived with an overview, photographs, and results once those details have been approved.\n\nNo score, team list, or date is included here, because those facts have not been verified for publication.",
    purpose:
      "Sample objective: give the school community a shared record of a football activity. Replace this text with the approved purpose.",
    activities:
      "Sample activities might include fixtures, a student crowd, and a closing gathering. Replace this with the approved description.",
    relatedIds: [
      "20000000-0000-4000-8000-000000000002",
      "20000000-0000-4000-8000-000000000003",
    ],
  }),
  sampleEvent({
    id: "20000000-0000-4000-8000-000000000002",
    title: "Mango Day",
    slug: "mango-day",
    categoryId: celebrations,
    featured: true,
    shortDescription:
      "Demonstration record for a campus celebration. The description is placeholder copy until an approved account is added.",
    fullDescription:
      "This is a demonstration page for Mango Day. A celebration page can stay simple: an overview, a few photographs, and a short note about what the day felt like.\n\nNothing on this page should be read as a confirmed historical account.",
    purpose: null,
    activities:
      "Sample note: stalls, tasting, and a student-led welcome. Replace this once the real programme is approved.",
    relatedIds: ["20000000-0000-4000-8000-000000000001"],
  }),
  sampleEvent({
    id: "20000000-0000-4000-8000-000000000003",
    title: "Sustainability Exhibition",
    slug: "sustainability-exhibition",
    categoryId: sustainability,
    featured: true,
    shortDescription:
      "Demonstration record for a student sustainability exhibition. Outcomes and participants are intentionally omitted.",
    fullDescription:
      "This is a demonstration page for a sustainability exhibition. It is here so the archive has a place for projects, displays, and student explanations.\n\nParticipation counts, prizes, and dates are not invented on this page.",
    purpose:
      "Sample objective: document student work on campus sustainability. Replace this with the approved brief.",
    activities:
      "Sample displays might cover waste, energy, and student proposals. Replace this with the approved exhibition notes.",
    relatedIds: ["20000000-0000-4000-8000-000000000002"],
  }),
  sampleEvent({
    id: "20000000-0000-4000-8000-000000000004",
    title: "Withheld draft",
    slug: "withheld-draft",
    categoryId: sports,
    publicationStatus: "draft",
    publishedAt: null,
    featured: true,
    shortDescription: "This draft must never appear on the public site.",
    fullDescription: "Unpublished demonstration record used to verify public filtering.",
    purpose: null,
    activities: null,
    relatedIds: [],
  }),
  sampleEvent({
    id: "20000000-0000-4000-8000-000000000005",
    title: "Archived sample",
    slug: "archived-sample",
    categoryId: celebrations,
    publicationStatus: "archived",
    featured: true,
    shortDescription: "Archived demonstration record withheld from public pages.",
    fullDescription: "Archived demonstration record used to verify public filtering.",
    purpose: null,
    activities: null,
    relatedIds: [],
  }),
];

export const seedAchievements: Achievement[] = [
  {
    id: "30000000-0000-4000-8000-000000000002",
    title: "Sample award",
    competitionName: "Placeholder competition",
    winnerName: "Sample team",
    award: "Placeholder result",
    eventDate: null,
    academicYear: null,
    categoryId: sports,
    eventId: "20000000-0000-4000-8000-000000000001",
    imageUrl: null,
    imageAlt: null,
    publicationStatus: "published",
    isSample: true,
    createdAt: now,
    updatedAt: now,
    publishedAt: now,
  },
  {
    id: "30000000-0000-4000-8000-000000000001",
    title: "Withheld result",
    competitionName: "Unpublished sample",
    winnerName: null,
    award: null,
    eventDate: null,
    academicYear: null,
    categoryId: sports,
    eventId: seedEvents[0].id,
    imageUrl: null,
    imageAlt: null,
    publicationStatus: "draft",
    isSample: true,
    createdAt: now,
    updatedAt: now,
    publishedAt: null,
  },
];

export const seedMediaHosts: string[] = [];
