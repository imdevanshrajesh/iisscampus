"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: string | HTMLElement,
        options: {
          sitekey: string;
          action?: string;
          cData?: string;
          callback?: (token: string) => void;
          "error-callback"?: (error?: unknown) => void;
          "expired-callback"?: () => void;
          theme?: "light" | "dark" | "auto";
          appearance?: "always" | "execute" | "interaction-only";
        },
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
      getResponse: (widgetId?: string) => string | undefined;
    };
  }
}

export type TurnstileWidgetProps = {
  action?: string;
  resetKey?: unknown;
  siteKey?: string;
  className?: string;
  onVerify?: (token: string) => void;
  onExpire?: () => void;
};

const DEFAULT_SITE_KEY =
  process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "0x4AAAAAAF2BtPcHkEdFQRrn";

export function TurnstileWidget({
  action,
  resetKey,
  siteKey = DEFAULT_SITE_KEY,
  className = "",
  onVerify,
  onExpire,
}: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  // Initialize or render widget once script and container are ready
  useEffect(() => {
    if (!scriptLoaded && typeof window !== "undefined" && window.turnstile) {
      setScriptLoaded(true);
    }
  }, [scriptLoaded]);

  useEffect(() => {
    if (!scriptLoaded || !containerRef.current || !window.turnstile) return;

    if (!widgetIdRef.current) {
      try {
        const id = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          action,
          theme: "auto",
          callback: (token: string) => {
            onVerify?.(token);
          },
          "expired-callback": () => {
            onExpire?.();
          },
          "error-callback": () => {
            onExpire?.();
          },
        });
        widgetIdRef.current = id;
      } catch (err) {
        console.error("Turnstile render error:", err);
      }
    }

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          // ignore cleanup errors on fast unmount
        }
        widgetIdRef.current = null;
      }
    };
  }, [scriptLoaded, siteKey, action, onVerify, onExpire]);

  // Reset widget when resetKey updates (e.g. after form submission)
  useEffect(() => {
    if (widgetIdRef.current && window.turnstile && resetKey !== undefined) {
      try {
        window.turnstile.reset(widgetIdRef.current);
      } catch {
        // ignore reset errors
      }
    }
  }, [resetKey]);

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onLoad={() => setScriptLoaded(true)}
      />
      <div
        ref={containerRef}
        className={`cf-turnstile min-h-[65px] ${className}`}
        aria-label="Cloudflare Turnstile verification"
      />
    </>
  );
}
