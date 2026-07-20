# Sonique

App d’entraînement musical avec coach **Aria** : jouer → s’entraîner → enregistrer → recevoir un compte rendu.

## Parcours

- **Avec partition (8 slides)** : accueil → inscription → morceau + upload → consignes → entraînement live → enregistrement → Aria analyse → compte rendu
- **Sans partition (7 slides)** : accueil → inscription → morceau + case « pas de partition » → arrangement/original → enregistrement → Aria analyse → compte rendu
- **3 takes max** par morceau, puis retour slide 3

## Accéder à la version (le plus simple)

### Lien démo EN LIGNE (sans installation)
Ouvre ce lien dans ton navigateur :

**https://ham-noon-reprints-newer.trycloudflare.com**

→ Pas de mot de passe. Si ça charge, clique les pastilles en bas pour changer les couleurs.

### Si le lien ne répond plus
Dis-le-moi dans le chat Cursor — je regenererai un lien frais (les tunnels temporaires expirent).

### Sur ton ordinateur (version durable)
```bash
git fetch origin
git checkout cursor/sonique-mvp-3ac4
npm install
npm run dev
```
Puis ouvre `http://localhost:5173`

PR : https://github.com/Elodieybs/Sonique-app-/pull/2

## Couleurs

Palette dans `src/styles.css` (`:root` CSS variables) — interchangeable sans refondre l’UI.

## Démo

- Micro navigateur pour l’enregistrement (sinon bouton « Simuler un take »)
- Aria V1 = feedback guidé / mock (APIs audio + LLM à brancher ensuite)
