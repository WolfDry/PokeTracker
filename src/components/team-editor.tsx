"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useState, useTransition } from "react";
import { ConfirmButton } from "@/components/confirm-button";
import { CheckIcon } from "@/components/icons";
import { TeamBuilder, type TeamSlot } from "@/components/team-builder";
import { card, dangerButton, fieldLabel, ghostButton, input, inputHeight, primaryButton, smallButton } from "@/components/ui";
import type { TeamBuilderData } from "@/lib/data/team";
import { deleteTeamAction, saveTeamAction } from "@/lib/team-actions";
import { encodeTeam, TEAM_NAME_MAX } from "@/lib/team";

type Props = {
  data: TeamBuilderData;
  /** Équipe affichée : celle de l'URL (modifications non sauvegardées) ou, à défaut, celle sauvegardée. */
  initialTeam: TeamSlot[];
  /** Équipe sauvegardée ; `id` null pour une nouvelle équipe, pas encore enregistrée. */
  saved: { id: string | null; name: string; slots: string };
};

const encode = (team: TeamSlot[]) => encodeTeam(team.map((slot) => slot && { pokemonId: slot.pokemonId, moveIds: slot.moves.map((m) => m.id) }));

/**
 * Équipe sauvegardée d'un jeu : le constructeur d'équipe, avec son nom et une sauvegarde explicite (jamais
 * automatique). Les modifications en cours vivent dans l'URL jusqu'à la sauvegarde.
 */
export function TeamEditor({ data, initialTeam, saved: initialSaved }: Props) {
  const router = useRouter();
  const nameId = useId();
  const slug = data.game.slug;
  const [saved, setSaved] = useState(initialSaved);
  const [name, setName] = useState(initialSaved.name);
  const [slots, setSlots] = useState(() => encode(initialTeam));
  const [error, setError] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  const isNew = saved.id === null;
  const dirty = isNew || name.trim() !== saved.name || slots !== saved.slots;
  const basePath = `/jeu/${slug}/equipe/${saved.id ?? "nouvelle"}`;

  // Quitter la page (fermeture, rechargement) avec des modifications non sauvegardées : le navigateur prévient.
  useEffect(() => {
    if (!dirty || isNew) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty, isNew]);

  const save = (asCopy: boolean) => {
    setError(null);
    startTransition(async () => {
      const result = await saveTeamAction({
        teamId: asCopy ? null : saved.id,
        versionSlug: slug,
        name: asCopy ? `${name.trim()} (copie)`.slice(0, TEAM_NAME_MAX) : name,
        slots,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      if (asCopy || isNew) {
        // Nouvelle équipe : on passe sur son adresse, l'équipe sauvegardée y est rechargée.
        router.replace(`/jeu/${slug}/equipe/${result.teamId}`);
        return;
      }
      setSaved({ id: result.teamId, name: result.name, slots: result.slots });
      setName(result.name);
      // Plus rien à garder dans l'URL : l'équipe affichée est celle sauvegardée.
      window.history.replaceState(null, "", basePath);
      setJustSaved(true);
    });
  };

  const toolbar = (
    <div className={`${card} flex flex-wrap items-end gap-3 p-4`}>
      <div className="min-w-48 flex-1 space-y-1.5">
        <label htmlFor={nameId} className={fieldLabel}>
          Nom de l&apos;équipe
        </label>
        <input
          id={nameId}
          type="text"
          value={name}
          maxLength={TEAM_NAME_MAX}
          onChange={(event) => {
            setName(event.target.value);
            setJustSaved(false);
          }}
          placeholder="Ligue, post-game, Nuzlocke…"
          className={`${input} ${inputHeight}`}
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span aria-live="polite" className={`t-small ${error ? "text-danger" : "text-ink-2"}`}>
          {error ??
            (justSaved && !dirty ? (
              <span className="inline-flex items-center gap-1 text-success">
                <CheckIcon /> Sauvegardée
              </span>
            ) : dirty && !isNew ? (
              "Modifications non sauvegardées"
            ) : null)}
        </span>
        <button type="button" onClick={() => save(false)} disabled={pending || !dirty || name.trim() === ""} className={primaryButton}>
          {pending ? "Sauvegarde…" : "Sauvegarder"}
        </button>
        {!isNew && (
          <>
            <button type="button" onClick={() => save(true)} disabled={pending || name.trim() === ""} className={`${ghostButton} ${smallButton}`}>
              Enregistrer une copie
            </button>
            <form action={deleteTeamAction.bind(null, saved.id!, slug)}>
              <ConfirmButton message={`Supprimer l'équipe « ${saved.name} » ?`} className={`${dangerButton} ${smallButton} border-0`}>
                Supprimer
              </ConfirmButton>
            </form>
          </>
        )}
      </div>
    </div>
  );

  return (
    <TeamBuilder
      data={data}
      initialTeam={initialTeam}
      paths={{ current: basePath, share: `/jeu/${slug}/equipe/nouvelle` }}
      onTeamChange={(team) => {
        setSlots(encode(team));
        setJustSaved(false);
      }}
      toolbar={toolbar}
    />
  );
}
