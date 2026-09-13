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

### Phase 3 — Recherche

- Barre de recherche unifiée : Pokémon (FR/EN), jeu, lieu
- Index en base (`pg_trgm` ou simple `ILIKE` accent-insensible)
- ✔ « salam » trouve Salamèche, « route 1 » liste les Route 1 de chaque région

### Phase 4 — Rencontres jeu × lieu (feature clé)

- Page : sélection jeu → lieu → tableau par sous-zone : Pokémon | Méthode | Niveaux | Taux | Conditions
- Filtres : masquer les cannes, filtrer par méthode, par version d'un même groupe
- Message clair pour les jeux sans données
- ✔ Comparable au site de référence sur Gen 3 ; fonctionne sur SwSh

### Phase 5 — Authentification

- Better Auth : inscription, connexion, déconnexion, session
- Pages protégées, toutes les données de référence restent publiques
- ✔ Deux comptes ne voient pas les données l'un de l'autre

### Phase 6 — Suivi des captures

- Depuis le Pokédex d'un jeu : cocher « attrapé » (par jeu)
- Vue « Mes jeux » : % de complétion par dex, liste des manquants avec où les trouver
- ✔ Un même Pokémon coché dans deux jeux apparaît dans les deux

### Phase 7 — Shiny

- Compteur de chasse : +1 / −1 / saisie directe, incrément clavier, plusieurs chasses en parallèle
- Liste des chasses en cours (par jeu), clôture → devient un `ShinyCapture`
- Galerie des shinies attrapés, ajout manuel sans chasse
- ✔ Une chasse en cours dans deux jeux pour la même espèce fonctionne

### Phase 8 — Finitions & déploiement

- Responsive mobile (usage console-en-main)
- Déploiement (Vercel + Postgres managé, ou Docker sur VPS), variables d'env, seed en CI
- Route protégée `/api/revalidate` appelant `revalidateTag("reference")` après un `npm run import:data` (sinon : redéployer)
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
