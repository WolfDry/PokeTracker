"use cache";

import { cacheLife, cacheTag } from "next/cache";
import { isFixedDamage, type LearnableMove, type MoveLearner, moveCategory } from "@/lib/moves";
import { prisma } from "@/lib/prisma";

const typeSelect = { select: { slug: true, nameFr: true } } as const;

const formSelect = { id: true, slug: true, isDefault: true, isBattleOnly: true, nameFr: true } as const;

type Member = {
  nameFr: string;
  self: boolean;
  /** Formes dont on lit les capacités, dans l'ordre : la forme, puis sa forme par défaut si elle n'a pas de données propres. */
  dataIds: number[];
};

/**
 * La forme puis ses évolutions précédentes, de la plus proche à la plus lointaine (Dracaufeu, Reptincel,
 * Salamèche). Une forme régionale remonte par la même forme régionale quand elle existe (Persian d'Alola ←
 * Miaouss d'Alola), sinon par la forme par défaut (Raichu d'Alola ← Pikachu).
 */
async function getLineage(pokemonId: number): Promise<Member[]> {
  const pokemon = await prisma.pokemon.findUnique({
    where: { id: pokemonId },
    select: {
      ...formSelect,
      species: { select: { slug: true, nameFr: true, evolvesFromSpeciesId: true, pokemons: { where: { isDefault: true }, select: { id: true } } } },
    },
  });
  if (!pokemon) return [];

  const defaultId = pokemon.species.pokemons[0]?.id;
  const lineage: Member[] = [
    {
      nameFr: pokemon.nameFr ?? pokemon.species.nameFr,
      self: true,
      dataIds: [pokemon.id, ...(defaultId !== undefined && defaultId !== pokemon.id ? [defaultId] : [])],
    },
  ];

  // « -alola », « -galar-standard »… : suffixe de la forme, cherché tel quel puis réduit à la région.
  const suffix = pokemon.slug.startsWith(`${pokemon.species.slug}-`) ? pokemon.slug.slice(pokemon.species.slug.length) : "";
  const suffixes = pokemon.isDefault || !suffix ? [] : [...new Set([suffix, `-${suffix.split("-")[1]}`])];

  let fromId = pokemon.species.evolvesFromSpeciesId;
  const seen = new Set<number>();
  while (fromId !== null && !seen.has(fromId)) {
    seen.add(fromId);
    const species = await prisma.species.findUnique({
      where: { id: fromId },
      select: { slug: true, nameFr: true, evolvesFromSpeciesId: true, pokemons: { where: { isBattleOnly: false }, select: formSelect } },
    });
    if (!species) break;
    const byDefault = species.pokemons.find((p) => p.isDefault);
    const regional = suffixes.map((s) => species.pokemons.find((p) => p.slug === `${species.slug}${s}`)).find((p) => p !== undefined);
    const form = regional ?? byDefault;
    if (form) {
      lineage.push({
        nameFr: form.nameFr ?? species.nameFr,
        self: false,
        dataIds: [form.id, ...(byDefault && byDefault.id !== form.id ? [byDefault.id] : [])],
      });
    }
    fromId = species.evolvesFromSpeciesId;
  }
  return lineage;
}

/**
 * Capacités offensives qu'une forme peut connaître dans un jeu : celles qu'elle apprend et celles de ses
 * évolutions précédentes (Dracaufeu garde ce qu'il a appris en Salamèche ou en Reptincel), une ligne par
 * capacité avec qui l'apprend et comment. Telles qu'elles étaient dans ce jeu : type, puissance et précision
 * d'avant les changements ultérieurs (Morsure Normal en 1re génération), catégorie selon le type avant la 4e.
 * Une forme sans données propres (Pikachu Cosplayeur…) apprend comme sa forme par défaut. Les plus puissantes
 * d'abord.
 */
export async function getLearnableMoves(versionSlug: string, pokemonId: number): Promise<LearnableMove[]> {
  cacheLife("max");
  cacheTag("reference");

  const [version, lineage] = await Promise.all([
    prisma.version.findUnique({
      where: { slug: versionSlug },
      select: { versionGroup: { select: { id: true, order: true, generationId: true } } },
    }),
    getLineage(pokemonId),
  ]);
  if (!version || lineage.length === 0) return [];
  const group = version.versionGroup;

  const rows = await prisma.pokemonMove.findMany({
    where: { pokemonId: { in: [...new Set(lineage.flatMap((m) => m.dataIds))] }, versionGroupId: group.id },
    select: {
      pokemonId: true,
      method: true,
      level: true,
      move: {
        select: {
          id: true,
          slug: true,
          nameFr: true,
          damageClass: true,
          power: true,
          accuracy: true,
          type: typeSelect,
          pastValues: {
            select: { power: true, accuracy: true, type: typeSelect, changedInVersionGroup: { select: { order: true } } },
          },
        },
      },
    },
  });
  const rowsByPokemon = new Map<number, typeof rows>();
  for (const row of rows) rowsByPokemon.set(row.pokemonId, [...(rowsByPokemon.get(row.pokemonId) ?? []), row]);

  // Lignée dans l'ordre : chaque capacité garde ses apprenants de la forme vers ses ancêtres.
  const byMove = new Map<number, { move: (typeof rows)[number]["move"]; learners: MoveLearner[] }>();
  for (const member of lineage) {
    const own = member.dataIds.map((id) => rowsByPokemon.get(id)).find((r) => r !== undefined) ?? [];
    for (const { method, level, move } of own) {
      const entry = byMove.get(move.id) ?? { move, learners: [] };
      entry.learners.push({ nameFr: member.nameFr, self: member.self, method, level });
      byMove.set(move.id, entry);
    }
  }

  return [...byMove.values()]
    .map(({ move, learners }): LearnableMove => {
      // Valeurs d'époque : pour chaque champ, le plus proche changement survenu après ce jeu.
      const later = move.pastValues
        .filter((p) => p.changedInVersionGroup.order > group.order)
        .sort((a, b) => a.changedInVersionGroup.order - b.changedInVersionGroup.order);
      const type = later.find((p) => p.type !== null)?.type ?? move.type;
      return {
        id: move.id,
        nameFr: move.nameFr,
        type,
        category: moveCategory(move.damageClass, type.slug, group.generationId),
        power: later.find((p) => p.power !== null)?.power ?? move.power,
        accuracy: later.find((p) => p.accuracy !== null)?.accuracy ?? move.accuracy,
        fixedDamage: isFixedDamage(move.slug),
        learners,
      };
    })
    .sort((a, b) => (b.power ?? 0) - (a.power ?? 0) || a.nameFr.localeCompare(b.nameFr, "fr"));
}
