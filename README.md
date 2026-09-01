# Sonique

App de pratique piano : **ta** partition, **ton** niveau, des prises jusqu’à ta meilleure — pas un catalogue Beethoven.

Démo publique : https://try-sonique.github.io/app/

Français uniquement.

## Lancer en local

```bash
npm install
npm run dev
```

Ouvre [http://127.0.0.1:43123](http://127.0.0.1:43123).

Compte (optionnel pour jouer) : email + mot de passe, ou **Continuer avec Google** si le provider est activé dans Supabase. Pas de Facebook / Instagram.

Dans Supabase → Authentication → URL Configuration :

- Site URL : `https://try-sonique.github.io/app/`
- Redirect URLs : `https://try-sonique.github.io/app/**` et `http://127.0.0.1:43123/**`

Pour Google : Authentication → Providers → Google (Client ID + secret). Sans ça, le bouton le dit clairement.

## Parcours (couche 1)

1. Commencer
2. Niveau piano — **Débutant** (*une main, gauche ou droite*) ou **Moyen** (*les deux mains, sans trop de difficultés*)
3. Ta partition (importée et **gardée** sur l’appareil) — ou à l’oreille
4. Entraînement → prise → retour Aria
5. Rejouer **ce** morceau autant que tu veux. Une session, ce n’est pas 3 essais.

**Mon compte** est dans le bandeau, pas au milieu du jeu.

Guitare / basse : pas encore. Accordeur + micro viendront ensuite.
