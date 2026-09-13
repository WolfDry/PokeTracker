# PokeTracker — Feuille de route

Compagnon d'aventure Pokémon : Pokédex par jeu, rencontres par jeu × lieu, suivi des captures et des chasses shiny, multi-utilisateur.

## 1. Décisions

| Sujet | Décision | Pourquoi |
| --- | --- | --- |
| Stack | **Next.js (App Router) + TypeScript + Prisma + PostgreSQL + Tailwind** | Un seul projet, SSR pour les pages de référence, API intégrée pour le suivi utilisateur |
| Auth | **Better Auth** (email + mot de passe) | Inscription/connexion par mot de passe prête à l'emploi, s'intègre à Prisma |
| Hébergement | En ligne (Vercel + Postgres managé type Neon, ou VPS Docker) | Postgres dès le départ, pas de migration à prévoir |
| Langue | **Français partout** (UI, Pokémon, lieux) — noms EN conservés en base pour la recherche | Couverture FR de PokeAPI : 1025/1025 espèces, 1070/1096 lieux |
| Source de données | **CSV bruts du repo PokeAPI importés dans notre base** — jamais d'appel à l'API en prod | Zéro latence, zéro rate-limit, schéma à notre main |
| Sprites | Repo `PokeAPI/sprites`, icônes embarquées dans `public/` | Pas de dépendance réseau externe à l'affichage |
| Jeux sans rencontres (BDSP, Légendes Arceus, Écarlate/Violet + DLC, Z-A) | **Trou accepté en v1**, schéma multi-source prêt | Aucune source ouverte structurée n'existe ; Pokédex + suivi fonctionnent quand même pour ces jeux |

## 2. Données

### 2.1 Couverture PokeAPI mesurée (sept. 2026)

| Données | État |
| --- | --- |
| Pokédex de tous les jeux (36 dex, Kanto → Paldea/Kitakami/Myrtille, Hisui, Illumis) | ✅ complet |
| Rencontres Gen 1–5 (Rouge → Noir 2/Blanc 2) | ✅ complet |
| Rencontres Épée/Bouclier + Isolarmure + Couronneige | ✅ complet |
| Rencontres Let's Go Pikachu/Évoli | ✅ correct |
| Rencontres X/Y, Soleil/Lune, Ultra-Soleil/Ultra-Lune | ⚠️ partiel |
| Rencontres Rubis Oméga/Saphir Alpha | ⚠️ très partiel |
| Rencontres BDSP, Légendes Arceus, Écarlate/Violet, Z-A | ❌ aucune |

### 2.2 Pipeline d'import (ETL)

`scripts/import/` — script Node/TS exécuté en local ou en CI, jamais sur le serveur web :

1. Télécharge les CSV depuis `https://raw.githubusercontent.com/PokeAPI/pokeapi/master/data/v2/csv/`
2. Transforme vers notre schéma (jointures faites une fois pour toutes)
3. Upsert dans Postgres (idempotent → relançable pour mettre à jour)
4. Télécharge les sprites manquants dans `public/sprites/`

CSV utilisés : `versions`, `version_groups`, `version_names`, `generations`, `regions`, `pokedexes`, `pokedex_prose`/`pokedex_names`, `pokemon_dex_numbers`, `pokemon_species`, `pokemon_species_names`, `pokemon`, `pokemon_types`, `types`, `type_names`, `locations`, `location_names`, `location_areas`, `location_area_prose`, `encounters`, `encounter_slots`, `encounter_methods`, `encounter_method_prose`, `encounter_conditions`, `encounter_condition_values`, `encounter_condition_value_prose`, `encounter_condition_value_map`, `location_area_encounter_rates`.

### 2.3 Schéma de référence (lecture seule, rempli par l'ETL)

- `Generation`, `Region`
- `VersionGroup` → `Version` (Rouge, Bleu, … ; nom FR)
- `Pokedex` (par région/jeu) → `PokedexEntry` (espèce, numéro dans ce dex)
- `Species` (n° national, nom FR/EN, types, sprite) — la forme par défaut suffit en v1
- `Location` (nom FR/EN, région) → `LocationArea` (sous-zone : « 1F », « rive nord »…)
- `EncounterMethod` (herbe, surf, canne…, libellé FR)
- `Encounter` : version × zone × espèce × méthode × niveau min/max × taux (%) × **source** (`pokeapi` | autre plus tard)
- `EncounterCondition` : heure, saison, essaim, Poké Radar… rattachées à une `Encounter`
- Table `VersionCoverage` : indique par jeu si des rencontres existent (pour afficher un message honnête plutôt qu'une page vide)

### 2.4 Schéma utilisateur

- `User` (géré par Better Auth)
- `Capture` : (user, species, version) **unique** → un Pokémon capturé dans plusieurs jeux = plusieurs lignes ; `caughtAt`
- `ShinyHunt` : (user, species, version) + `count`, `method` (optionnel : Masuda, chaîne, full-odds…), `status` (`active` | `completed` | `abandoned`), `startedAt`, `completedAt`
- `ShinyCapture` : shiny obtenu (user, species, version, `huntId` optionnel, date, nombre de rencontres final)

## 3. Phases

Chaque phase se termine par une vérification concrète avant de passer à la suivante.

### Phase 0 — Squelette ✅ (13 sept. 2026)

- Init Next.js + TypeScript + Tailwind + Prisma + Postgres (Docker Compose en local ou Neon)
- Layout de base, navigation, thème
- ✔ L'app démarre, la base répond

### Phase 1 — Fondations données ✅ (13 sept. 2026)

- Schéma Prisma de référence (§2.3)
- Script ETL complet + import des sprites
- ✔ Route 101 dans Rubis affiche Zigzaton 2-3 / 45 %, Chenipotte, Medhyèna, comme le site de référence ; Pokédex de Paldea = 400 entrées
- Résultat : 1 025 espèces, 1 351 formes, 1 104 lieux, 117 127 rencontres, 2 684 sprites ; import complet en ~15 s
- Libellés FR courts des méthodes de rencontre et noms des versions japonaises maintenus dans `scripts/import/labels.ts`

### Phase 2 — Pokédex par jeu ✅ (13 sept. 2026)

- Liste des jeux (par génération) → Pokédex du jeu (grille avec sprites, numéro régional, types)
- Fiche Pokémon : types, jeux où il est disponible, lieux de rencontre
- ✔ Tous les dex `is_main_series` navigables
- Routes : `/jeux`, `/jeux/[version]`, `/jeux/[version]/[dex]`, `/pokemon/[id]` ; versions japonaises masquées, Colosseum/XD affichent le dex national
- Cache Components activé (`cacheComponents: true`) : les fonctions de `src/lib/data/*` sont en `use cache` + `cacheTag("reference")`, à invalider après un import (voir phase 8)

### Phase 3 — Recherche ✅ (13 sept. 2026)

- Barre de recherche unifiée : Pokémon (FR/EN), jeu, lieu
- Index en mémoire (≈ 2 200 libellés) chargé par une fonction `use cache`, normalisation accents/casse/apostrophes et classement en JS (`src/lib/search.ts`) — pas d'extension Postgres nécessaire
- ✔ « salam » trouve Salamèche, « route 1 » liste les Route 1 de chaque région
- Bonus : page lieu `/lieux/[slug]` (jeux où le lieu a des rencontres, nombre d'espèces) ; barre de recherche dans l'en-tête

### Phase 4 — Rencontres jeu × lieu (feature clé) ✅ (13 sept. 2026)

- `/rencontres` (jeu) → `/rencontres/[jeu]` (lieux par région, filtre texte, nombre d'espèces) → `/rencontres/[jeu]/[lieu]` : tableau par sous-zone Pokémon | Méthode | Niveaux | Taux par version | Conditions
- Taux = somme des slots d'un même Pokémon (Chenipotte 20 + 10 + 10 + 5 = 45 %) ; versions jumelles côte à côte (Rubis | Saphir), niveaux détaillés par version s'ils diffèrent ; fréquence globale de la zone (`LocationAreaEncounterRate`) affichée par méthode
- Conditions fusionnées côté serveur (`collapseConditionRows`) : « matin + journée + nuit » à taux égal → sans condition, sinon « Le matin / La nuit » ; libellés français maintenus à la main pour les ~200 valeurs que PokeAPI ne traduit pas (météo, raids, échanges…)
- Filtres client instantanés : versions du groupe / ce jeu seulement, méthodes, masquer les cannes ; sous-zones repliables (au-delà de 200 lignes, seule la principale est ouverte — Terres Sauvages)
- Une ligne par espèce : si elle se trouve de plusieurs façons (méthodes, formes, conditions), ligne résumé (méthodes, plage de niveaux et de taux) dépliable en sous-lignes ; les noms de forme des formes par défaut (Bargantua « Motif Rouge ») n'apparaissent que dans ces sous-lignes
- Jeux sans données : carte inactive sur `/rencontres`, message sur les pages ; lieux fictifs PokeAPI (`unknown-all-*`) masqués partout
- `POST /api/revalidate` (prévu en phase 8) livré dès maintenant : indispensable après un import, y compris en dev
- ✔ Route 101 / Route 119 identiques au site de référence ; Épée/Bouclier (Prairie Entre-Ponts, antres Dynamax) et HGSS (heure, radio, essaims) OK

### Phase 5 — Authentification ✅ (13 sept. 2026)

- Better Auth (e-mail + mot de passe) piloté par des Server Actions (`src/lib/auth-actions.ts`) : `/inscription`, `/connexion?next=`, déconnexion depuis l'en-tête, `/compte` (e-mail, date d'inscription, modification du pseudo, compteurs captures / chasses / shinies)
- Validation Zod et messages d'erreur en français (codes Better Auth traduits) ; les formulaires fonctionnent sans JavaScript
- `src/lib/session.ts` : `getCurrentUser()` (dédupliqué par requête, cookies posés pendant une action pris en compte) et `requireUser(next)` qui redirige vers la connexion ; `/captures` et `/shiny` protégées, toutes les données de référence restent publiques
- Cache Components : la session se lit dans un `<Suspense>` (menu de l'en-tête, pages protégées), toutes les pages restent en pré-rendu partiel
- ✔ Deux comptes ne voient pas les données l'un de l'autre (capture ajoutée à l'un, compteur à 0 chez l'autre) ; mauvais mot de passe, e-mail déjà pris et mots de passe différents affichent l'erreur sans perdre la saisie

### Phase 6 — Suivi des captures ✅ (13 sept. 2026)

- Pokédex d'un jeu (`/jeux/[jeu]`) : case « attrapé » sur chaque carte (Server Action `toggleCaptureAction`, UI optimiste avec retour arrière si le serveur refuse), barre d'avancement, filtres Tous / Attrapés / Manquants ; sans compte, invitation à se connecter. La grille est streamée dans un `<Suspense>` (elle dépend de la session), le reste de la page reste statique
- `/captures` (« Mes jeux ») : un bloc par jeu commencé avec l'avancement de chaque Pokédex (Épée : Galar, Isolarmure, Couronneige), puis les autres jeux à commencer
- `/captures/[jeu]?dex=` : liste des manquants avec où les trouver (3 premiers lieux, méthodes, niveaux, lien vers le tableau des rencontres), cochable sur place ; onglet Attrapés ; message honnête pour les jeux sans rencontres
- Fiche Pokémon : puces « Mes captures » (un jeu par puce, cochable)
- Les versions DLC de PokeAPI (Isolarmure, Couronneige, Masque Turquoise, Disque Indigo, Méga-Dimension — `DLC_BASE_VERSION`) sont rattachées à leur jeu de base : elles n'apparaissent pas comme des jeux à cocher, mais leurs lieux alimentent la liste des manquants du jeu de base
- Données utilisateur dans `src/lib/data/captures.ts`, lues à la requête (jamais `use cache`) ; index « espèce → lieux » par jeu en cache (`getVersionSpeciesLocations`)
- ✔ Pikachu coché dans Rouge (grille) et dans Jaune (fiche) apparaît dans les deux blocs de `/captures` ; Carapuce coché depuis la liste des manquants disparaît de la liste et le compteur passe à 4 / 151 ; persistance vérifiée en base

### Phase 7 — Shiny ✅ (14 sept. 2026)

- `/shiny` : chasses en cours regroupées par jeu (carte avec +1 rapide), chasses en pause (Reprendre / Supprimer), aperçu des derniers shinies
- `/shiny/nouvelle` (`?espece=&jeu=` pour présélectionner depuis une fiche) : Pokémon (recherche avec suggestions, `searchSpeciesAction`), jeu, méthode libre (suggestions), rencontres déjà faites
- `/shiny/chasse/[id]` : compteur −1 / +1, saisie directe, clavier (+ / Espace / ↑ et − / ↓), pause, suppression ; « Shiny trouvé ! » → formulaire (surnom, date, note) qui clôture la chasse en `ShinyCapture` avec le compte affiché
- Sauvegarde du compteur : valeur absolue envoyée après 600 ms sans clic (`setHuntCountAction`, une requête à la fois) ; si l'onglet passe en arrière-plan avant, `navigator.sendBeacon` vers `POST /api/shiny/count` (même origine, session vérifiée). En cas d'échec le compte local est conservé et on propose de réessayer
- `/shiny/galerie` : shinies par jeu (surnom, méthode, rencontres, date, note), suppression avec confirmation ; `/shiny/ajouter` pour un shiny obtenu sans chasse
- Fiche Pokémon : section « Shiny » (chasses en cours, shinies obtenus, liens Lancer une chasse / Ajouter un shiny)
- Données utilisateur dans `src/lib/data/shiny.ts` (sans cache, chaque écriture filtrée sur `userId`)
- ✔ Deux chasses Pikachu en parallèle (Rouge 251, Jaune 40) listées sous leur jeu avec des compteurs indépendants ; 5 clics rapides = 1 requête ; beacon vérifié en base ; clôture à 254 rencontres (le +1 fait juste avant l'envoi est pris en compte) → galerie

### Phase 8 — Finitions & déploiement

- Responsive mobile (usage console-en-main)
- Déploiement (Vercel + Postgres managé, ou Docker sur VPS), variables d'env, seed en CI
- ~~Route protégée `/api/revalidate`~~ livrée en phase 4 ; documenter l'appel dans le déploiement
- ✔ URL publique fonctionnelle

## 4. Plus tard (hors v1)

- Deuxième source de rencontres pour BDSP / PLA / ÉV / Z-A (PKHeX MIT pour lieux+niveaux, ou CSV maison contributif)
- Formes alternatives (régionales, Méga…) dans le Pokédex
- Odds shiny affichés selon la méthode et le jeu
- Export/import des données utilisateur
- Bilingue FR/EN

## 5. Risques identifiés

- **Mises à jour PokeAPI** : le format CSV est stable depuis des années, mais l'ETL doit être tolérant (colonnes ajoutées) et versionné.
- **Rencontres partielles Gen 6–7** : afficher ce qui existe, sans prétendre à l'exhaustivité (badge « données partielles » par jeu).
- **Volume** : ~117 k rencontres + ~112 k conditions → trivial pour Postgres, mais l'import doit être batché.
