import { access, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const POKEAPI_SPRITES = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/";
/** Sources par ordre de préférence : rendu Pokémon HOME, sinon illustration officielle. */
const SOURCES = ["home", "official-artwork"] as const;
/** Taille de sortie : les images sont affichées au plus en 96 px, 256 px couvre les écrans 2×. */
export const SPRITE_SIZE = 256;
export const SPRITE_DIR = path.resolve("public/sprites/pokemon");

type Target = { id: number; shiny: boolean; file: string };

async function exists(file: string) {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
}

/** Récupère la première source disponible pour une forme ; `null` si aucune n'existe chez PokeAPI. */
async function fetchImage(id: number, shiny: boolean) {
  for (const source of SOURCES) {
    const url = `${POKEAPI_SPRITES}${source}/${shiny ? "shiny/" : ""}${id}.png`;
    const response = await fetch(url);
    if (response.status === 404) continue;
    if (!response.ok) throw new Error(`Image ${url} : HTTP ${response.status}`);
    return { source, buffer: Buffer.from(await response.arrayBuffer()) };
  }
  return null;
}

/**
 * Télécharge l'image de face (normal + shiny) de chaque Pokémon dans public/, en préférant
 * le rendu Pokémon HOME et en repliant sur l'illustration officielle. Les images sont
 * converties en WebP 256×256 (fond transparent) pour rester légères. Les fichiers déjà
 * présents sont ignorés ; les formes sans image (404 partout) sont listées.
 */
export async function downloadSprites(pokemonIds: number[], concurrency = 12) {
  await mkdir(path.join(SPRITE_DIR, "shiny"), { recursive: true });

  const targets: Target[] = [];
  for (const id of pokemonIds) {
    targets.push(
      { id, shiny: false, file: path.join(SPRITE_DIR, `${id}.webp`) },
      { id, shiny: true, file: path.join(SPRITE_DIR, "shiny", `${id}.webp`) },
    );
  }

  const pending: Target[] = [];
  for (const target of targets) {
    if (!(await exists(target.file))) pending.push(target);
  }
  console.log(`Images : ${targets.length - pending.length} déjà présentes, ${pending.length} à télécharger`);

  let downloaded = 0;
  let fromArtwork = 0;
  const missing: string[] = [];
  let cursor = 0;

  async function worker() {
    while (cursor < pending.length) {
      const target = pending[cursor++];
      const image = await fetchImage(target.id, target.shiny);
      if (!image) {
        missing.push(path.relative(SPRITE_DIR, target.file));
        continue;
      }
      if (image.source === "official-artwork") fromArtwork++;
      const webp = await sharp(image.buffer)
        .resize(SPRITE_SIZE, SPRITE_SIZE, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .webp({ quality: 85 })
        .toBuffer();
      await writeFile(target.file, webp);
      downloaded++;
      if (downloaded % 200 === 0) console.log(`  … ${downloaded}/${pending.length}`);
    }
  }

  await Promise.all(Array.from({ length: concurrency }, worker));
  console.log(
    `Images : ${downloaded} téléchargées (${fromArtwork} via l'illustration officielle), ${missing.length} absentes chez PokeAPI`,
  );
  if (missing.length > 0) console.log(`  absentes : ${missing.join(", ")}`);
}
