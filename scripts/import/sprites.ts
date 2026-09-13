import { access, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const SPRITE_BASE_URL = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/";
export const SPRITE_DIR = path.resolve("public/sprites/pokemon");

type Target = { url: string; file: string };

async function exists(file: string) {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
}

/**
 * Télécharge les sprites de face (normal + shiny, 96×96) de chaque Pokémon dans public/.
 * Les fichiers déjà présents sont ignorés ; les formes sans sprite (404) sont listées.
 */
export async function downloadSprites(pokemonIds: number[], concurrency = 12) {
  await mkdir(path.join(SPRITE_DIR, "shiny"), { recursive: true });

  const targets: Target[] = [];
  for (const id of pokemonIds) {
    targets.push(
      { url: `${SPRITE_BASE_URL}${id}.png`, file: path.join(SPRITE_DIR, `${id}.png`) },
      { url: `${SPRITE_BASE_URL}shiny/${id}.png`, file: path.join(SPRITE_DIR, "shiny", `${id}.png`) },
    );
  }

  const pending: Target[] = [];
  for (const target of targets) {
    if (!(await exists(target.file))) pending.push(target);
  }
  console.log(`Sprites : ${targets.length - pending.length} déjà présents, ${pending.length} à télécharger`);

  let downloaded = 0;
  const missing: string[] = [];
  let cursor = 0;

  async function worker() {
    while (cursor < pending.length) {
      const target = pending[cursor++];
      const response = await fetch(target.url);
      if (response.status === 404) {
        missing.push(path.relative(SPRITE_DIR, target.file));
        continue;
      }
      if (!response.ok) {
        throw new Error(`Sprite ${target.url} : HTTP ${response.status}`);
      }
      await writeFile(target.file, Buffer.from(await response.arrayBuffer()));
      downloaded++;
      if (downloaded % 200 === 0) console.log(`  … ${downloaded}/${pending.length}`);
    }
  }

  await Promise.all(Array.from({ length: concurrency }, worker));
  console.log(`Sprites : ${downloaded} téléchargés, ${missing.length} absents chez PokeAPI`);
  if (missing.length > 0) console.log(`  absents : ${missing.join(", ")}`);
}
