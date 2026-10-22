import type { Metadata } from "next";
import { SuggestionForm } from "@/components/suggestions/suggestion-form";

export const metadata: Metadata = {
  title: "Suggestions",
  description: "Send a suggestion to the IISS boys' student council.",
  alternates: { canonical: "/suggestions" },
};

export default function SuggestionsPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-12 md:px-8 md:py-16">
      <p className="kicker text-accent">Council</p>
      <h1 className="font-display mt-3 text-5xl text-ink md:text-6xl">Suggestions</h1>
      <p className="mt-4 max-w-xl text-base leading-7 text-muted">
        Send a short note about campus life. The council reads these in the content workspace. They are not published
        on the site.
      </p>
      <SuggestionForm />
    </div>
  );
}
