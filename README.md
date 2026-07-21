# Sonique

App d’entraînement musical avec coach **Aria** : jouer → s’entraîner → enregistrer → recevoir un compte rendu.

## Parcours

- **Avec partition (8 slides)** : accueil → inscription → morceau + upload → consignes → entraînement live → enregistrement → Aria analyse → compte rendu
- **Sans partition (7 slides)** : accueil → inscription → morceau + case « pas de partition » → arrangement/original → enregistrement → Aria analyse → compte rendu
- **3 takes max** par morceau, puis retour slide 3

## Démo

https://traditional-hits-biology-reflections.trycloudflare.com

Noir/or figé · Syne + Plus Jakarta Sans · partition large · timer discret

## Couleurs

Palette dans `src/styles.css` (`:root` CSS variables) — interchangeable sans refondre l’UI.

## Démo

- Micro navigateur pour l’enregistrement (sinon bouton « Simuler un take »)
- Aria V1 = feedback guidé / mock (APIs audio + LLM à brancher ensuite)
