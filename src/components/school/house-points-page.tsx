"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import type { House, HouseColor } from "@/lib/types";

type PillarTheme = {
  bg: string;
  textColor: string;
  subTextColor: string;
  cardBg: string;
  cardBorder: string;
  badgeBg: string;
  badgeText: string;
  quoteColor: string;
  avatarBg: string;
  avatarBorder: string;
  avatarText: string;
};

// Minimal, clean themes for all 4 houses:
// Ruby (Deep Red), Sapphire (Deep Blue), Topaz (Distinct Yellow/Gold), Emerald (Deep Green)
const PILLAR_THEMES: Record<HouseColor, PillarTheme> = {
  ruby: {
    bg: "bg-gradient-to-b from-[#881337] via-[#5c061a] to-[#2e020d]",
    textColor: "text-white",
    subTextColor: "text-rose-100/75",
    cardBg: "bg-black/20 backdrop-blur-sm",
    cardBorder: "border-white/10",
    badgeBg: "bg-white/10",
    badgeText: "text-white/80",
    quoteColor: "text-rose-100/90",
    avatarBg: "bg-rose-500/20",
    avatarBorder: "border-rose-400/20",
    avatarText: "text-white",
  },
  sapphire: {
    bg: "bg-gradient-to-b from-[#1e3a8a] via-[#172554] to-[#0a1128]",
    textColor: "text-white",
    subTextColor: "text-sky-100/75",
    cardBg: "bg-black/20 backdrop-blur-sm",
    cardBorder: "border-white/10",
    badgeBg: "bg-white/10",
    badgeText: "text-white/80",
    quoteColor: "text-sky-100/90",
    avatarBg: "bg-sky-500/20",
    avatarBorder: "border-sky-400/20",
    avatarText: "text-white",
  },
  topaz: {
    // Unmistakably rich golden yellow with high-contrast espresso typography
    bg: "bg-gradient-to-b from-[#eab308] via-[#ca8a04] to-[#854d0e]",
    textColor: "text-[#181102]",
    subTextColor: "text-[#2e2004]/80",
    cardBg: "bg-white/30 backdrop-blur-sm",
    cardBorder: "border-[#181102]/10",
    badgeBg: "bg-[#181102]/10",
    badgeText: "text-[#181102]/80",
    quoteColor: "text-[#181102]/90",
    avatarBg: "bg-[#181102]/10",
    avatarBorder: "border-[#181102]/20",
    avatarText: "text-[#181102]",
  },
  emerald: {
    bg: "bg-gradient-to-b from-[#065f46] via-[#043e2e] to-[#021f17]",
    textColor: "text-white",
    subTextColor: "text-emerald-100/75",
    cardBg: "bg-black/20 backdrop-blur-sm",
    cardBorder: "border-white/10",
    badgeBg: "bg-white/10",
    badgeText: "text-white/80",
    quoteColor: "text-emerald-100/90",
    avatarBg: "bg-emerald-500/20",
    avatarBorder: "border-emerald-400/20",
    avatarText: "text-white",
  },
};

function MemberAvatar({
  name,
  photoUrl,
  avatarBg,
  avatarBorder,
  avatarText,
  size = "md",
}: {
  name: string;
  photoUrl?: string | null;
  avatarBg: string;
  avatarBorder: string;
  avatarText: string;
  size?: "sm" | "md";
}) {
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("");

  const dim = size === "sm" ? "h-9 w-9 text-xs" : "h-11 w-11 text-xs";

  if (photoUrl) {
    return (
      <div className={`relative ${dim} rounded-full overflow-hidden border ${avatarBorder} shadow-sm shrink-0 bg-white/10`}>
        <Image src={photoUrl} alt={name} fill sizes="44px" className="object-cover" />
      </div>
    );
  }

  return (
    <div
      className={`flex ${dim} items-center justify-center rounded-full font-semibold tracking-wider shrink-0 border ${avatarBorder} ${avatarBg} ${avatarText}`}
    >
      {initials || "•"}
    </div>
  );
}

export function HousePointsPage({ houses }: { houses: House[] }) {
  const [hoveredHouse, setHoveredHouse] = useState<string | null>(null);
  const [activeMobileHouse, setActiveMobileHouse] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("all");

  // Keep full canvas background matching footer (#0a0e1a) without any white gap
  useEffect(() => {
    document.body.classList.add("dark-canvas");
    return () => {
      document.body.classList.remove("dark-canvas");
    };
  }, []);

  // Standard 4-house ordering: Ruby, Sapphire, Topaz, Emerald
  const orderedHouses = [
    houses.find((h) => h.color === "ruby") ?? {
      id: "ruby",
      name: "Ruby",
      slug: "ruby",
      color: "ruby" as HouseColor,
      inchargeName: "Mr. Tariq Mansoor",
      inchargeTitle: "Faculty Incharge",
      inchargePhotoUrl: null,
      inchargeMessage:
        "Strive with courage, give your utmost on every sports field, and hold your head high in triumph or defeat.",
      captainName: "ZAYAN JASSEER",
      captainPhotoUrl: null,
      viceCaptainName: "DANIAL POULOSE",
      viceCaptainPhotoUrl: null,
      motto: "Courage, Passion & Strength",
      description: "United under the scarlet banner of courage, valor, and unwavering sportsmanship.",
      sortOrder: 1,
      published: true,
      updatedAt: new Date().toISOString(),
    },
    houses.find((h) => h.color === "sapphire") ?? {
      id: "sapphire",
      name: "Sapphire",
      slug: "sapphire",
      color: "sapphire" as HouseColor,
      inchargeName: "Mr. Suhail Hashim",
      inchargeTitle: "Faculty Incharge",
      inchargePhotoUrl: null,
      inchargeMessage:
        "Wisdom is our armor, truth our shield. Compete with dignity and excel through brotherhood.",
      captainName: "ZAYAN MUHAMMED RIZAM",
      captainPhotoUrl: null,
      viceCaptainName: "SALAH MAHARUS NISAN",
      viceCaptainPhotoUrl: null,
      motto: "Wisdom, Loyalty & Honor",
      description: "Soaring with the spirit of the ocean and sky, guided by integrity and sharp intellect.",
      sortOrder: 2,
      published: true,
      updatedAt: new Date().toISOString(),
    },
    houses.find((h) => h.color === "topaz") ?? {
      id: "topaz",
      name: "Topaz",
      slug: "topaz",
      color: "topaz" as HouseColor,
      inchargeName: "Mr. Abdul Razak",
      inchargeTitle: "Faculty Incharge",
      inchargePhotoUrl: null,
      inchargeMessage:
        "Bring radiant enthusiasm, never surrender to doubt, and illuminate the campus with golden resolve.",
      captainName: "MOHAMMED IHSAN",
      captainPhotoUrl: null,
      viceCaptainName: "STEPHEN MASCARENHAS",
      viceCaptainPhotoUrl: null,
      motto: "Brilliance, Energy & Optimism",
      description: "Radiating warmth, unstoppable enthusiasm, creativity, and tireless perseverance.",
      sortOrder: 3,
      published: true,
      updatedAt: new Date().toISOString(),
    },
    houses.find((h) => h.color === "emerald") ?? {
      id: "emerald",
      name: "Emerald",
      slug: "emerald",
      color: "emerald" as HouseColor,
      inchargeName: "Mr. Faisal Siddiqui",
      inchargeTitle: "Faculty Incharge",
      inchargePhotoUrl: null,
      inchargeMessage:
        "Rooted like mighty trees, we grow together in resilience, discipline, and quiet determination.",
      captainName: "MOHAMMED AAZIM",
      captainPhotoUrl: null,
      viceCaptainName: "SHAZ MOHAMMED",
      viceCaptainPhotoUrl: null,
      motto: "Growth, Harmony & Resilience",
      description: "Rooted in discipline and unity, flourishing through team spirit and quiet determination.",
      sortOrder: 4,
      published: true,
      updatedAt: new Date().toISOString(),
    },
  ];

  return (
    <div className="w-full min-h-[calc(100vh-4.5rem)] flex flex-col bg-[#0a0e1a]">
      {/* Mobile Switcher (Sticky at top on small screens) */}
      <div className="lg:hidden sticky top-16 z-30 flex items-center justify-center gap-1 p-2 bg-[#0a0e1a]/95 backdrop-blur-md border-b border-white/10">
        <button
          type="button"
          onClick={() => {
            setActiveTab("all");
            setActiveMobileHouse(null);
          }}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
            activeTab === "all" ? "bg-white text-[#0a0e1a] shadow-sm" : "text-zinc-400 hover:text-white"
          }`}
        >
          All 4
        </button>
        {orderedHouses.map((h) => (
          <button
            key={h.id}
            type="button"
            onClick={() => {
              setActiveTab(h.color);
              setActiveMobileHouse(h.id);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition cursor-pointer ${
              activeTab === h.color ? "bg-white text-[#0a0e1a] shadow-sm" : "text-zinc-400 hover:text-white"
            }`}
          >
            {h.color}
          </button>
        ))}
      </div>

      {/* 4 Full-Screen Minimal Vertical Pillars with Interactive Hover Expansion */}
      <main className="flex-1 w-full flex flex-col lg:flex-row min-h-[calc(100vh-4.5rem)]">
        {orderedHouses.map((house) => {
          const theme = PILLAR_THEMES[house.color];
          const cleanName =
            house.name.replace(/\s*house\s*/i, "").trim() || house.color.toUpperCase();
          const isHiddenOnMobile = activeTab !== "all" && activeTab !== house.color;

          // Expansion state: hovered on desktop, or active on mobile
          const isDesktopHovered = hoveredHouse === house.id;
          const isMobileActive = activeMobileHouse === house.id || activeTab === house.color;
          const isExpanded = isDesktopHovered || isMobileActive;
          const isDimmed = Boolean(hoveredHouse && hoveredHouse !== house.id);

          return (
            <section
              key={house.id}
              onMouseEnter={() => setHoveredHouse(house.id)}
              onMouseLeave={() => setHoveredHouse(null)}
              onClick={() => {
                setActiveMobileHouse(activeMobileHouse === house.id ? null : house.id);
              }}
              className={`relative flex flex-col justify-center items-center text-center ${theme.bg} ${theme.textColor} px-6 sm:px-8 lg:px-6 py-14 lg:py-16 border-b lg:border-b-0 lg:border-r border-white/10 last:border-r-0 transition-all duration-500 ease-out cursor-pointer select-none overflow-hidden ${
                isHiddenOnMobile ? "hidden lg:flex" : "flex"
              } ${
                isDesktopHovered
                  ? "lg:flex-[2.2] shadow-2xl z-20"
                  : isDimmed
                  ? "lg:flex-[0.75] opacity-80"
                  : "lg:flex-1 opacity-100"
              }`}
            >
              {/* CENTER CORE: Pure Minimal House Name + Motto (No Logos, Clean Typography) */}
              <div className="relative z-10 w-full max-w-sm flex flex-col items-center transition-all duration-500">
                <h1 className="text-4xl sm:text-5xl lg:text-5xl xl:text-6xl font-display font-bold tracking-tight">
                  {cleanName}
                </h1>

                {house.motto && (
                  <p
                    className={`text-xs sm:text-sm italic font-serif ${theme.subTextColor} pt-2 max-w-[280px] leading-relaxed`}
                  >
                    &ldquo;{house.motto}&rdquo;
                  </p>
                )}
              </div>

              {/* EXPANDABLE LEADERSHIP SECTION (Minimal, Clean Reveal on Hover) */}
              <div
                className={`relative z-10 w-full max-w-sm transition-all duration-500 ease-out ${
                  isExpanded
                    ? "max-h-[600px] opacity-100 translate-y-0 mt-8 pointer-events-auto"
                    : "max-h-0 opacity-0 translate-y-4 pointer-events-none overflow-hidden"
                }`}
              >
                <div className="space-y-3 pt-2">
                  {/* Faculty Incharge Card */}
                  <div
                    className={`p-4 rounded-xl ${theme.cardBg} border ${theme.cardBorder} text-center space-y-2`}
                  >
                    <div className="flex flex-col items-center">
                      <MemberAvatar
                        name={house.inchargeName}
                        photoUrl={house.inchargePhotoUrl}
                        avatarBg={theme.avatarBg}
                        avatarBorder={theme.avatarBorder}
                        avatarText={theme.avatarText}
                        size="md"
                      />
                      <span
                        className={`inline-block text-[9px] uppercase font-semibold tracking-widest px-2 py-0.5 rounded-full mt-2 ${theme.badgeBg} ${theme.badgeText}`}
                      >
                        Faculty Incharge
                      </span>
                      <h3 className="text-sm sm:text-base font-semibold mt-1">
                        {house.inchargeName}
                      </h3>
                      {house.inchargeTitle && house.inchargeTitle !== "Faculty Incharge" && (
                        <p className={`text-[11px] ${theme.subTextColor}`}>
                          {house.inchargeTitle}
                        </p>
                      )}
                    </div>

                    {/* Incharge Message Quote */}
                    {house.inchargeMessage && (
                      <div className="pt-2 border-t border-current/10">
                        <p className={`text-xs leading-relaxed italic ${theme.quoteColor}`}>
                          &ldquo;{house.inchargeMessage}&rdquo;
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Captain & Vice Captain Side-by-Side */}
                  <div className="grid grid-cols-2 gap-2.5">
                    {/* Captain */}
                    <div
                      className={`p-3 rounded-xl ${theme.cardBg} border ${theme.cardBorder} flex flex-col items-center text-center`}
                    >
                      <MemberAvatar
                        name={house.captainName}
                        photoUrl={house.captainPhotoUrl}
                        avatarBg={theme.avatarBg}
                        avatarBorder={theme.avatarBorder}
                        avatarText={theme.avatarText}
                        size="sm"
                      />
                      <span
                        className={`text-[8px] uppercase font-semibold tracking-wider px-2 py-0.5 rounded-full mt-1.5 ${theme.badgeBg} ${theme.badgeText}`}
                      >
                        Captain
                      </span>
                      <p className="text-xs font-semibold mt-1 line-clamp-2">
                        {house.captainName}
                      </p>
                    </div>

                    {/* Vice Captain */}
                    <div
                      className={`p-3 rounded-xl ${theme.cardBg} border ${theme.cardBorder} flex flex-col items-center text-center`}
                    >
                      <MemberAvatar
                        name={house.viceCaptainName}
                        photoUrl={house.viceCaptainPhotoUrl}
                        avatarBg={theme.avatarBg}
                        avatarBorder={theme.avatarBorder}
                        avatarText={theme.avatarText}
                        size="sm"
                      />
                      <span
                        className={`text-[8px] uppercase font-semibold tracking-wider px-2 py-0.5 rounded-full mt-1.5 ${theme.badgeBg} ${theme.badgeText}`}
                      >
                        Vice Captain
                      </span>
                      <p className="text-xs font-semibold mt-1 line-clamp-2">
                        {house.viceCaptainName}
                      </p>
                    </div>
                  </div>

                  {/* House Values / Description */}
                  {house.description && (
                    <div className="pt-1">
                      <p className={`text-[11px] leading-relaxed ${theme.subTextColor}`}>
                        {house.description}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </section>
          );
        })}
      </main>
    </div>
  );
}
