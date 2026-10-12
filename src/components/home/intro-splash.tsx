"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { CouncilLogo } from "@/components/brand/council-logo";

type Phase = "school" | "councilBg" | "council" | "out" | "done";
type Sequence = "full" | "council";

const introSeenKey = "iisscampus-intro";

export function IntroSplash({ logoUrl }: { logoUrl?: string | null }) {
  const pathname = usePathname();
  const onHome = pathname === "/";
  const [phase, setPhase] = useState<Phase>("done");
  const [sequence, setSequence] = useState<Sequence | null>(null);
  const [trackedHome, setTrackedHome] = useState(onHome);
  if (trackedHome !== onHome) {
    setTrackedHome(onHome);
    setPhase("done");
    setSequence(null);
  }

  useEffect(() => {
    const root = document.documentElement;

    if (!onHome) {
      delete root.dataset.intro;
      return;
    }

    let seen = true;
    try {
      seen = localStorage.getItem(introSeenKey) === "1";
      if (!seen) localStorage.setItem(introSeenKey, "1");
    } catch {
      seen = true;
    }

    root.dataset.intro = "play";
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timers: number[] = [];

    if (!seen) {
      const councilBgAt = reduced ? 700 : 1500;
      const councilAt = councilBgAt + (reduced ? 400 : 1000);
      const outAt = reduced ? 2000 : 4000;
      const doneAt = outAt + (reduced ? 350 : 650);
      timers.push(
        window.setTimeout(() => {
          setSequence("full");
          setPhase("school");
        }, 0),
      );
      timers.push(window.setTimeout(() => setPhase("councilBg"), councilBgAt));
      timers.push(window.setTimeout(() => setPhase("council"), councilAt));
      timers.push(
        window.setTimeout(() => {
          setPhase("out");
          delete root.dataset.intro;
        }, outAt),
      );
      timers.push(window.setTimeout(() => setPhase("done"), doneAt));
    } else {
      const councilAt = reduced ? 400 : 1000;
      const outAt = reduced ? 1100 : 2500;
      const doneAt = outAt + (reduced ? 350 : 650);
      timers.push(
        window.setTimeout(() => {
          setSequence("council");
          setPhase("councilBg");
        }, 0),
      );
      timers.push(window.setTimeout(() => setPhase("council"), councilAt));
      timers.push(
        window.setTimeout(() => {
          setPhase("out");
          delete root.dataset.intro;
        }, outAt),
      );
      timers.push(window.setTimeout(() => setPhase("done"), doneAt));
    }

    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [onHome]);

  const active = onHome && phase !== "done";

  if (!active) return null;

  const showCouncilBg = sequence === "council" || phase !== "school";

  const schoolClass =
    phase === "school"
      ? "intro-splash__school intro-splash__school--active"
      : "intro-splash__school intro-splash__school--exit";

  const councilClass =
    phase === "school" || phase === "councilBg"
      ? "intro-splash__council intro-splash__council--idle"
      : phase === "council"
        ? "intro-splash__council intro-splash__council--active"
        : "intro-splash__council intro-splash__council--exit";

  return (
    <div
      className={`intro-splash ${showCouncilBg ? "intro-splash--council" : ""} ${
        phase === "out" ? "intro-splash--out" : ""
      }`}
      aria-hidden="true"
    >
      {sequence === "full" ? (
        <div className={schoolClass}>
          <Image
            src="/brand/iiss-mark.webp"
            alt=""
            width={160}
            height={160}
            className="h-28 w-28 object-contain md:h-36 md:w-36"
            priority
          />
          <p className="intro-splash__label intro-splash__label--school">India International School, Sharjah</p>
        </div>
      ) : null}

      <div className={councilClass}>
        <CouncilLogo
          url={logoUrl}
          width={260}
          height={260}
          className="h-44 w-44 object-contain md:h-52 md:w-52"
          priority
        />
        <p className="intro-splash__label intro-splash__label--council">Student Council · Boys</p>
      </div>
    </div>
  );
}
