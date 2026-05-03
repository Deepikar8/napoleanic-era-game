import type { ReactNode } from 'react';

export function Button({
  children, onClick, kind = 'primary', disabled,
}: { children: ReactNode; onClick: () => void; kind?: 'primary' | 'secondary' | 'danger'; disabled?: boolean }) {
  const cls =
    kind === 'primary'   ? 'bg-gilt text-ink' :
    kind === 'secondary' ? 'bg-ink/30 text-parchment' :
                           'bg-red-700 text-white';
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`${cls} rounded px-5 py-3 font-bold text-base min-h-[44px] disabled:opacity-40 disabled:cursor-not-allowed`}
    >
      {children}
    </button>
  );
}

export function Panel({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <div className="bg-parchmentDark rounded border border-ink/30 p-3 mb-3">
      {title && <h4 className="text-xs uppercase tracking-wider text-ink/70 mb-2">{title}</h4>}
      {children}
    </div>
  );
}
