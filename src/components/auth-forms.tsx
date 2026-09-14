"use client";

import Link from "next/link";
import { useActionState, type ReactNode } from "react";
import { fieldError, fieldLabel, input, inputError, inputHeight, largeButton, primaryButton, textLink } from "@/components/ui";
import { signInAction, signUpAction, updateNameAction, type AuthField, type AuthFormState } from "@/lib/auth-actions";

// Formulaires d'authentification : Server Actions + useActionState pour afficher les erreurs
// sans perdre les valeurs saisies. Fonctionnent aussi sans JavaScript (soumission classique).

const inputClass = `${input} ${inputHeight}`;
const buttonClass = `${primaryButton} ${largeButton} w-full disabled:cursor-wait`;

type FieldProps = {
  name: AuthField;
  label: string;
  type?: "text" | "email" | "password";
  autoComplete: string;
  defaultValue?: string;
  error?: string;
  minLength?: number;
  autoFocus?: boolean;
};

function Field({ name, label, type = "text", autoComplete, defaultValue, error, minLength, autoFocus }: FieldProps) {
  const id = `auth-${name}`;
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className={fieldLabel}>
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        autoComplete={autoComplete}
        defaultValue={defaultValue}
        minLength={minLength}
        autoFocus={autoFocus}
        required
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`${inputClass} ${error ? inputError : ""}`}
      />
      {error && (
        <p id={`${id}-error`} className={fieldError}>
          {error}
        </p>
      )}
    </div>
  );
}

function FormError({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="rounded-md border border-danger/40 px-3 py-2 t-small text-danger">
      {children}
    </p>
  );
}

const initialState: AuthFormState = {};

export function SignInForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(signInAction, initialState);
  const query = next ? `?next=${encodeURIComponent(next)}` : "";
  return (
    <form action={action} className="space-y-5" noValidate>
      {next && <input type="hidden" name="next" value={next} />}
      {state.error && <FormError>{state.error}</FormError>}
      <Field name="email" label="Adresse e-mail" type="email" autoComplete="email" defaultValue={state.values?.email} error={state.fieldErrors?.email} autoFocus />
      <Field name="password" label="Mot de passe" type="password" autoComplete="current-password" error={state.fieldErrors?.password} />
      <button type="submit" disabled={pending} className={buttonClass}>
        {pending ? "Connexion…" : "Se connecter"}
      </button>
      <p className="text-center t-small text-ink-2">
        Pas encore de compte ?{" "}
        <Link href={`/inscription${query}`} className={textLink}>
          Créer un compte
        </Link>
      </p>
    </form>
  );
}

export function SignUpForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(signUpAction, initialState);
  const query = next ? `?next=${encodeURIComponent(next)}` : "";
  return (
    <form action={action} className="space-y-5" noValidate>
      {next && <input type="hidden" name="next" value={next} />}
      {state.error && <FormError>{state.error}</FormError>}
      <Field name="name" label="Pseudo" autoComplete="nickname" defaultValue={state.values?.name} error={state.fieldErrors?.name} minLength={2} autoFocus />
      <Field name="email" label="Adresse e-mail" type="email" autoComplete="email" defaultValue={state.values?.email} error={state.fieldErrors?.email} />
      <Field name="password" label="Mot de passe (8 caractères minimum)" type="password" autoComplete="new-password" error={state.fieldErrors?.password} minLength={8} />
      <Field name="confirm" label="Confirmer le mot de passe" type="password" autoComplete="new-password" error={state.fieldErrors?.confirm} minLength={8} />
      <button type="submit" disabled={pending} className={buttonClass}>
        {pending ? "Création…" : "Créer mon compte"}
      </button>
      <p className="text-center t-small text-ink-2">
        Déjà un compte ?{" "}
        <Link href={`/connexion${query}`} className={textLink}>
          Se connecter
        </Link>
      </p>
    </form>
  );
}

export function UpdateNameForm({ currentName }: { currentName: string }) {
  const [state, action, pending] = useActionState(updateNameAction, initialState);
  return (
    <form action={action} className="space-y-4" noValidate>
      {state.error && <FormError>{state.error}</FormError>}
      <Field name="name" label="Pseudo" autoComplete="nickname" defaultValue={state.values?.name ?? currentName} error={state.fieldErrors?.name} minLength={2} />
      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className={primaryButton}>
          {pending ? "Enregistrement…" : "Enregistrer"}
        </button>
        {state.success && <span className="t-small text-success">Pseudo mis à jour.</span>}
      </div>
    </form>
  );
}
