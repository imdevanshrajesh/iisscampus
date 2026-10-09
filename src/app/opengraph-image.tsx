import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/config";

export const alt = siteConfig.name;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: "100%",
          height: "100%",
          background: "#ffffff",
          color: "#14243A",
          padding: "72px",
        }}
      >
        <div style={{ fontSize: 28, letterSpacing: "0.18em", color: "#245CA6" }}>
          IISS X STUDENT COUNCIL BOYS
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 820 }}>
          <div style={{ fontSize: 76, lineHeight: 1.02, letterSpacing: "-0.04em" }}>
            Every moment on campus has a story.
          </div>
          <div style={{ fontSize: 28, color: "#64748B" }}>
            Events, activities, and achievements from school life.
          </div>
        </div>
      </div>
    ),
    size,
  );
}
