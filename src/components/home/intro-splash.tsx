"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type Phase = "school" | "councilBg" | "council" | "out" | "done";

export function IntroSplash() {
  const pathname = usePathname();
  const onHome = pathname === "/";
  const [phase, setPhase] = useState<Phase>("school");

  useEffect(() => {
    const root = document.documentElement;

    if (!onHome) {
      delete root.dataset.intro;
      setPhase("done");
      return;
    }

    root.dataset.intro = "play";
    setPhase("school");

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const councilBgAt = reduced ? 700 : 1500;
    const councilAt = councilBgAt + (reduced ? 400 : 1000);
    const outAt = reduced ? 2000 : 4000;
    const doneAt = outAt + (reduced ? 350 : 650);

    const timers = [
      window.setTimeout(() => setPhase("councilBg"), councilBgAt),
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

  const showCouncilBg = phase !== "school";

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
          unoptimized
          className="h-44 w-44 object-contain md:h-52 md:w-52"
          priority
        />
        <p className="intro-splash__label intro-splash__label--council">Student Council · Boys</p>
      </div>
    </div>
  );
}
