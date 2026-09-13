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
- `REVALIDATE_SECRET` : jeton exigé par `POST /api/revalidate` en production (facultatif en dev).

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

Après un import, vider le cache des données de référence :

```bash
curl -X POST http://localhost:3000/api/revalidate
```

(en production, avec `-H "Authorization: Bearer $REVALIDATE_SECRET"`).

## Cache

L'app utilise les Cache Components de Next (`cacheComponents: true`). Les données de
référence sont mises en cache 30 jours (`cacheLife("max")`, tag `reference`) ; les pages
`/jeux`, `/jeux/[version]`, `/rencontres` et `/rencontres/[version]` sont pré-rendues au build. Après un
`npm run import:data`, appeler `POST /api/revalidate` (voir ci-dessus) pour rafraîchir le cache ;
en dev, le cache `use cache` survit aux modifications de la base, la route est donc utile aussi.

La session utilisateur se lit à la requête (`src/lib/session.ts`) : tout composant qui l'utilise
est rendu dans un `<Suspense>` (menu de l'en-tête, pages protégées) pour que le reste de la page
reste dans la coquille statique. Les données propres à un utilisateur ne passent jamais par `use cache`.

## Authentification

Better Auth (e-mail + mot de passe), formulaires en Server Actions (`src/lib/auth-actions.ts`),
cookies posés par le plugin `nextCookies`. Routes : `/inscription`, `/connexion` (`?next=` pour
revenir sur la page demandée), `/compte` (pseudo, déconnexion), pages protégées via `requireUser()`.

## Suivi des captures

Case « attrapé » par jeu sur le Pokédex (`/jeux/[jeu]`), la fiche Pokémon et la liste des manquants
(`/captures/[jeu]`, avec où les trouver) ; `/captures` résume l'avancement de chaque Pokédex.
Server Action `toggleCaptureAction` + UI optimiste (`src/components/use-captures.ts`). Les « versions »
DLC de PokeAPI (Isolarmure, Couronneige…) sont rattachées à leur jeu de base (`DLC_BASE_VERSION`).

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
src/lib/data/          # accès aux données de référence (`use cache`, tag `reference`) ; captures.ts = données utilisateur, sans cache
src/lib/search.ts      # normalisation et classement de la recherche
src/lib/encounters.ts  # types du tableau des rencontres + fusion des conditions
src/lib/prisma.ts      # client Prisma (singleton)
src/lib/auth.ts        # Better Auth côté serveur
src/lib/auth-actions.ts# Server Actions : inscription, connexion, déconnexion, pseudo
src/lib/capture-actions.ts # Server Action : cocher / décocher une capture
src/lib/session.ts     # utilisateur courant (`getCurrentUser`, `requireUser`)
src/generated/prisma   # client Prisma généré (ignoré par git)
scripts/import/        # ETL : CSV PokeAPI → base + sprites
public/sprites/        # sprites 96×96 (normal + shiny), téléchargés par l'import
data/cache/            # CSV téléchargés (ignoré par git)
```
