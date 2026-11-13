import type { Metadata } from "next";
import Link from "next/link";
import { type ComponentType, type ReactNode, Suspense } from "react";
import { HuntSummaryRow } from "@/components/hunt-counter";
import { ArrowRightIcon, BallIcon, PlusIcon, StarIcon, TeamIcon } from "@/components/icons";
import { PokemonSprite } from "@/components/pokemon-sprite";
import { type DexProgress, getDexProgress, getNationalCaptures, getRecentCaptures, type RecentCapture } from "@/lib/data/captures";
import { getGame, getNationalSpeciesCount } from "@/lib/data/games";
import { getPokedexBySlug, getPokemonSpecies, getVersionPokedexes } from "@/lib/data/pokedex";
import { getGameHunts, getHunts, getRecentShinies, getShinySpeciesIds } from "@/lib/data/shiny";
import { getTeams } from "@/lib/data/teams";
import type { Game } from "@/lib/game";
import { requireUser } from "@/lib/session";
import { newHuntHref } from "@/lib/shiny";
import { teamPokemonIds } from "@/lib/team";

export async function generateMetadata({ params }: PageProps<"/jeu/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const game = await getGame(slug);
  return { title: game ? game.nameFr : "Jeu introuvable" };
}

/** Dernières captures et derniers shinies montrés, shasses listées avant le renvoi vers le shiny dex. */
const RECENT_COUNT = 4;
const HUNT_COUNT = 4;

// Tuiles du résumé (DA « Pokédex ») : coins 24 px (22 sur mobile), bordure fine, renforcée au survol si la tuile est un lien.
const tile = "rounded-[22px] border border-line bg-surface p-5 sm:rounded-3xl sm:p-6";
const tileLink = `${tile} group transition-colors hover:border-line-strong`;
const arrowCircle = "grid size-9 shrink-0 place-items-center rounded-full bg-surface-2 text-ink transition-colors group-hover:bg-line";

/**
 * Résumé du jeu en tuiles de tailles inégales (le jeu est vérifié par le layout) : à gauche le living dex
 * (grande tuile) et l'équipe (large et basse), à droite les shasses en cours et les derniers shinies.
 * Les Pokémon sont montrés par leur sprite, sans nom. Le cadre est statique, le contenu lit la session en streaming.
 */
export default async function GamePage({ params }: PageProps<"/jeu/[slug]">) {
  const { slug } = await params;
  const game = await getGame(slug);
  if (!game) return null;
  const national = game.kind === "national";
  const mainDex = national ? "National" : ((await getVersionPokedexes(game.id))[0]?.nameFr ?? "National");

  return (
    <div className="flex flex-wrap gap-4 sm:gap-5">
      <div className="flex min-w-0 flex-[2_1_560px] flex-col gap-4 sm:gap-5">
        <Link href={`/jeu/${slug}/captures`} className={`${tileLink} flex flex-col gap-5`}>
          <TileHeader icon={BallIcon} title={`Living dex · ${mainDex}`} />
          <Suspense fallback={<Skeleton className="h-[164px] rounded-md" />}>
            <LivingDexSummary game={game} />
          </Suspense>
        </Link>
        {game.kind !== "national" && (
          <Suspense fallback={<Skeleton className="h-[188px] rounded-[22px] sm:rounded-3xl" />}>
            <TeamTile slug={slug} versionId={game.id} />
          </Suspense>
        )}
      </div>

      <section aria-labelledby="resume-shasses" className={`${tile} flex min-w-0 flex-[1_1_300px] flex-col gap-[18px]`}>
        <div className="flex items-center justify-between gap-3">
          <h2 id="resume-shasses" className="flex items-center gap-2 t-caption font-bold">
            <StarIcon size={16} className="fill-shiny text-shiny" />
            Shasses en cours
          </h2>
          {/* Cercle de 36 px, zone cliquable élargie à 44 px. */}
          <Link href={`/jeu/${slug}/shiny`} aria-label="Ouvrir le shiny dex" className={`${arrowCircle} relative after:absolute after:-inset-1 hover:bg-line`}>
            <ArrowRightIcon />
          </Link>
        </div>
        <Suspense fallback={<Skeleton className="h-[280px] rounded-md" />}>
          <HuntsSummary game={game} />
        </Suspense>
      </section>
    </div>
  );
}

function TileHeader({ icon: Icon, title, aside }: { icon: ComponentType<{ size?: number }>; title: string; aside?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="flex min-w-0 items-center gap-2 t-caption font-bold">
        <Icon size={16} />
        {title}
      </span>
      <span className="flex min-w-0 items-center gap-3">
        {aside}
        <span aria-hidden className={arrowCircle}>
          <ArrowRightIcon />
        </span>
      </span>
    </div>
  );
}

/** Living dex : le Pokédex principal en grand (le National tous jeux confondus), les autres en une ligne, et les dernières captures. */
async function LivingDexSummary({ game }: { game: Game }) {
  const user = await requireUser(`/jeu/${game.slug}`);
  if (game.kind === "national") {
    const [{ speciesIds }, total, recent] = await Promise.all([
      getNationalCaptures(user.id),
      getNationalSpeciesCount(),
      getRecentCaptures(user.id, null, RECENT_COUNT),
    ]);
    return <LivingDexBody main={{ id: 0, slug: "national", nameFr: "National", caught: speciesIds.length, total }} others={[]} recent={recent} />;
  }
  const [dexes, recent, forms] = await Promise.all([getDexProgress(user.id, game.id), getRecentCaptures(user.id, game.id, RECENT_COUNT), getGameForms(game.id)]);
  const [main, ...others] = dexes;
  if (!main) return null;
  // Sprite de l'espèce telle qu'on la rencontre dans le jeu (forme régionale s'il y en a une).
  return <LivingDexBody main={main} others={others} recent={recent.map((c) => ({ ...c, pokemonId: forms.get(c.speciesId) ?? c.pokemonId }))} />;
}

/** Forme de chaque espèce dans les Pokédex du jeu : la forme régionale (Axoloto de Paldea dans Écarlate), sinon celle par défaut. */
async function getGameForms(versionId: number) {
  const pokedexes = await Promise.all((await getVersionPokedexes(versionId)).map((dex) => getPokedexBySlug(dex.slug)));
  const forms = new Map<number, number>();
  for (const pokedex of pokedexes) {
    for (const { species } of pokedex?.entries ?? []) if (!forms.has(species.id)) forms.set(species.id, species.pokemonId);
  }
  return forms;
}

function LivingDexBody({ main, others, recent }: { main: DexProgress; others: DexProgress[]; recent: RecentCapture[] }) {
  const percent = main.total > 0 ? Math.round((main.caught / main.total) * 100) : 0;
  const complete = main.total > 0 && main.caught === main.total;
  return (
    <div className="flex flex-wrap items-end gap-x-8 gap-y-5">
      <div className="flex min-w-0 flex-[1_1_220px] flex-col gap-3">
        <p className="flex items-baseline gap-2 font-mono font-bold">
          <span className="text-[56px] leading-[56px] tracking-[-0.05em] sm:text-[72px] sm:leading-[72px]">{main.caught}</span>
          <span className="text-[22px] text-ink-2">/ {main.total}</span>
        </p>
        <div
          role="progressbar"
          aria-label={`Pokédex ${main.nameFr}`}
          aria-valuenow={main.caught}
          aria-valuemin={0}
          aria-valuemax={main.total}
          className="h-1.5 overflow-hidden rounded-full bg-surface-2"
        >
          <div className={`h-full rounded-full ${complete ? "bg-success" : "bg-game"}`} style={{ width: `${percent}%` }} />
        </div>
        {others.length > 0 && (
          <p className="t-small text-ink-2">
            {others.map((dex, i) => (
              <span key={dex.id}>
                {i > 0 && " · "}
                {dex.nameFr} <b className="font-semibold text-ink">{dex.caught}</b>/{dex.total}
              </span>
            ))}
          </p>
        )}
      </div>
      <div className="min-w-0 flex-[1_1_300px] rounded-[12px_12px_12px_28px] pokedex-screen px-3.5 pt-2.5 pb-1.5">
        <p className="t-lcd tracking-[0.12em] text-game-text">DERNIÈRES CAPTURES</p>
        {recent.length > 0 ? (
          <ul className="grid grid-cols-4">
            {recent.map((capture) => (
              <li key={capture.speciesId} className="grid place-items-center">
                {/* Living dex seulement : toujours le sprite normal, même si l'espèce est aussi obtenue en shiny. */}
                <PokemonSprite pokemonId={capture.pokemonId} alt={capture.nameFr} size={96} className="aspect-square w-full max-w-[76px] object-contain" />
              </li>
            ))}
          </ul>
        ) : (
          <p className="py-5 t-small text-ink-2">Coche tes premières captures dans le living dex.</p>
        )}
      </div>
    </div>
  );
}

/** Équipe : la dernière modifiée en sprites (shiny si l'espèce est obtenue en shiny dans ce jeu), et le nombre d'équipes. */
async function TeamTile({ slug, versionId }: { slug: string; versionId: number }) {
  const user = await requireUser(`/jeu/${slug}`);
  const [teams, shinySpecies] = await Promise.all([getTeams(user.id, versionId), getShinySpeciesIds(user.id, versionId)]);
  const [last] = teams;
  const ids = last ? teamPokemonIds(last.slots) : [];
  const members = ids.filter((id) => id !== null).sort((a, b) => a - b);
  const speciesOf = new Map(members.length > 0 ? await getPokemonSpecies(members) : []);
  const shiny = new Set(shinySpecies);

  return (
    <Link href={`/jeu/${slug}/equipe`} className={`${tileLink} flex flex-col gap-3`}>
      <TileHeader
        icon={TeamIcon}
        title="Équipe"
        aside={
          last && (
            <span className="min-w-0 truncate text-sm">
              <b className="font-semibold">{last.name}</b>
              <span className="text-ink-2">
                {" "}
                · {teams.length} équipe{teams.length > 1 ? "s" : ""}
              </span>
            </span>
          )
        }
      />
      {last ? (
        <span className="grid grid-cols-6 gap-2">
          {ids.map((id, slot) =>
            id ? (
              <PokemonSprite
                key={slot}
                pokemonId={id}
                shiny={shiny.has(speciesOf.get(id) ?? -1)}
                alt=""
                size={112}
                className="aspect-square w-full object-contain"
              />
            ) : (
              <span key={slot} aria-hidden className="m-[18%] aspect-square rounded-full border-[1.5px] border-dashed border-line" />
            ),
          )}
        </span>
      ) : (
        <p className="t-small text-ink-2">Aucune équipe sauvegardée : compose tes équipes de six et sauvegarde-les.</p>
      )}
    </Link>
  );
}

/** Shasses en cours (toutes pour le National) avec leur compteur, puis les derniers shinies et l'avancement du shiny dex. */
async function HuntsSummary({ game }: { game: Game }) {
  const user = await requireUser(`/jeu/${game.slug}`);
  const national = game.kind === "national";
  const [hunts, recent, progress] = await Promise.all([
    national ? getHunts(user.id, "ACTIVE") : getGameHunts(user.id, game.id),
    getRecentShinies(user.id, national ? null : game.id, RECENT_COUNT),
    getShinyProgress(user.id, game),
  ]);
  const hidden = hunts.length - HUNT_COUNT;

  return (
    <>
      {hunts.length > 0 ? (
        <ul className="flex flex-col gap-3.5">
          {hunts.slice(0, HUNT_COUNT).map((hunt) => (
            <HuntSummaryRow key={hunt.id} hunt={hunt} />
          ))}
        </ul>
      ) : (
        <p className="t-small text-ink-2">Aucune shasse en cours.</p>
      )}
      {hidden > 0 && (
        <Link href={`/jeu/${game.slug}/shiny`} className="t-small font-semibold text-game-text hover:text-ink">
          Et {hidden} autre{hidden > 1 ? "s" : ""} shasse{hidden > 1 ? "s" : ""}
        </Link>
      )}
      <Link href={newHuntHref(game.slug)} className="inline-flex items-center gap-2 self-start text-sm font-semibold text-ink hover:text-game-text">
        <PlusIcon size={16} />
        Nouvelle shasse
      </Link>
      <div className="flex-1" />
      <div className="flex flex-col gap-2.5 border-t border-line pt-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="t-caption font-bold">Derniers shiny</h3>
          <span className="font-mono text-[13px] text-ink-2">
            <b className="text-ink">{progress.caught}</b> / {progress.total}
          </span>
        </div>
        {recent.length > 0 ? (
          <ul className="grid grid-cols-4 gap-2">
            {recent.map((shiny) => (
              <li key={shiny.id}>
                <PokemonSprite
                  pokemonId={shiny.species.pokemonId}
                  shiny
                  alt={`${shiny.species.nameFr} shiny`}
                  size={96}
                  className="aspect-square w-full rounded-[14px] bg-surface-2 object-contain"
                />
              </li>
            ))}
          </ul>
        ) : (
          <p className="t-small text-ink-2">{"Aucun shiny obtenu pour l'instant."}</p>
        )}
      </div>
    </>
  );
}

/** Shiny dex : espèces du Pokédex principal du jeu obtenues en shiny, ou tout le National. */
async function getShinyProgress(userId: string, game: Game) {
  if (game.kind === "national") {
    const [speciesIds, total] = await Promise.all([getShinySpeciesIds(userId, null), getNationalSpeciesCount()]);
    return { caught: speciesIds.length, total };
  }
  const [speciesIds, pokedexes] = await Promise.all([getShinySpeciesIds(userId, game.id), getVersionPokedexes(game.id)]);
  const obtained = new Set(speciesIds);
  const main = pokedexes[0]?.speciesIds ?? [];
  return { caught: main.filter((id) => obtained.has(id)).length, total: main.length };
}

function Skeleton({ className }: { className: string }) {
  return <div aria-hidden className={`animate-pulse bg-surface-2 ${className}`} />;
}
