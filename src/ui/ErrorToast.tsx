import { useGame } from '../state/store';

export function ErrorToast() {
  const msg = useGame(s => s.errorMessage);
  const clearError = useGame(s => s.clearError);
  if (!msg) return null;
  return (
    <div
      className="fixed left-1/2 -translate-x-1/2 top-6 z-50 bg-red-700 text-white px-4 py-2 rounded shadow-lg text-sm font-semibold cursor-pointer max-w-xs text-center"
      onClick={clearError}
      role="alert"
    >
      {msg}
    </div>
  );
}
