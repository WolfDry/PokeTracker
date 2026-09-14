# Design system PokeTracker

> « Une collection, pas un tableau de bord. »
> Encre chaude sur papier, une seule famille typographique, la couleur réservée aux sprites et aux types. L'interface s'efface pour laisser la place aux Pokémon.

Canvas visuel (fondations, composants, écrans) : https://claude.ai/code/artifact/dae487c0-1d9e-4242-8ab7-1427313482f6
Implémentation : tokens dans [`src/app/globals.css`](../src/app/globals.css), classes partagées dans [`src/components/ui.ts`](../src/components/ui.ts), icônes dans [`src/components/icons.tsx`](../src/components/icons.tsx).

## Principes

1. **Le sprite est la vedette.** Toujours dans une boîte Surface 2 (`spriteBox`), jamais étiré (rendu Pokémon HOME ou illustration officielle, WebP 256×256). L'interface autour reste neutre pour qu'il soit la seule couleur.
2. **Lignes plutôt qu'ombres.** Séparateurs fins, cartes bordées. L'ombre (`shadow-float`) est réservée aux menus et surcouches qui flottent réellement (suggestions du sélecteur de Pokémon).
3. **Un seul accent : l'encre.** L'action principale est un bouton encre plein. Le vert, le rouge et l'or ne sont que des signaux (attrapé, supprimer, shiny), jamais des décorations.
4. **Peu de composants, tous déclinés en clair et en sombre** par les mêmes variables : aucun composant ne doit connaître le thème.

## Couleurs

Neutres teintés (teinte oklch 85, chroma ≤ 0.01). Tailwind : `bg-page`, `bg-surface`, `bg-surface-2`, `border-line`, `border-line-strong`, `text-ink`, `text-ink-2`, `text-ink-3`, `text-on-ink`, `text-success`, `text-danger`, `text-shiny`. Les couleurs Tailwind par défaut sont désactivées (`--color-*: initial`) : tout passe par ces tokens.

| Token | Clair | Sombre | Usage |
| --- | --- | --- | --- |
| `--bg` (`page`) | `oklch(0.975 0.004 85)` | `oklch(0.165 0.006 85)` | fond des pages |
| `--surface` | `oklch(1 0 0)` | `oklch(0.205 0.006 85)` | cartes, en-tête, champs |
| `--surface-2` | `oklch(0.955 0.005 85)` | `oklch(0.245 0.007 85)` | survol, boîtes de sprite, squelettes, section active de la nav |
| `--line` | `oklch(0.905 0.006 85)` | `oklch(0.285 0.008 85)` | séparateurs, bordures de cartes |
| `--line-strong` | `oklch(0.80 0.008 85)` | `oklch(0.38 0.01 85)` | bordures de champs et de boutons secondaires |
| `--ink` | `oklch(0.20 0.008 85)` | `oklch(0.95 0.005 85)` | texte, boutons primaires, chips actives, barre de progression |
| `--ink-2` | `oklch(0.46 0.01 85)` | `oklch(0.70 0.01 85)` | texte secondaire |
| `--ink-3` | `oklch(0.64 0.01 85)` | `oklch(0.52 0.01 85)` | légendes, numéros de Pokédex, désactivé |
| `--on-ink` | = `--bg` | = `--bg` | texte sur encre |
| `--success` | `oklch(0.60 0.12 150)` | idem | Pokédex complet, badge « Rencontres » |
| `--danger` | `oklch(0.58 0.17 25)` | idem | suppression, erreurs de formulaire |
| `--shiny` | `oklch(0.62 0.13 85)` | `oklch(0.76 0.13 85)` | l'étoile shiny, et elle seule |

### Types Pokémon

Les 18 teintes canoniques ramenées à la même clarté et au même chroma : `--type-<slug>: oklch(0.72 0.10 <teinte>)` (teintes dans `globals.css`). Le badge (`type-badge`) = fond teinté à 18 % sur Surface + point plein + texte encre. La couleur du type n'est jamais utilisée ailleurs.

### Thème

Clair par défaut, sombre selon `prefers-color-scheme`, choix explicite via `<html data-theme="light|dark">` (bascule `ThemeToggle`, mémorisée dans `localStorage`, réappliquée avant le premier rendu par `themeBootScript`). Variante Tailwind `dark:` disponible mais à éviter : les tokens suffisent.

## Typographie

Manrope (Google Fonts, `--font-manrope`), une seule famille. Chiffres tabulaires partout (`font-variant-numeric: tabular-nums` sur `body`). Corps 15 px / 24 px.

| Utilitaire | Taille / interligne | Graisse | Usage |
| --- | --- | --- | --- |
| `t-display` | 34/38 (40/44 dès `sm`) | 800, -0.02em | titre de page (`PageHeader`) |
| `t-h1` | 28/34 | 700, -0.015em | titre secondaire, gros chiffres de carte |
| `t-h2` | 20/28 | 600, -0.01em | titre de section (`SectionHeader`) |
| corps | 15/24 | 400 | texte |
| `t-small` | 13/20 | 400 | métadonnées, listes denses, aide |
| `t-caption` | 12/16 | 600, +0.06em, capitales, `ink-2` | légende au-dessus d'un titre, en-têtes de tableau, étiquettes |
| `t-counter` | 72 (96 dès `sm`) | 800, -0.04em | le compteur de chasse : le seul chiffre héroïque |

## Espacements, rayons, tailles

- Échelle 4 px : `4 · 8 · 12 · 16 · 24 · 32 · 48 · 64`. Sections espacées de 32–48 px (`space-y-8` / `space-y-10`), cartes en grille avec `gap-3`.
- Marges de page : 20 px sur mobile, 40 px dès `sm` ; largeur max 72 rem (`max-w-6xl`).
- Rayons : `rounded-sm` 8 px (chips carrées, petits boutons, boîtes de sprite compactes), `rounded-md` 12 px (contrôles, boîtes de sprite), `rounded-lg` 16 px (cartes), `rounded-full` (chips, badges, cases rondes).
- Contrôles : 40 px de haut (`h-10`), 48 px en version large, 32 px en compact ; chips 32 px ; cibles tactiles ≥ 44 px (les cases « attrapé » sont enveloppées dans un bouton 44 px).
- Focus : anneau encre 2 px décalé (`:focus-visible` global) ; champs : bordure encre + halo doux (`field-focus`).

## Composants (`src/components/ui.ts`)

| Export | Rôle |
| --- | --- |
| `primaryButton` | action principale, encre pleine |
| `secondaryButton` | bordure forte sur Surface |
| `ghostButton` | discret, sans cadre (icônes de l'en-tête, actions tertiaires) |
| `dangerButton` | rouge sur bordure fine, pour supprimer |
| `smallButton`, `largeButton` | modificateurs de taille à combiner |
| `chip(active)`, `chipCount(active)` | filtres et onglets ; active = encre pleine, compteur en retrait |
| `input`, `inputHeight`, `inputError`, `fieldLabel`, `fieldHint`, `fieldError` | champs de formulaire |
| `card`, `cardLink` | surface bordée 16 px ; `cardLink` renforce la bordure au survol |
| `notice` | message vide ou note d'information dans une carte |
| `textLink` | lien dans un paragraphe (souligné ligne forte → encre au survol) |
| `spriteBox` | boîte Surface 2 centrée pour un sprite |
| `checkCircle(checked)` | case ronde « attrapé » (encre pleine cochée, cercle vide sinon) |
| `dexNumber(n, digits)` | « 001 » |

Composants React de structure : `PageHeader` (légende, titre display, intro, actions), `SectionHeader`, `Breadcrumb`, `StatusBadge` (tons `neutral | success | shiny | danger`), `TypeBadge`, `TypeDots` (points de type + noms en retrait, sous un sprite dominant), `ProgressBar`, `ThemeToggle`, `MobileTabBar`.

### Page Pokédex (`PokedexExplorer`)

Cartes « affiche » : le sprite (160 px, 112 sur mobile) au centre d'une carte bordée, le numéro en filigrane Surface 2 en haut à gauche, la case « attrapé » en haut à droite (cible 44 px), nom en gras puis `TypeDots`. Barre d'outils collante sous l'en-tête (`sm+`) : recherche, sélecteurs Jeu et Pokédex (s'il y en a plusieurs) habillés en chip avec leur étiquette `t-caption`, Tous / Attrapés / Manquants, sélecteur Type. Sur mobile : recherche + bouton « Filtres » (pastille = filtres actifs) qui ouvre un panneau `shadow-float` par-dessus la grille, rangé par sections (Jeu · Pokédex · Statut · Type), pied « Réinitialiser / Voir N Pokémon ».

## Navigation

- Desktop (`sm+`) : en-tête collant 64 px — logo, sections (`NavLinks`), recherche, bascule de thème, compte.
- Mobile : en-tête réduit (logo, recherche, thème, compte) + barre d'onglets fixée en bas (`MobileTabBar`, icônes Pokédex / Rencontres / Captures / Shiny). Le `<main>` réserve `pb-28` pour ne rien cacher.

## Icônes

Inline SVG, trait 1.75, grille 20 (24 pour l'icône Pokédex), `currentColor`. Pas d'emoji dans l'interface : l'étoile shiny remplace ✨, la coche SVG remplace ✓, les chevrons remplacent ▸/▾.

## Écrire une nouvelle page

```tsx
<div className="space-y-8">
  <Breadcrumb items={[{ href: "/pokedex", label: "Pokédex" }, { label: version.nameFr }]} />
  <PageHeader eyebrow="Génération I" title="Pokémon Rouge" intro="…" actions={<Link className={secondaryButton}>…</Link>} />
  <section className="space-y-4">
    <SectionHeader title="Formes" aside="3" />
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">…</ul>
  </section>
</div>
```

À ne pas faire : couleurs codées en dur, `dark:` pour compenser un token manquant, ombres sur des cartes, emoji, un second accent.
