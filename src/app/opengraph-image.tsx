import { ImageResponse } from "next/og";
import fs from "node:fs";
import path from "node:path";
import { siteConfig } from "@/lib/config";

export const alt = siteConfig.name;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  let logoDataUrl: string | null = null;
  try {
    const staticLogoPath = path.join(process.cwd(), "public", "brand", "council-og-mark.png");
    const buf = fs.readFileSync(staticLogoPath);
    logoDataUrl = `data:image/png;base64,${buf.toString("base64")}`;
  } catch {
    logoDataUrl = null;
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#050a14",
          backgroundImage:
            "radial-gradient(circle at 88% 12%, rgba(234, 88, 12, 0.22) 0%, transparent 55%), radial-gradient(circle at 12% 88%, rgba(37, 99, 235, 0.28) 0%, transparent 60%)",
          padding: "24px",
          fontFamily: "sans-serif",
        }}
      >
        {/* Main Glassmorphic Card Frame */}
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            backgroundColor: "rgba(10, 17, 34, 0.90)",
            borderRadius: "28px",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            padding: "48px 56px",
            boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.7)",
          }}
        >
          {/* Top Header Row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
            }}
          >
            {/* Brand Emblem & School Title */}
            <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
              {logoDataUrl ? (
                <img
                  src={logoDataUrl}
                  alt="Council Crest"
                  width={68}
                  height={68}
                  style={{
                    borderRadius: "18px",
                    border: "2px solid rgba(251, 191, 36, 0.4)",
                    backgroundColor: "rgba(255, 255, 255, 0.06)",
                    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.4)",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: "68px",
                    height: "68px",
                    borderRadius: "18px",
                    border: "2px solid rgba(251, 191, 36, 0.4)",
                    backgroundColor: "#ea580c",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#ffffff",
                    fontWeight: 900,
                    fontSize: "26px",
                  }}
                >
                  IIS
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                <div
                  style={{
                    fontSize: "13px",
                    letterSpacing: "0.22em",
                    textTransform: "uppercase",
                    fontWeight: 800,
                    color: "#fbbf24",
                  }}
                >
                  India International School
                </div>
                <div
                  style={{
                    fontSize: "24px",
                    fontWeight: 800,
                    letterSpacing: "-0.02em",
                    color: "#ffffff",
                  }}
                >
                  Student Council &bull; Boys Section
                </div>
              </div>
            </div>

            {/* Live Campus Badge */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                backgroundColor: "rgba(16, 185, 129, 0.12)",
                border: "1px solid rgba(16, 185, 129, 0.35)",
                borderRadius: "999px",
                padding: "8px 18px",
              }}
            >
              <div
                style={{
                  width: "10px",
                  height: "10px",
                  borderRadius: "999px",
                  backgroundColor: "#10b981",
                  boxShadow: "0 0 12px #10b981",
                }}
              />
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: 800,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "#a7f3d0",
                }}
              >
                Official Campus Hub
              </span>
            </div>
          </div>

          {/* Middle Body / Hero Statement */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "980px" }}>
            <div
              style={{
                fontSize: "62px",
                lineHeight: 1.08,
                letterSpacing: "-0.035em",
                fontWeight: 800,
                color: "#ffffff",
              }}
            >
              Every Moment on Campus Has a Story.
            </div>
            <div
              style={{
                fontSize: "22px",
                lineHeight: 1.45,
                color: "#94a3b8",
                fontWeight: 400,
                maxWidth: "880px",
              }}
            >
              The digital gateway to school life — explore upcoming events, inter-house championships, student council leadership, and official circulars.
            </div>
          </div>

          {/* Bottom Highlights & Feature Pills */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
              paddingTop: "24px",
              borderTop: "1px solid rgba(255, 255, 255, 0.08)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  backgroundColor: "rgba(255, 255, 255, 0.06)",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  borderRadius: "12px",
                  padding: "8px 16px",
                  color: "#f1f5f9",
                  fontSize: "13px",
                  fontWeight: 600,
                }}
              >
                <div
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "999px",
                    backgroundColor: "#f59e0b",
                  }}
                />
                <span>House Championships</span>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  backgroundColor: "rgba(255, 255, 255, 0.06)",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  borderRadius: "12px",
                  padding: "8px 16px",
                  color: "#f1f5f9",
                  fontSize: "13px",
                  fontWeight: 600,
                }}
              >
                <div
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "999px",
                    backgroundColor: "#ea580c",
                  }}
                />
                <span>Live Events &amp; Competitions</span>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  backgroundColor: "rgba(255, 255, 255, 0.06)",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  borderRadius: "12px",
                  padding: "8px 16px",
                  color: "#f1f5f9",
                  fontSize: "13px",
                  fontWeight: 600,
                }}
              >
                <div
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "999px",
                    backgroundColor: "#38bdf8",
                  }}
                />
                <span>Council Leadership</span>
              </div>
            </div>

            {/* School Domain */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "14px",
                fontWeight: 700,
                color: "#cbd5e1",
                letterSpacing: "0.04em",
              }}
            >
              <span>iiss.ae</span>
              <span style={{ color: "rgba(255, 255, 255, 0.3)" }}>&bull;</span>
              <span style={{ color: "#fbbf24" }}>iisscampus</span>
            </div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
