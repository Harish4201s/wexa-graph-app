export default function EmptyState({
  title = 'Nothing here yet',
  subtitle = '',
  icon = '🗂️',
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center">
      <div className="text-3xl">{icon}</div>
      <p className="font-semibold text-slate-700">{title}</p>
      {subtitle && <p className="max-w-sm text-sm text-slate-500">{subtitle}</p>}
    </div>
  );
}
