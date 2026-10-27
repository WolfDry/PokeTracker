/** Slug du « jeu » National : le Pokédex National, toutes générations confondues. */
export const NATIONAL_SLUG = "national";

/** Jeu choisi sur l'accueil : une version de la série principale, ou le National. */
export type Game =
  | { kind: "national"; slug: typeof NATIONAL_SLUG; nameFr: string }
  | {
      kind: "version";
      id: number;
      slug: string;
      nameFr: string;
      generation: { id: number; nameFr: string };
      versionGroupSlug: string;
    };

export const NATIONAL_GAME: Game = { kind: "national", slug: NATIONAL_SLUG, nameFr: "National" };
