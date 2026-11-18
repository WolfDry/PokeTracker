"use cache";

import { cacheLife, cacheTag } from "next/cache";
import { DLC_BASE_VERSION, humanizeSlug } from "@/lib/data/filters";
import { type CapturableForm, isCapturableForm } from "@/lib/forms";
import { prisma } from "@/lib/prisma";

/**
 * Formes à attraper de chaque espèce, hors forme par défaut : formes `Pokemon` (régionales, Motisma Lavage…)
 * puis leurs variantes d'apparence (motifs de Prismillon), dans l'ordre de la fiche Pokémon.
 */
export async function getCapturableForms(): Promise<Record<number, CapturableForm[]>> {
  cacheLife("max");
  cacheTag("reference");

  const [groups, pokemons] = await Promise.all([
    prisma.versionGroup.findMany({ select: { id: true, order: true } }),
    prisma.pokemon.findMany({
      where: { OR: [{ isDefault: false }, { cosmeticForms: { some: {} } }] },
      orderBy: { id: "asc" },
      select: {
        id: true,
        slug: true,
        speciesId: true,
        isDefault: true,
        isBattleOnly: true,
        introducedVersionGroupId: true,
        nameFr: true,
        formNameFr: true,
        species: { select: { nameFr: true } },
        cosmeticForms: {
          orderBy: { order: "asc" },
          select: { id: true, slug: true, nameFr: true, formNameFr: true, isBattleOnly: true, introducedVersionGroupId: true },
        },
      },
    }),
  ]);
  const groupOrder = new Map(groups.map((g) => [g.id, g.order]));
  const order = (groupId: number | null) => (groupId === null ? 0 : (groupOrder.get(groupId) ?? Infinity));

  const bySpecies: Record<number, CapturableForm[]> = {};
  for (const p of pokemons) {
    const forms: CapturableForm[] = [];
    const pokemonOk = p.isDefault || isCapturableForm(p.slug, p.isBattleOnly);
    if (!p.isDefault && pokemonOk) {
      forms.push({
        key: `p${p.id}`,
        speciesId: p.speciesId,
        pokemonId: p.id,
        spriteForm: null,
        nameFr: p.nameFr ?? `${p.species.nameFr} (${p.formNameFr ?? humanizeSlug(p.slug)})`,
        introducedOrder: order(p.introducedVersionGroupId),
      });
    }
    // Variantes d'une forme attrapable seulement (pas de motif sur une forme de combat).
    if (pokemonOk) {
      for (const v of p.cosmeticForms) {
        if (!isCapturableForm(v.slug, v.isBattleOnly)) continue;
        forms.push({
          key: `f${v.id}`,
          speciesId: p.speciesId,
          pokemonId: p.id,
          spriteForm: v.slug,
          nameFr: v.nameFr ?? `${p.nameFr ?? p.species.nameFr} (${v.formNameFr ?? humanizeSlug(v.slug)})`,
          introducedOrder: Math.max(order(v.introducedVersionGroupId), order(p.introducedVersionGroupId)),
        });
      }
    }
    if (forms.length > 0) bySpecies[p.speciesId] = [...(bySpecies[p.speciesId] ?? []), ...forms];
  }
  return bySpecies;
}

/**
 * Rang de groupe de versions jusqu'où les formes sont sorties, par jeu : celui du jeu, ou celui de ses extensions
 * quand il en a (Ramoloss de Galar arrive avec Isolarmure, suivi avec Épée).
 */
export async function getVersionFormOrders(): Promise<Record<number, number>> {
  cacheLife("max");
  cacheTag("reference");

  const versions = await prisma.version.findMany({ select: { id: true, slug: true, versionGroup: { select: { order: true } } } });
  const orderBySlug = new Map(versions.map((v) => [v.slug, v.versionGroup.order]));
  const orders: Record<number, number> = {};
  for (const v of versions) {
    const dlcOrders = Object.entries(DLC_BASE_VERSION)
      .filter(([, base]) => base === v.slug)
      .map(([dlc]) => orderBySlug.get(dlc) ?? 0);
    orders[v.id] = Math.max(v.versionGroup.order, ...dlcOrders);
  }
  return orders;
}
