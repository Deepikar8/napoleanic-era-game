import type { ReactNode } from 'react';

export function Button({
  children, onClick, kind = 'primary', disabled,
}: { children: ReactNode; onClick: () => void; kind?: 'primary' | 'secondary' | 'danger'; disabled?: boolean }) {
  // Visual hierarchy:
  //   primary   = gold (CTA / "do it" action)
  //   secondary = parchment-toned with ink text + border (clearly clickable, not the main action)
  //   danger    = red (confirm an irreversible / harmful action)
  //   disabled  = 40% opacity + not-allowed cursor (inherits the kind's colours)
  const cls =
    kind === 'primary'
      ? 'bg-gilt text-ink border border-[#7a5a08] hover:bg-[#e6b520]'
    : kind === 'secondary'
      ? 'bg-parchmentDark text-ink border border-ink/50 hover:bg-parchment'
    :   'bg-red-700 text-white border border-red-900 hover:bg-red-600';
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`${cls} rounded px-5 py-3 font-bold text-base min-h-[44px] transition-colors disabled:opacity-40 disabled:cursor-not-allowed`}
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
