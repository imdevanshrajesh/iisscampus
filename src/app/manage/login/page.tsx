import { redirect } from "next/navigation";
import { LoginForm } from "@/components/manage/login-form";
import { getCampusActor } from "@/lib/auth/session";
import { isSupabaseConfigured } from "@/lib/config";

export default async function LoginPage() {
  if (isSupabaseConfigured()) {
    const actor = await getCampusActor();
    if (actor) redirect("/manage");
  }

  return <LoginForm configured={isSupabaseConfigured()} />;
}
