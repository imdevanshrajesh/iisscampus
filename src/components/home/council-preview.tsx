import Image from "next/image";
import { RevealOnScroll } from "@/components/home/reveal-on-scroll";
import { RingLink } from "@/components/home/ring-link";

export function CouncilPreview() {
  return (
    <section className="mx-auto max-w-[90rem] px-5 md:px-8">
      <RevealOnScroll>
        <div className="relative rounded-[1.75rem] bg-council text-white shadow-[0_40px_80px_-30px_rgba(8,39,75,0.55)]">
          <div className="grid items-center gap-10 px-6 py-14 md:grid-cols-[18rem_1fr] md:px-14 md:py-20">
            <Image
              src="/brand/student-council.png"
              alt=""
              width={640}
              height={640}
              className="council-hero__logo mx-auto h-auto w-48 object-contain md:w-full md:max-w-[17rem]"
            />
            <div>
              <p className="kicker text-[#9fc4e4]">Student council · Boys</p>
              <h2 className="font-display mt-4 max-w-[12ch] text-[clamp(2.8rem,5.5vw,5.4rem)] leading-[0.86]">
                The boys who <span className="italic text-gold">run the year.</span>
              </h2>
              <p className="mt-6 max-w-md text-base leading-7 text-white/70">
                Photographs, posts, and the full roster for this year and every one before it.
              </p>
              <div className="mt-9">
                <RingLink href="/council" tone="night">
                  Open the council
                </RingLink>
              </div>
            </div>
          </div>
        </div>
      </RevealOnScroll>
    </section>
  );
}
