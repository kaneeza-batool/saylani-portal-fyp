// Shared placeholder for Sub-Admin nav destinations that don't have a real
// page/backend yet (Admissions Queue, Trainers, Batches, Attendance
// Reports, Feedback) — keeps the sidebar fully clickable instead of
// dead-ending, without inventing any data or endpoints.
export default function ComingSoonPage({ title }) {
  return (
    <div className="bg-white border border-neutral-200 rounded-xl p-[22px] text-body-sm text-neutral-500">
      {title} — coming soon.
    </div>
  );
}
