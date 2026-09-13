@AGENTS.md

# Règles du projet

## Git
- Interdit de `git commit`, `git stash` (et toute variante : `--amend`, `stash pop`, etc.). C'est l'utilisateur qui commit et stash.
- À la fin de chaque action qui doit être commitée, proposer un nom de commit suivant la convention :
  `<type>[optional scope]: <description>`
  (types : feat, fix, chore, docs, refactor, style, test, perf, build, ci).

## Fichier `.env`
- Interdit toute action sur `.env` : lecture, modification, déplacement, renommage, suppression, copie, affichage (cat, grep, etc.) ou tout autre accès direct ou indirect.
- Pour connaître les variables d'environnement : consulter `.env.example` ou demander à l'utilisateur.
