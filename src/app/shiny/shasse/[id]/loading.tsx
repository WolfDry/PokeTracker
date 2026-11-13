import { PageSkeleton } from "@/components/page-skeleton";

// La page lit `params` et la session dès le début : ce squelette est la coquille statique.
export default function Loading() {
  return <PageSkeleton />;
}
