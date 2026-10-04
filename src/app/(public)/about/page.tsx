import type { Metadata } from "next";
import { siteConfig } from "@/lib/config";

export const metadata: Metadata = {
  title: "About",
  description: "What IISSCampus is for, and how it relates to Arigo.",
  alternates: { canonical: "/about" },
};

const kinds = [
  "Cultural gatherings and celebrations",
  "Sports and house activities",
  "Academic exhibitions and competitions",
  "Technology and student-led projects",
  "Sustainability work",
  "The boys' student council, year by year",
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-14 md:px-8 md:py-20">
      <p className="text-sm text-accent">About</p>
      <h1 className="font-display mt-3 text-5xl text-ink md:text-6xl">A record of school life.</h1>
      <div className="mt-8 space-y-5 text-base leading-7 text-ink">
        <p>
          IISSCampus keeps activities, the boys&apos; student council, and achievements from India International School, Sharjah. It is an independent archive. It is not the official school website.
        </p>
        <p>
          The official site remains at{" "}
          <a href={siteConfig.officialSchoolUrl} className="text-accent">
            iiss.ae
          </a>
          .
        </p>
      </div>
      <h2 className="mt-12 text-2xl font-medium tracking-tight">What is documented</h2>
      <ul className="mt-4 space-y-2 text-base leading-7">
        {kinds.map((kind) => (
          <li key={kind}>{kind}</li>
        ))}
      </ul>
      <h2 className="mt-12 text-2xl font-medium tracking-tight">Arigo</h2>
      <p className="mt-4 text-base leading-7">
        Arigo is a separate student community. When an activity needs registration, IISSCampus links to the address configured for that event. Creating an Arigo account does not, by itself, register a student for an event. Arigo handles its own sign-in. IISSCampus does not collect Arigo passwords.
      </p>
      {siteConfig.arigoUrl ? (
        <a href={siteConfig.arigoUrl} className="mt-6 inline-flex text-sm font-medium text-accent">
          Explore Arigo
        </a>
      ) : null}
      <h2 className="mt-12 text-2xl font-medium tracking-tight">Contact</h2>
      <p className="mt-4 text-base leading-7 text-muted">
        {siteConfig.contactUrl ? (
          <a href={siteConfig.contactUrl} className="text-accent">
            Send feedback
          </a>
        ) : (
          "A contact link has not been configured."
        )}
        {siteConfig.instagramUrl ? (
          <>
            {" "}
            ·{" "}
            <a href={siteConfig.instagramUrl} className="text-accent">
              Instagram
            </a>
          </>
        ) : null}
      </p>
    </div>
  );
}
