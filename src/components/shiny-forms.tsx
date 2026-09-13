"use client";

import { useActionState, useId, type ReactNode } from "react";
import { SpeciesPicker } from "@/components/species-picker";
import type { SpeciesPick } from "@/lib/data/search";
import { HUNT_METHODS } from "@/lib/shiny";
import { addShinyAction, completeHuntAction, createHuntAction, type ShinyField, type ShinyFormState } from "@/lib/shiny-actions";

// Formulaires shiny : Server Actions + useActionState (erreurs par champ, valeurs conservées).
// Seul le choix du Pokémon demande JavaScript (suggestions) ; le reste est un formulaire classique.

export type GameOption = { id: number; nameFr: string; versions: { id: number; slug: string; nameFr: string }[] };

export type ShinyFormInitial = { species?: SpeciesPick | null; versionId?: number };

const inputClass = "w-full rounded-md border border-border bg-background px-3 py-2 focus:border-accent focus:outline-none";
const submitClass =
  "rounded-md bg-accent px-4 py-2 font-medium text-accent-foreground transition-opacity disabled:cursor-wait disabled:opacity-60";

type FieldProps = {
  name: ShinyField;
  label: string;
  hint?: string;
  error?: string;
  children: (props: { id: string; name: string; className: string; "aria-invalid"?: true; "aria-describedby"?: string }) => ReactNode;
};

function Field({ name, label, hint, error, children }: FieldProps) {
  const id = useId();
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
      </label>
      {children({ id, name, className: `${inputClass} ${error ? "border-accent" : ""}`, "aria-invalid": error ? true : undefined, "aria-describedby": describedBy })}
      {error ? (
        <p id={`${id}-error`} className="text-sm text-accent">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="text-xs text-muted">
            {hint}
          </p>
        )
      )}
    </div>
  );
}

function FormError({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="rounded-md border border-accent/40 bg-accent/10 px-3 py-2 text-sm">
      {children}
    </p>
  );
}

function GameSelect({ games, defaultValue, error }: { games: GameOption[]; defaultValue?: number; error?: string }) {
  return (
    <Field name="versionId" label="Jeu" error={error}>
      {(props) => (
        <select {...props} defaultValue={defaultValue ?? ""} required>
          <option value="" disabled>
            Choisir un jeu…
          </option>
          {games.map((generation) => (
            <optgroup key={generation.id} label={generation.nameFr}>
              {generation.versions.map((version) => (
                <option key={version.id} value={version.id}>
                  {version.nameFr}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      )}
    </Field>
  );
}

function MethodField({ defaultValue, error }: { defaultValue?: string; error?: string }) {
  const listId = useId();
  return (
    <Field name="method" label="Méthode (facultatif)" error={error} hint="Full odds, Masuda, chaîne, soft reset…">
      {(props) => (
        <>
          <input {...props} type="text" list={listId} defaultValue={defaultValue} maxLength={60} autoComplete="off" />
          <datalist id={listId}>
            {HUNT_METHODS.map((method) => (
              <option key={method} value={method} />
            ))}
          </datalist>
        </>
      )}
    </Field>
  );
}

const initialState: ShinyFormState = {};

export function NewHuntForm({ games, initial }: { games: GameOption[]; initial?: ShinyFormInitial }) {
  const [state, action, pending] = useActionState(createHuntAction, initialState);
  const versionId = state.values?.versionId ? Number(state.values.versionId) : initial?.versionId;
  return (
    <form action={action} className="space-y-4" noValidate>
      {state.error && <FormError>{state.error}</FormError>}
      <SpeciesPicker label="Pokémon" initial={initial?.species} error={state.fieldErrors?.speciesId} autoFocus={!initial?.species} />
      <GameSelect games={games} defaultValue={versionId} error={state.fieldErrors?.versionId} />
      <MethodField defaultValue={state.values?.method} error={state.fieldErrors?.method} />
      <Field name="count" label="Rencontres déjà faites" error={state.fieldErrors?.count} hint="Laisse 0 pour une nouvelle chasse.">
        {(props) => <input {...props} type="number" inputMode="numeric" min={0} step={1} defaultValue={state.values?.count ?? "0"} />}
      </Field>
      <button type="submit" disabled={pending} className={submitClass}>
        {pending ? "Création…" : "Lancer la chasse"}
      </button>
    </form>
  );
}

export function AddShinyForm({ games, initial }: { games: GameOption[]; initial?: ShinyFormInitial }) {
  const [state, action, pending] = useActionState(addShinyAction, initialState);
  const versionId = state.values?.versionId ? Number(state.values.versionId) : initial?.versionId;
  return (
    <form action={action} className="space-y-4" noValidate>
      {state.error && <FormError>{state.error}</FormError>}
      <SpeciesPicker label="Pokémon" initial={initial?.species} error={state.fieldErrors?.speciesId} autoFocus={!initial?.species} />
      <GameSelect games={games} defaultValue={versionId} error={state.fieldErrors?.versionId} />
      <MethodField defaultValue={state.values?.method} error={state.fieldErrors?.method} />
      <Field name="encounters" label="Nombre de rencontres (facultatif)" error={state.fieldErrors?.encounters}>
        {(props) => <input {...props} type="number" inputMode="numeric" min={0} step={1} defaultValue={state.values?.encounters} />}
      </Field>
      <ShinyDetailsFields state={state} />
      <button type="submit" disabled={pending} className={submitClass}>
        {pending ? "Ajout…" : "Ajouter à la galerie"}
      </button>
    </form>
  );
}

/** Clôture d'une chasse : le compteur affiché est envoyé avec le formulaire (`count`), même s'il n'est pas encore sauvegardé. */
export function CompleteHuntForm({ huntId, count }: { huntId: string; count: number }) {
  const [state, action, pending] = useActionState(completeHuntAction, initialState);
  return (
    <form action={action} className="space-y-4" noValidate>
      <input type="hidden" name="huntId" value={huntId} />
      <input type="hidden" name="count" value={count} />
      {state.error && <FormError>{state.error}</FormError>}
      <ShinyDetailsFields state={state} />
      <button type="submit" disabled={pending} className={submitClass}>
        {pending ? "Enregistrement…" : `Terminer la chasse à ${count.toLocaleString("fr-FR")} rencontres`}
      </button>
    </form>
  );
}

/** Surnom, date et note : communs à la clôture d'une chasse et à l'ajout manuel. */
function ShinyDetailsFields({ state }: { state: ShinyFormState }) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="nickname" label="Surnom (facultatif)" error={state.fieldErrors?.nickname}>
          {(props) => <input {...props} type="text" defaultValue={state.values?.nickname} maxLength={40} autoComplete="off" />}
        </Field>
        <Field name="caughtAt" label="Date" error={state.fieldErrors?.caughtAt} hint="Vide = aujourd'hui.">
          {(props) => <input {...props} type="date" defaultValue={state.values?.caughtAt} />}
        </Field>
      </div>
      <Field name="note" label="Note (facultatif)" error={state.fieldErrors?.note}>
        {(props) => <textarea {...props} rows={2} defaultValue={state.values?.note} maxLength={500} />}
      </Field>
    </>
  );
}
