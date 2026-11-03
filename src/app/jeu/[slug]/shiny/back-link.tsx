import Link from "next/link";
import { ArrowLeftIcon } from "@/components/icons";
import { ghostButton, smallButton } from "@/components/ui";

/** Retour au shiny dex du jeu, depuis une chasse ou le formulaire de nouvelle chasse. */
export function BackToShinyDex({ slug }: { slug: string }) {
  return (
    <Link href={`/jeu/${slug}/shiny`} className={`${ghostButton} ${smallButton} -ml-3`}>
      <ArrowLeftIcon size={14} /> Shiny dex
    </Link>
  );
}
