"use client";

import type { ReactNode } from "react";

type Props = { message: string; className?: string; children: ReactNode };

/** Bouton de soumission qui demande confirmation (suppression) ; sans JavaScript, il soumet directement. */
export function ConfirmButton({ message, className, children }: Props) {
  return (
    <button
      type="submit"
      className={className}
      onClick={(event) => {
        if (!window.confirm(message)) event.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
