import { ManageHousesList } from "@/components/manage/manage-houses-list";
import { ManageUnavailable } from "@/components/manage/unavailable";
import { getEditableHouses } from "@/lib/data/queries";
import { requireWorkspace } from "@/lib/manage/access";

export default async function HousesManagePage() {
  const access = await requireWorkspace();
  if (!access.ready) return <ManageUnavailable />;
  const houses = await getEditableHouses();

  return (
    <div className="mx-auto max-w-6xl px-5 py-12 md:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted">Inter-House Championship</p>
          <h1 className="text-3xl font-medium tracking-tight text-ink mt-1">House Points & Leadership</h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-muted">
            Manage live point tallies, faculty incharges, student captains, and vice captains for Ruby, Sapphire, Topaz, and Emerald houses.
          </p>
        </div>
      </div>

      <div className="mt-8">
        <ManageHousesList houses={houses} />
      </div>
    </div>
  );
}
