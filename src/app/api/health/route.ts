import { prisma } from "@/lib/prisma";

// Vérification rapide que la base répond et que les données sont importées.
export async function GET() {
  try {
    const [species, versions, encounters] = await Promise.all([
      prisma.species.count(),
      prisma.version.count(),
      prisma.encounter.count(),
    ]);
    return Response.json({ ok: true, species, versions, encounters });
  } catch (error) {
    // Prisma renvoie une pile complète : on ne garde que la cause finale.
    const raw = error instanceof Error ? error.message : String(error);
    const message = raw
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .at(-1);
    return Response.json({ ok: false, error: message }, { status: 503 });
  }
}
