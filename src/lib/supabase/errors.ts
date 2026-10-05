export type PostgrestErrorLike = {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
};

export function isMissingTableError(error: PostgrestErrorLike | null | undefined) {
  if (!error) return false;
  const code = error.code ?? "";
  const message = (error.message ?? "").toLowerCase();
  return (
    code === "42P01" ||
    code === "PGRST205" ||
    message.includes("does not exist") ||
    message.includes("could not find the table")
  );
}

export function logPostgrestUnlessMissing(error: PostgrestErrorLike | null | undefined) {
  if (!error || isMissingTableError(error)) return;
  console.error(error);
}

export function missingCouncilTablesMessage() {
  return "Student council tables are not in the database yet. Apply supabase/migrations/20261004180000_campus_council.sql, then try again.";
}
