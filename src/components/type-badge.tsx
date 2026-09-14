import type { CSSProperties } from "react";

/** Badge de type : fond teinté, point plein, texte encre. La couleur vient de `--type-<slug>` (globals.css). */
export function TypeBadge({ type, size = "sm" }: { type: { slug: string; nameFr: string }; size?: "sm" | "md" }) {
  const style = { "--tc": `var(--type-${type.slug}, var(--type-unknown))` } as CSSProperties;
  return (
    <span className={`type-badge ${size === "sm" ? "type-badge-sm" : ""}`} style={style}>
      {type.nameFr}
    </span>
  );
}

/** Types en points colorés suivis de leurs noms en retrait : « ● ● Plante · Poison », pour les cartes où le sprite domine. */
export function TypeDots({ types }: { types: { slug: string; nameFr: string }[] }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      {types.map((type) => (
        <span
          key={type.slug}
          aria-hidden
          className="size-2.5 shrink-0 rounded-full"
          style={{ background: `var(--type-${type.slug}, var(--type-unknown))` }}
        />
      ))}
      <span className="ml-0.5 t-small text-ink-3">{types.map((t) => t.nameFr).join(" · ")}</span>
    </span>
  );
}
