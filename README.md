# PokeTracker

Compagnon d'aventure Pokémon : Pokédex par jeu, lieux de rencontre (zone, méthode, niveaux, taux), suivi des captures et des chasses shiny, multi-utilisateur.

La feuille de route complète est dans [ROADMAP.md](ROADMAP.md).

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind 4 · Prisma 7 · PostgreSQL (Neon) · Better Auth

## Démarrage

### 1. Dépendances

```bash
npm install
```

### 2. Variables d'environnement

```bash
cp .env.example .env
```

Puis renseigne dans `.env` :

- `DATABASE_URL` : l'URL **pooled** de Neon (hôte avec `-pooler`), utilisée par l'application.
- `DIRECT_DATABASE_URL` : l'URL **directe** de Neon (sans `-pooler`), utilisée par Prisma Migrate et l'import.
- `BETTER_AUTH_SECRET` : une chaîne aléatoire, par ex. `openssl rand -base64 32`.
- `BETTER_AUTH_URL` : `http://localhost:3000` en dev.

### 3. Base de données

Crée les tables :

```bash
npm run db:migrate
```

(Prisma demande un nom de migration : `init` convient.)

### 4. Lancer l'application

```bash
npm run dev
```

Vérifie que la base répond : <http://localhost:3000/api/health>

### 5. Importer les données de référence

```bash
npm run import:data
```

Le script télécharge les CSV du repo PokeAPI (cache dans `data/cache/`), remplit la base
en une transaction (~15 s sur Neon), affiche une vérification (Route 101 dans Rubis, Pokédex
de Paldea, couverture par jeu) puis télécharge les sprites dans `public/sprites/pokemon/`.

Options : `-- --refresh` (re-télécharger les CSV après une mise à jour PokeAPI),
`-- --skip-sprites`, `-- --sprites-only`. Relançable sans risque : les captures et chasses
des utilisateurs sont conservées.

## Cache

L'app utilise les Cache Components de Next (`cacheComponents: true`). Les données de
référence sont mises en cache 30 jours (`cacheLife("max")`, tag `reference`) ; les pages
`/jeux` et `/jeux/[version]` sont pré-rendues au build. Après un `npm run import:data`,
redéployer (ou, plus tard, appeler la route de revalidation) pour rafraîchir le cache.

## Scripts

| Commande | Rôle |
|---|---|
| `npm run dev` | Serveur de développement |
| `npm run build` / `npm start` | Build et serveur de production |
| `npm run lint` / `npm run typecheck` | Qualité |
| `npm run db:migrate` | Crée/applique une migration en dev |
| `npm run db:deploy` | Applique les migrations en prod |
| `npm run db:studio` | Interface Prisma Studio |
| `npm run import:data` | Import des données PokeAPI + sprites |

## Structure

```
prisma/schema.prisma   # schéma : données de référence + données utilisateur + auth
prisma7.config.ts      # config Prisma (URL directe pour les migrations)
src/app/               # routes (App Router)
src/components/        # composants UI
src/lib/data/          # accès aux données de référence (`use cache`, tag `reference`)
src/lib/prisma.ts      # client Prisma (singleton)
src/lib/auth.ts        # Better Auth côté serveur
src/lib/auth-client.ts # Better Auth côté client
src/generated/prisma   # client Prisma généré (ignoré par git)
scripts/import/        # ETL : CSV PokeAPI → base + sprites
public/sprites/        # sprites 96×96 (normal + shiny), téléchargés par l'import
data/cache/            # CSV téléchargés (ignoré par git)
```
