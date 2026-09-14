import type { ReactNode } from "react";

type Props = {
  /** Légende au-dessus du titre : « Génération I · Kanto ». */
  eyebrow?: ReactNode;
  title: ReactNode;
  /** Sous-titre ou ligne d'infos. */
  intro?: ReactNode;
  /** Actions alignées à droite (boutons, chips). */
  actions?: ReactNode;
};

/** En-tête de page éditorial : légende, grand titre, sous-titre, actions à droite. */
export function PageHeader({ eyebrow, title, intro, actions }: Props) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
      <div className="min-w-0 space-y-2">
        {eyebrow && <p className="t-caption">{eyebrow}</p>}
        <h1 className="t-display">{title}</h1>
        {intro && <div className="max-w-2xl text-ink-2">{intro}</div>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

/** Titre de section avec compteur ou lien à droite. */
export function SectionHeader({ title, aside }: { title: ReactNode; aside?: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <h2 className="t-h2">{title}</h2>
      {aside && <div className="t-small text-ink-2">{aside}</div>}
    </div>
  );
}
