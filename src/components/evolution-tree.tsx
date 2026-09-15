"use client";

import Link from "next/link";
import { PokemonSprite } from "@/components/pokemon-sprite";
import { TypeBadge } from "@/components/type-badge";
import { spriteBox } from "@/components/ui";
import type { FamilyNode } from "@/lib/data/species";

type Props = {
  root: FamilyNode;
  /** Nœud affiché dans l'en-tête (forme sélectionnée ou espèce de la fiche). */
  selectedId: number;
  /** Une forme alternative n'a pas de fiche : la cliquer remplit l'en-tête. */
  onSelect: (node: FamilyNode) => void;
};

/**
 * Arbre d'évolution : chaque nœud est une carte reliée à son parent par un trait fin portant la condition.
 * Une espèce mène à sa fiche, une forme alternative remplit l'en-tête de la fiche courante.
 * Vertical sur mobile, horizontal dès `sm` (voir `.evo-elbow` dans globals.css).
 */
export function EvolutionTree({ root, selectedId, onSelect }: Props) {
  return (
    <div className="overflow-x-auto">
      <TreeNode node={root} selectedId={selectedId} onSelect={onSelect} />
    </div>
  );
}

function TreeNode({ node, selectedId, onSelect }: { node: FamilyNode } & Omit<Props, "root">) {
  const fork = node.children.length > 1;
  return (
    <div className="flex flex-col sm:flex-row sm:items-center">
      <NodeCard node={node} selected={node.id === selectedId} onSelect={onSelect} />
      {node.children.length > 0 && (
        <>
          {/* Tronc entre la carte et la fourche (desktop seulement : sur mobile la colonne part sous la carte). */}
          {fork && <span aria-hidden className="hidden h-px w-6 shrink-0 bg-line-strong sm:block" />}
          {/* Dès `sm`, une grille à deux colonnes : les traits d'une même colonne partagent la largeur du plus long libellé. */}
          <ul className="ml-10 flex flex-col sm:ml-0 sm:grid sm:grid-cols-[auto_minmax(0,1fr)] sm:gap-y-4">
            {node.children.map((child, index) => (
              <li key={child.id} className="flex sm:contents">
                <span
                  aria-hidden
                  className="evo-elbow"
                  data-first={index === 0 ? "" : undefined}
                  data-last={index === node.children.length - 1 ? "" : undefined}
                  data-single={fork ? undefined : ""}
                >
                  {child.condition && (
                    <span className="hidden max-w-[104px] px-1 pb-1.5 t-caption text-center text-ink-3 sm:block" style={{ textWrap: "balance" }}>
                      {child.condition}
                    </span>
                  )}
                </span>
                <div className="min-w-0 flex-1 pt-4 sm:pt-0">
                  {/* Sur mobile la condition se lit au-dessus de la carte. */}
                  <p className="mb-0.5 h-4 truncate pl-2 t-caption text-ink-3 sm:hidden">{child.condition}</p>
                  <TreeNode node={child} selectedId={selectedId} onSelect={onSelect} />
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

const nodeCard = (selected: boolean) =>
  `evo-card flex w-full shrink-0 items-center gap-2 rounded-lg border bg-surface p-1.5 text-left transition-colors sm:w-50 ${
    selected ? "border-ink ring-1 ring-ink ring-inset" : "border-line hover:border-line-strong"
  }`;

function NodeCard({ node, selected, onSelect }: { node: FamilyNode; selected: boolean; onSelect: (node: FamilyNode) => void }) {
  const content = (
    <>
      <span className={`${spriteBox} size-12 rounded-sm`}>
        <PokemonSprite pokemonId={node.id} fallbackId={node.spriteFallbackId} alt="" size={40} />
      </span>
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="t-caption leading-4">{node.caption}</span>
        <span className="leading-5 font-bold" style={{ textWrap: "balance" }}>
          {node.nameFr}
        </span>
        <span className="flex flex-wrap gap-1">
          {node.types.map((type) => (
            <TypeBadge key={type.slug} type={type} />
          ))}
        </span>
      </span>
    </>
  );
  if (node.kind === "form") {
    return (
      <button type="button" onClick={() => onSelect(node)} aria-pressed={selected} className={nodeCard(selected)}>
        {content}
      </button>
    );
  }
  if (selected) {
    return (
      <span aria-current="page" className={nodeCard(true)}>
        {content}
      </span>
    );
  }
  return (
    <Link href={`/pokemon/${node.speciesId}`} className={nodeCard(false)}>
      {content}
    </Link>
  );
}
