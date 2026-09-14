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
de Paldea, couverture par jeu) puis télécharge les images des Pokémon dans `public/sprites/pokemon/` (rendu Pokémon HOME,
ou illustration officielle à défaut, converties en WebP 256×256).

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
`/pokedex`, `/pokedex/[pokedex]`, `/rencontres` et `/rencontres/[version]` sont pré-rendues au build. Après un
`npm run import:data`, appeler `POST /api/revalidate` (voir ci-dessus) pour rafraîchir le cache ;
en dev, le cache `use cache` survit aux modifications de la base, la route est donc utile aussi.

La session utilisateur se lit à la requête (`src/lib/session.ts`) : tout composant qui l'utilise
est rendu dans un `<Suspense>` (menu de l'en-tête, pages protégées) pour que le reste de la page
reste dans la coquille statique. Les données propres à un utilisateur ne passent jamais par `use cache`.

## Pokédex

`/pokedex` liste un Pokédex par région : les Pokédex principaux de PokeAPI reliés par un même groupe
de versions sont regroupés en une page (`src/lib/data/pokedex-pages.ts` : Galar + Isolarmure +
Couronneige, Alola + ses îles…), le premier étant le principal. `/pokedex/[pokedex]?jeu=…&dex=…`
affiche un Pokédex pour un jeu donné (les captures restent par jeu) ; les anciennes adresses
`/jeux/…` redirigent. Les Pokémon obtenables dans un jeu hors de son Pokédex régional (Deoxys dans
Rouge Feu…) n'existent pas chez PokeAPI : ils viennent d'une liste tenue à la main dans
`src/lib/data/pokedex-extras.ts`, à compléter jeu par jeu.

## Authentification

Better Auth (e-mail + mot de passe), formulaires en Server Actions (`src/lib/auth-actions.ts`),
cookies posés par le plugin `nextCookies`. Routes : `/inscription`, `/connexion` (`?next=` pour
revenir sur la page demandée), `/compte` (pseudo, déconnexion), pages protégées via `requireUser()`.

## Suivi des captures

Case « attrapé » par jeu sur le Pokédex (`/pokedex/[pokedex]?jeu=…`), la fiche Pokémon et la liste des manquants
(`/captures/[jeu]`, avec où les trouver) ; `/captures` résume l'avancement de chaque Pokédex.
Server Action `toggleCaptureAction` + UI optimiste (`src/components/use-captures.ts`). Les « versions »
DLC de PokeAPI (Isolarmure, Couronneige…) sont rattachées à leur jeu de base (`DLC_BASE_VERSION`).

## Chasses shiny

`/shiny` liste les chasses en cours par jeu ; `/shiny/chasse/[id]` est le compteur (−1 / +1, saisie directe,
clavier), « Shiny trouvé ! » clôture la chasse en `ShinyCapture` ; `/shiny/galerie` et `/shiny/ajouter` pour
les shinies. Le compteur est sauvegardé en valeur absolue après un court délai (`setHuntCountAction`,
`src/components/use-hunt-counter.ts`) et, si l'onglet passe en arrière-plan avant, via un beacon vers
`POST /api/shiny/count`. Les données sont dans `src/lib/data/shiny.ts` (sans cache).

## Déploiement (Vercel + Neon)

L'app tourne sur n'importe quelle plateforme Node (`npm run build` puis `npm start`), mais le chemin
prévu est Vercel avec une base Neon.

1. **Base de production** : un projet (ou une branche) Neon dédié, distinct de celui du dev.
   Récupérer l'URL *pooled* (hôte `-pooler`) et l'URL *directe*.
2. **Migrer et remplir la base avant le premier build** : `next build` pré-rend les Pokédex à partir
   de la base, elle doit donc déjà contenir les données. Depuis ton poste, avec les URLs de prod :

   ```bash
   DIRECT_DATABASE_URL="postgresql://…" npm run db:deploy
   DIRECT_DATABASE_URL="postgresql://…" npm run import:data -- --skip-sprites
   ```

   (sous PowerShell : `$env:DIRECT_DATABASE_URL="postgresql://…"; npm run db:deploy`). Les sprites
   sont versionnés dans `public/sprites`, inutile de les retélécharger.
3. **Vercel** : importer le dépôt GitHub. Next.js est détecté ; le script `vercel-build`
   (`prisma migrate deploy && next build`) remplace `build`, donc les migrations suivantes
   s'appliquent à chaque déploiement. Choisir une région de fonctions proche de la base Neon.
4. **Variables d'environnement** (Production ; Preview si tu veux des prévisualisations connectées) :
   `DATABASE_URL` (pooled), `DIRECT_DATABASE_URL` (directe), `BETTER_AUTH_SECRET`,
   `BETTER_AUTH_URL` (l'URL publique, `https://…`), `REVALIDATE_SECRET`. Sur les prévisualisations,
   `BETTER_AUTH_URL` peut être omis : l'app retombe sur l'URL fournie par Vercel.
5. **Déployer**, puis vérifier `https://…/api/health` et créer un compte.

**Mettre à jour les données** ensuite : le workflow GitHub « Import des données » (onglet Actions →
Run workflow) relance l'import sur la base de prod puis appelle `POST /api/revalidate`. Il attend les
secrets `DIRECT_DATABASE_URL` et `REVALIDATE_SECRET`, et la variable `APP_URL` (URL publique).
En local, l'équivalent est :

```bash
curl -X POST https://…/api/revalidate -H "Authorization: Bearer $REVALIDATE_SECRET"
```

Le workflow « CI » (lint + types) tourne à chaque push ; le build complet est fait par Vercel.

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
.github/workflows/     # CI (lint + types) et import des données en prod (manuel)
prisma/schema.prisma   # schéma : données de référence + données utilisateur + auth
prisma7.config.ts      # config Prisma (URL directe pour les migrations)
src/app/               # routes (App Router)
src/components/        # composants UI
src/lib/data/          # accès aux données de référence (`use cache`, tag `reference`) ; captures.ts et shiny.ts = données utilisateur, sans cache
src/lib/search.ts      # normalisation et classement de la recherche
src/lib/encounters.ts  # types du tableau des rencontres + fusion des conditions
src/lib/prisma.ts      # client Prisma (singleton)
src/lib/auth.ts        # Better Auth côté serveur
src/lib/auth-actions.ts# Server Actions : inscription, connexion, déconnexion, pseudo
src/lib/capture-actions.ts # Server Action : cocher / décocher une capture
src/lib/shiny-actions.ts # Server Actions : chasses shiny, compteur, galerie
src/lib/session.ts     # utilisateur courant (`getCurrentUser`, `requireUser`)
src/generated/prisma   # client Prisma généré (ignoré par git)
scripts/import/        # ETL : CSV PokeAPI → base + sprites
public/sprites/        # images 256×256 WebP (normal + shiny), téléchargées par l'import
data/cache/            # CSV téléchargés (ignoré par git)
```
