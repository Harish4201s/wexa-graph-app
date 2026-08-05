export default function ErrorState({
  message = 'Something went wrong.',
  onRetry,
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-red-200 bg-red-50 py-12 px-6 text-center">
      <div className="text-2xl">⚠️</div>
      <p className="max-w-md text-sm font-medium text-red-700">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
        >
          Try again
        </button>
      )}
    </div>
  );
}
