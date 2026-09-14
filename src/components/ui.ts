// Classes Tailwind partagées du design system (docs/design-system.md).
// Une seule source pour les boutons, chips, champs et cartes : les pages composent, elles ne redéfinissent pas.

const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-md text-sm font-semibold whitespace-nowrap transition-colors disabled:pointer-events-none disabled:opacity-40";

/** Action principale : encre pleine. */
export const primaryButton = `${buttonBase} h-10 px-4 bg-ink text-on-ink hover:opacity-90`;
/** Action secondaire : bordure forte sur surface. */
export const secondaryButton = `${buttonBase} h-10 px-4 border border-line-strong bg-surface text-ink hover:bg-surface-2`;
/** Action discrète, sans cadre. */
export const ghostButton = `${buttonBase} h-10 px-3 text-ink-2 hover:bg-surface-2 hover:text-ink`;
/** Suppression : rouge sur bordure fine. */
export const dangerButton = `${buttonBase} h-10 px-4 border border-line text-danger hover:bg-surface-2`;
/** Variante compacte à combiner : `${secondaryButton} ${smallButton}`. */
export const smallButton = "h-8 px-3 text-[13px] rounded-sm";
/** Variante large (clôture de chasse, formulaires) : `${primaryButton} ${largeButton}`. */
export const largeButton = "h-12 px-6 text-[15px] rounded-[14px]";

/** Chip de filtre ; sélectionnée = encre pleine. */
export const chip = (active: boolean) =>
  `inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[13px] font-medium whitespace-nowrap transition-colors ${
    active ? "border-ink bg-ink text-on-ink" : "border-line bg-surface text-ink-2 hover:border-line-strong hover:text-ink"
  }`;
/** Compteur dans une chip : `<span className={chipCount(active)}>151</span>`. */
export const chipCount = (active: boolean) => (active ? "text-on-ink/70" : "text-ink-3");

/** Champ texte / select / textarea. */
export const input =
  "w-full rounded-md border border-line-strong bg-surface px-3 text-[15px] text-ink placeholder:text-ink-3 field-focus disabled:opacity-60";
export const inputHeight = "h-10";
export const inputError = "border-danger";
export const fieldLabel = "block t-small font-semibold";
export const fieldHint = "t-small text-ink-2";
export const fieldError = "t-small text-danger";

/** Carte : surface bordée, coins 16 px. */
export const card = "rounded-lg border border-line bg-surface";
/** Carte-lien : la bordure se renforce au survol. */
export const cardLink = `${card} transition-colors hover:border-line-strong`;

/** Lien texte dans un paragraphe. */
export const textLink = "underline decoration-line-strong underline-offset-[3px] hover:text-ink hover:decoration-ink";

/** Boîte de sprite : fond Surface 2, sprite centré. */
export const spriteBox = "grid shrink-0 place-items-center rounded-md bg-surface-2";

/** Message vide / note d'information dans une carte. */
export const notice = `${card} px-4 py-3 text-ink-2`;

/** Case ronde « attrapé ». */
export const checkCircle = (checked: boolean) =>
  `grid size-6 shrink-0 place-items-center rounded-full transition-colors ${
    checked ? "bg-ink text-on-ink" : "border-[1.5px] border-line-strong text-transparent hover:border-ink hover:text-ink-3"
  }`;

/** Numéro de Pokédex : « 001 » en retrait. */
export const dexNumber = (n: number, digits = 3) => String(n).padStart(digits, "0");
