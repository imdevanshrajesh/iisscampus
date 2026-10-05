"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const STORAGE_KEY = "campus-intro-seen";

type Phase = "school" | "council" | "out" | "done";

export function IntroSplash() {
  const pathname = usePathname();
  const onHome = pathname === "/";
  const [phase, setPhase] = useState<Phase>("school");

  useEffect(() => {
    const root = document.documentElement;
    if (!onHome || root.dataset.intro !== "play") {
      return;
    }

    try {
      localStorage.setItem(STORAGE_KEY, "1");
      sessionStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // Private browsing safeguard
    }

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const councilAt = reduced ? 1000 : 2100;
    const outAt = reduced ? 2000 : 4500;
    const doneAt = outAt + (reduced ? 400 : 800);

    const timers = [
      window.setTimeout(() => setPhase("council"), councilAt),
      window.setTimeout(() => {
        setPhase("out");
        delete root.dataset.intro;
      }, outAt),
      window.setTimeout(() => {
        setPhase("done");
      }, doneAt),
    ];

    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [onHome]);

  const active =
    onHome &&
    phase !== "done" &&
    (typeof document === "undefined" || document.documentElement.dataset.intro === "play" || phase === "out");

  if (!active) return null;

  const schoolClass =
    phase === "school"
      ? "intro-splash__school intro-splash__school--active"
      : "intro-splash__school intro-splash__school--exit";

  const councilClass =
    phase === "school"
      ? "intro-splash__council intro-splash__council--idle"
      : phase === "council"
        ? "intro-splash__council intro-splash__council--active"
        : "intro-splash__council intro-splash__council--exit";

  return (
    <div
      className={`intro-splash ${phase === "school" ? "" : "intro-splash--council"} ${
        phase === "out" ? "intro-splash--out" : ""
      }`}
      aria-hidden="true"
    >
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

      <div className={councilClass}>
        <Image
          src="/brand/student-council.png"
          alt=""
          width={260}
          height={260}
          className="h-44 w-44 object-contain md:h-56 md:w-56"
          priority
        />
        <p className="intro-splash__label intro-splash__label--council">Student Council · Boys</p>
      </div>
    </div>
  );
}
