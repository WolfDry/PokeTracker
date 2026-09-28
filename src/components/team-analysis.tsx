import { PokemonSprite } from "@/components/pokemon-sprite";
import { TypeBadge } from "@/components/type-badge";
import { card } from "@/components/ui";
import type { TeamBuilderData, TeamOption } from "@/lib/data/team";
import { analyzeDefense, analyzeOffense, formatFactor, teamWeaknesses } from "@/lib/team";

type Props = {
  data: Pick<TeamBuilderData, "types" | "chart" | "game">;
  team: (TeamOption | null)[];
};

/** Couleur d'une case du tableau défensif : rouge si le membre est faible, vert s'il résiste. */
function factorClass(factor: number | null) {
  if (factor === null || factor === 1) return "text-ink-3";
  if (factor > 1) return `text-danger ${factor > 2 ? "font-extrabold" : "font-bold"}`;
  return `text-success ${factor === 0 ? "font-extrabold" : "font-semibold"}`;
}

/** Faiblesses (tableau type × membre) et avantages (types touchés en super efficace) de l'équipe. */
export function TeamAnalysis({ data, team }: Props) {
  const members = team.flatMap((member, slot) => (member ? [{ member, slot }] : []));
  const defense = analyzeDefense(data, team);
  const offense = analyzeOffense(data, team);
  const weaknesses = teamWeaknesses(defense);
  const uncovered = offense.filter((r) => r.hitters.length === 0);

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
      <section className={`${card} overflow-hidden`} aria-labelledby="team-defense">
        <div className="space-y-3 border-b border-line p-4 sm:p-5">
          <div className="space-y-1">
            <h2 id="team-defense" className="t-h2">
              Faiblesses
            </h2>
            <p className="t-small text-ink-2">Dégâts reçus par chaque membre selon le type de l&apos;attaque.</p>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="mr-1 t-caption">Points faibles</span>
            {weaknesses.length === 0 ? (
              <span className="t-small text-ink-2">aucun, chaque faiblesse est compensée par une résistance.</span>
            ) : (
              weaknesses.map((r) => (
                <span key={r.type.slug} className="inline-flex items-center gap-1" title={`${r.weak} faible${r.weak > 1 ? "s" : ""}, ${r.resist} résiste${r.resist > 1 ? "nt" : ""}`}>
                  <TypeBadge type={r.type} />
                  <span className="t-small font-semibold text-danger">{r.weak}</span>
                </span>
              ))
            )}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-center">
            <thead>
              <tr className="border-b border-line">
                <th scope="col" className="py-2 pr-2 pl-4 text-left t-caption sm:pl-5">
                  Attaque
                </th>
                {members.map(({ member, slot }) => (
                  <th key={slot} scope="col" className="w-11 px-0.5 py-1.5">
                    <PokemonSprite pokemonId={member.pokemonId} fallbackId={member.speciesId} alt={member.nameFr} size={40} className="mx-auto size-9" />
                  </th>
                ))}
                <th scope="col" className="w-14 px-1 t-caption" title="Membres faibles">
                  Faib.
                </th>
                <th scope="col" className="w-14 pr-4 pl-1 t-caption sm:pr-5" title="Membres qui résistent ou sont immunisés">
                  Rés.
                </th>
              </tr>
            </thead>
            <tbody>
              {defense.map((row) => {
                const flagged = row.weak > row.resist;
                return (
                  <tr key={row.type.slug} className="border-b border-line last:border-b-0">
                    <th scope="row" className="py-1.5 pr-2 pl-4 text-left font-normal sm:pl-5">
                      <TypeBadge type={row.type} />
                    </th>
                    {members.map(({ slot }) => {
                      const factor = row.factors[slot];
                      return (
                        <td key={slot} className={`px-0.5 t-small ${factorClass(factor)}`}>
                          {factor === null ? "" : formatFactor(factor) || <span aria-label="×1">·</span>}
                        </td>
                      );
                    })}
                    <td className={`px-1 t-small ${flagged ? "font-bold text-danger" : row.weak > 0 ? "text-ink" : "text-ink-3"}`}>{row.weak}</td>
                    <td className={`pr-4 pl-1 t-small sm:pr-5 ${row.resist > 0 ? "text-ink" : "text-ink-3"}`}>{row.resist}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className={`${card} overflow-hidden`} aria-labelledby="team-offense">
        <div className="space-y-3 border-b border-line p-4 sm:p-5">
          <div className="space-y-1">
            <div className="flex items-baseline justify-between gap-3">
              <h2 id="team-offense" className="t-h2">
                Avantages
              </h2>
              <span className="t-small text-ink-2">
                {offense.length - uncovered.length}/{offense.length} types
              </span>
            </div>
            <p className="t-small text-ink-2">Types touchés en super efficace par une attaque du type d&apos;un membre.</p>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="mr-1 t-caption">Non couverts</span>
            {uncovered.length === 0 ? (
              <span className="t-small text-ink-2">aucun, tous les types sont couverts.</span>
            ) : (
              uncovered.map((r) => <TypeBadge key={r.type.slug} type={r.type} />)
            )}
          </div>
        </div>
        <ul>
          {offense.map((row) => (
            <li key={row.type.slug} className="flex min-h-11 items-center gap-3 border-b border-line px-4 py-1.5 last:border-b-0 sm:px-5">
              <span className="w-24 shrink-0">
                <TypeBadge type={row.type} />
              </span>
              {row.hitters.length === 0 ? (
                <span className="t-small text-ink-3">Aucun membre</span>
              ) : (
                <span className="flex flex-wrap items-center gap-1">
                  {row.hitters.map(({ slot, member, attack }) => (
                    <span key={slot} title={`${member.nameFr} · attaque ${attack.nameFr}`}>
                      <PokemonSprite pokemonId={member.pokemonId} fallbackId={member.speciesId} alt={`${member.nameFr} (${attack.nameFr})`} size={40} className="size-8" />
                    </span>
                  ))}
                </span>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
