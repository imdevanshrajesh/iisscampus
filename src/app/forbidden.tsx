export default function Forbidden() {
  return (
    <main className="mx-auto max-w-xl px-5 py-24">
      <h1 className="text-3xl font-medium tracking-tight">You do not have access to that.</h1>
      <p className="mt-3 text-sm leading-6 text-muted">This action is limited to a campus administrator.</p>
    </main>
  );
}
