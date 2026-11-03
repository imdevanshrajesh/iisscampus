"use client";

import { useState } from "react";
import { Share2, Check, Copy } from "lucide-react";

export function NoticeShareButton({
  title,
  noticeId,
}: {
  title: string;
  noticeId: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = `${typeof window !== "undefined" ? window.location.origin : ""}/announcements/${noticeId}`;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title,
          text: `Official Campus Notice: ${title}`,
          url,
        });
        return;
      } catch {
        // Fallback to clipboard copy
      }
    }

    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      className="inline-flex items-center gap-2 rounded-xl bg-navy px-4 py-2.5 text-xs font-semibold text-white hover:bg-navy/90 transition shadow-xs cursor-pointer active:scale-95"
    >
      {copied ? <Check size={14} className="text-emerald-400" /> : <Share2 size={14} />}
      <span>{copied ? "Link Copied to Clipboard!" : "Share Notice"}</span>
    </button>
  );
}
