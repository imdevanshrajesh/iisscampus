import { redirect } from "next/navigation";
import { LoginForm } from "@/components/manage/login-form";
import { getCampusSession } from "@/lib/auth/session";
import { isSupabaseConfigured } from "@/lib/config";

export default async function LoginPage() {
  if (isSupabaseConfigured()) {
    const session = await getCampusSession();
    if (session.status === "ok") redirect("/manage");
  }

  return <LoginForm configured={isSupabaseConfigured()} />;
}
