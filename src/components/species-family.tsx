"use client";

import { useMemo, useState } from "react";
import { EvolutionTree } from "@/components/evolution-tree";
import { StarIcon } from "@/components/icons";
import { SectionHeader } from "@/components/page-header";
import { PokemonSprite } from "@/components/pokemon-sprite";
import { StatsRadar, statsMax, statsTotal } from "@/components/stats-radar";
import { StatusBadge } from "@/components/status-badge";
import { TypeBadge } from "@/components/type-badge";
import { ghostButton, smallButton, spriteBox } from "@/components/ui";
import type { FamilyNode } from "@/lib/data/species";

type Props = {
  /** Racine de l'arbre d'évolution (premier stade). */
  root: FamilyNode;
  /** Espèce de la fiche : c'est elle qui est sélectionnée à l'ouverture. */
  speciesId: number;
};

const numberFr = new Intl.NumberFormat("fr-FR");

function flatten(node: FamilyNode): FamilyNode[] {
  return [node, ...node.children.flatMap(flatten)];
}

/**
 * En-tête « famille » de la fiche Pokémon : l'espèce de la fiche, ou la forme alternative cliquée dans l'arbre
 * d'évolution (sprite, identité, mesures, radar de stats). Les autres stades mènent à leur propre fiche.
 */
export function SpeciesFamily({ root, speciesId }: Props) {
  const nodes = useMemo(() => flatten(root), [root]);
  const initial = nodes.find((n) => n.kind === "species" && n.speciesId === speciesId) ?? root;
  const [selectedId, setSelectedId] = useState(initial.id);
  const [shiny, setShiny] = useState(false);
  const node = nodes.find((n) => n.id === selectedId) ?? initial;
  const max = useMemo(() => statsMax(nodes.map((n) => n.stats).filter((s) => s !== null)), [nodes]);

  const facts = [
    node.height !== null && { label: "Taille", value: `${(node.height / 10).toLocaleString("fr-FR")} m` },
    node.weight !== null && { label: "Poids", value: `${(node.weight / 10).toLocaleString("fr-FR")} kg` },
    node.captureRate !== null && { label: "Taux de capture", value: String(node.captureRate) },
  ].filter((f): f is { label: string; value: string } => Boolean(f));

  return (
    <>
      <header className="grid gap-6 sm:grid-cols-[224px_minmax(0,1fr)] sm:gap-x-10 lg:grid-cols-[224px_minmax(0,1fr)_300px]">
        <div className="flex flex-col gap-3">
          <span className={`${spriteBox} relative h-56 w-full rounded-lg sm:size-56`}>
            <PokemonSprite key={node.id} pokemonId={node.id} fallbackId={node.spriteFallbackId} alt={shiny ? `${node.nameFr} chromatique` : node.nameFr} size={192} shiny={shiny} />
            {shiny && <StarIcon size={16} className="absolute top-3 right-3 text-shiny" />}
          </span>
          <button type="button" onClick={() => setShiny((s) => !s)} aria-pressed={shiny} className={`${ghostButton} ${smallButton} self-start text-shiny hover:text-shiny`}>
            <StarIcon size={14} /> {shiny ? "Voir la version normale" : "Voir la version chromatique"}
          </button>
        </div>

        <div className="min-w-0 space-y-3">
          <p className="t-caption">
            N° {String(node.speciesId).padStart(4, "0")} · {node.generation.nameFr}
          </p>
          <h1 className="t-display">{node.nameFr}</h1>
          <p className="text-ink-2">
            {node.nameEn}
            {node.genusFr && ` · ${node.genusFr}`}
          </p>
          <div className="flex flex-wrap items-center gap-1.5">
            {node.types.map((type) => (
              <TypeBadge key={type.slug} type={type} size="md" />
            ))}
            {node.flags.map((flag) => (
              <StatusBadge key={flag}>{flag}</StatusBadge>
            ))}
          </div>
          {facts.length > 0 && (
            <dl className="flex flex-wrap gap-x-8 gap-y-2 pt-1">
              {facts.map((fact) => (
                <div key={fact.label}>
                  <dt className="t-caption">{fact.label}</dt>
                  <dd className="font-semibold">{fact.value}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>

        {node.stats && (
          <div className="flex flex-col items-center gap-1 rounded-lg border border-line bg-surface px-2 pt-4 pb-3 sm:col-span-2 sm:justify-self-center lg:col-span-1 lg:border-0 lg:bg-transparent lg:p-0">
            <StatsRadar stats={node.stats} max={max} size={240} className="mx-12" />
            <p className="t-caption">Base · total {numberFr.format(statsTotal(node.stats))}</p>
          </div>
        )}
      </header>

      {root.children.length > 0 && (
        <section className="space-y-4">
          <SectionHeader title="Ligne évolutive" />
          <EvolutionTree root={root} selectedId={node.id} onSelect={(n) => setSelectedId(n.id)} />
        </section>
      )}
    </>
  );
}
