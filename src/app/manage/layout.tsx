import type { Metadata } from "next";
import { ManageBar } from "@/components/manage/manage-bar";

export const metadata: Metadata = {
  title: "Content",
  robots: { index: false, follow: false },
};

export default function ManageLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-full bg-surface">
      <ManageBar />
      {children}
    </div>
  );
}
