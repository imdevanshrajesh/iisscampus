import { redirect } from "next/navigation";

export default async function CouncilNoticeRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/announcements/${id}`);
}
