"use client";

import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { CheckIcon, CloseIcon, LinkIcon, PlusIcon } from "@/components/icons";
import { PageHeader } from "@/components/page-header";
import { PokemonSprite } from "@/components/pokemon-sprite";
import { TeamAnalysis } from "@/components/team-analysis";
import { TeamMovePicker } from "@/components/team-move-picker";
import { TeamPicker } from "@/components/team-picker";
import { TeamSuggestions } from "@/components/team-suggestions";
import { ToolbarSelect } from "@/components/toolbar-select";
import { TypeBadge } from "@/components/type-badge";
import { cardLink, ghostButton, notice, smallButton } from "@/components/ui";
import type { TeamBuilderData } from "@/lib/data/team";
import { MAX_MOVES, type TeamMove } from "@/lib/moves";
import { encodeTeam, TEAM_SIZE, type TeamMember } from "@/lib/team";

export type TeamGameGroup = { id: number; nameFr: string; versions: { slug: string; nameFr: string }[] };

/** Un emplacement : la forme et ses capacités choisies, ou `null` s'il est vide. */
export type TeamSlot = { pokemonId: number; moves: TeamMove[] } | null;

type Props = {
  data: TeamBuilderData;
  /** Jeux proposés dans le sélecteur, par génération. */
  games: TeamGameGroup[];
  /** Formes et capacités par emplacement, lues dans l'URL (`?equipe=6.53.394-0-25`). */
  initialTeam: TeamSlot[];
};

const teamHref = (gameSlug: string, team: TeamSlot[]) => {
  const encoded = encodeTeam(team.map((slot) => slot && { pokemonId: slot.pokemonId, moveIds: slot.moves.map((m) => m.id) }));
  return `/equipe?jeu=${gameSlug}${encoded ? `&equipe=${encoded}` : ""}`;
};

/** Six emplacements à remplir avec les Pokémon du jeu et leurs attaques, puis l'analyse des types de l'équipe. L'équipe vit dans l'URL. */
export function TeamBuilder({ data, games, initialTeam }: Props) {
  const router = useRouter();
  const [team, setTeam] = useState(initialTeam);
  const [picking, setPicking] = useState<number | null>(null);
  const [editingMoves, setEditingMoves] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const byId = useMemo(() => new Map(data.options.map((o) => [o.pokemonId, o])), [data.options]);
  const members = team.map((slot): TeamMember | null => {
    const option = slot && byId.get(slot.pokemonId);
    return option ? { ...option, moves: slot.moves } : null;
  });
  const count = members.filter(Boolean).length;

  // L'URL suit l'équipe (lien partageable, retour arrière conservé) sans recharger la page.
  const update = (next: TeamSlot[]) => {
    setTeam(next);
    window.history.replaceState(null, "", teamHref(data.game.slug, next));
  };
  // Changer de Pokémon vide ses attaques : elles dépendent de ce qu'il peut apprendre.
  const setSlot = (slot: number, pokemonId: number | null) =>
    update(team.map((current, i) => (i !== slot ? current : pokemonId === null ? null : { pokemonId, moves: current?.pokemonId === pokemonId ? current.moves : [] })));
  const setMoves = (slot: number, moves: TeamMove[]) => update(team.map((current, i) => (i === slot && current ? { ...current, moves } : current)));

  const copyLink = async () => {
    try {
      // L'URL de l'équipe affichée : celle de la barre d'adresse peut encore citer des Pokémon absents du jeu.
      await navigator.clipboard.writeText(new URL(teamHref(data.game.slug, team), window.location.origin).href);
      setCopied(true);
      clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      // Presse-papiers refusé (contexte non sécurisé) : l'URL de la barre d'adresse reste utilisable.
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={`${data.game.generation.nameFr} · ${data.game.region}`}
        title="Équipe"
        intro={
          <p className="t-small">
            {data.options.length} Pokémon disponibles dans {data.game.nameFr}. Clique sur un emplacement pour choisir un Pokémon, puis ses attaques.
          </p>
        }
        actions={
          <ToolbarSelect
            label="Jeu"
            value={data.game.slug}
            // Changer de jeu recharge la liste et la table des types ; l'équipe suit si ses Pokémon y sont.
            onChange={(slug) => router.push(teamHref(slug, team))}
            options={[]}
            groups={games.map((g) => ({ label: g.nameFr, options: g.versions.map((v) => ({ value: v.slug, label: v.nameFr })) }))}
          />
        }
      />

      <section className="space-y-3" aria-labelledby="team-slots">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="team-slots" className="t-caption">
            {count}/{TEAM_SIZE} Pokémon
          </h2>
          <div className="flex items-center gap-1">
            <button type="button" onClick={copyLink} disabled={count === 0} className={`${ghostButton} ${smallButton}`}>
              {copied ? <CheckIcon /> : <LinkIcon size={14} />}
              {copied ? "Lien copié" : "Copier le lien"}
            </button>
            <button type="button" onClick={() => update(team.map(() => null))} disabled={count === 0} className={`${ghostButton} ${smallButton}`}>
              Vider l&apos;équipe
            </button>
          </div>
        </div>
        <ol className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {members.map((member, slot) =>
            member ? (
              <li key={slot} className={`${cardLink} relative flex flex-col`}>
                <span aria-hidden className="absolute top-2.5 left-3.5 t-caption text-ink-3">
                  {slot + 1}
                </span>
                <button
                  type="button"
                  onClick={() => setPicking(slot)}
                  aria-label={`Emplacement ${slot + 1} : ${member.nameFr}, changer`}
                  className="flex w-full flex-col items-center gap-2 rounded-t-lg px-3 pt-5 pb-3"
                >
                  <PokemonSprite pokemonId={member.pokemonId} fallbackId={member.speciesId} alt="" size={96} className="size-24" />
                  <span className="text-center text-[15px] leading-5 font-bold tracking-[-0.01em] text-balance">{member.nameFr}</span>
                  <span className="flex flex-wrap justify-center gap-1">
                    {member.types.map((t) => (
                      <TypeBadge key={t.slug} type={t} />
                    ))}
                  </span>
                </button>
                {/* Attaques choisies (quatre au plus) et accès à la fenêtre de choix. */}
                <div className="mt-auto border-t border-line p-2">
                  {member.moves && member.moves.length > 0 && (
                    <ul aria-label={`Attaques de ${member.nameFr}`} className="mb-1 space-y-0.5 px-1.5 pt-0.5">
                      {member.moves.map((move) => (
                        <li key={move.id} className="flex items-center gap-1.5 text-[13px] leading-5" title={`${move.nameFr} · ${move.type.nameFr}`}>
                          <span aria-hidden className="size-2 shrink-0 rounded-full" style={{ background: `var(--type-${move.type.slug}, var(--type-unknown))` }} />
                          <span className="truncate">{move.nameFr}</span>
                          <span className="sr-only">({move.type.nameFr})</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  <button
                    type="button"
                    onClick={() => setEditingMoves(slot)}
                    aria-label={`Choisir les attaques de ${member.nameFr}`}
                    className={`${ghostButton} ${smallButton} w-full`}
                  >
                    {member.moves && member.moves.length > 0 ? (
                      `Attaques ${member.moves.length}/${MAX_MOVES}`
                    ) : (
                      <>
                        <PlusIcon size={14} /> Attaques
                      </>
                    )}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setSlot(slot, null)}
                  aria-label={`Retirer ${member.nameFr} de l'équipe`}
                  title="Retirer"
                  className="absolute top-0.5 right-0.5 grid size-11 place-items-center rounded-md text-ink-3 hover:text-ink"
                >
                  <CloseIcon />
                </button>
              </li>
            ) : (
              <li key={slot}>
                <button
                  type="button"
                  onClick={() => setPicking(slot)}
                  aria-label={`Emplacement ${slot + 1} : vide, ajouter un Pokémon`}
                  className="flex h-full min-h-48 w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-line-strong text-ink-2 transition-colors hover:border-ink hover:text-ink"
                >
                  <span className="grid size-12 place-items-center rounded-full bg-surface-2">
                    <PlusIcon />
                  </span>
                  <span className="t-small font-semibold">Ajouter</span>
                </button>
              </li>
            ),
          )}
        </ol>
      </section>

      {count === 0 ? (
        <p className={notice}>Ajoute un premier Pokémon pour voir les faiblesses et les avantages de ton équipe.</p>
      ) : (
        <>
          <div className="space-y-3">
            <TeamAnalysis data={data} team={members} />
            <p className="t-small text-ink-3">
              Table des types et attaques telles qu&apos;elles sont dans {data.game.nameFr}. Les avantages viennent des attaques choisies, ou à défaut des
              types de chaque Pokémon ; les talents (Lévitation, Absorb Eau…) ne sont pas pris en compte.
            </p>
          </div>
          <TeamSuggestions
            data={data}
            team={members}
            onAdd={(pokemonId) => {
              const slot = team.indexOf(null);
              if (slot >= 0) setSlot(slot, pokemonId);
            }}
          />
        </>
      )}

      {picking !== null && (
        <TeamPicker
          slot={picking}
          gameName={data.game.nameFr}
          options={data.options}
          types={data.types}
          inTeam={new Set(team.flatMap((slot) => (slot ? [slot.pokemonId] : [])))}
          onPick={(pokemonId) => {
            setSlot(picking, pokemonId);
            setPicking(null);
          }}
          onClose={() => setPicking(null)}
        />
      )}

      {editingMoves !== null && members[editingMoves] && (
        <TeamMovePicker
          key={editingMoves}
          slot={editingMoves}
          gameSlug={data.game.slug}
          gameName={data.game.nameFr}
          pokemon={members[editingMoves]}
          selected={members[editingMoves].moves ?? []}
          onChange={(moves) => setMoves(editingMoves, moves)}
          onClose={() => setEditingMoves(null)}
        />
      )}
    </div>
  );
}
