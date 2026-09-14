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
