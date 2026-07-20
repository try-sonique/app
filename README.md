# Sonique

App d’entraînement musical avec coach **Aria** : jouer → s’entraîner → enregistrer → recevoir un compte rendu.

## Parcours

- **Avec partition (8 slides)** : accueil → inscription → morceau + upload → consignes → entraînement live → enregistrement → Aria analyse → compte rendu
- **Sans partition (7 slides)** : accueil → inscription → morceau + case « pas de partition » → arrangement/original → enregistrement → Aria analyse → compte rendu
- **3 takes max** par morceau, puis retour slide 3

## Accéder à la version (le plus simple)

### Lien démo en ligne
1. Ouvre : https://sparkly-pixie-4fc795.netlify.app  
2. Mot de passe : `My-Drop-Site`

(Démo anonyme Netlify — à claimer sous 1h si tu veux la garder.)

### Sur ton ordinateur
```bash
git fetch origin
git checkout cursor/sonique-mvp-3ac4
npm install
npm run dev
```
Puis ouvre l’URL affichée (souvent `http://localhost:5173`).

En bas de l’écran : pastilles pour changer les couleurs de fond.

PR : https://github.com/Elodieybs/Sonique-app-/pull/1

## Couleurs

Palette dans `src/styles.css` (`:root` CSS variables) — interchangeable sans refondre l’UI.

## Démo

- Micro navigateur pour l’enregistrement (sinon bouton « Simuler un take »)
- Aria V1 = feedback guidé / mock (APIs audio + LLM à brancher ensuite)
