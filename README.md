# Sonique

L’app qui te laisse jouer tes morceaux préférés.

Démo publique : https://try-sonique.github.io/app/

Français uniquement. Coach **Aria**.

## Lancer en local

```bash
npm install
npm run dev
```

Ouvre [http://127.0.0.1:43123](http://127.0.0.1:43123).

## Compte

Optionnel pour jouer. Dans l’en-tête : **Connexion** (puis **Mon compte** une fois connecté).

Écran type « Welcome » : icône **Google**, puis e-mail → **Continuer avec l’e-mail** → mot de passe. Pas de Facebook / Instagram (pas branchés).

Dans Supabase → Authentication → URL Configuration :

- Site URL : `https://try-sonique.github.io/app/`
- Redirect URLs : `https://try-sonique.github.io/app/**` et `http://127.0.0.1:43123/**`

Pour Google : Authentication → Providers → Google (Client ID + secret). Sans ça, le bouton le dit clairement.

## Parcours

**Piano** (Commencer)

1. Niveau — **Débutant** (*une main*) ou **Moyen** (*les deux mains*)
2. Ta partition (importée et gardée) — ou à l’oreille
3. Entraînement → prise → retour Aria

**Guitare** et **Basse** (deux cases à l’accueil)

Aria n’enseigne pas ces instruments. Elle parle avec toi sur deux points : **est-ce qu’on t’entend** (prise audible, réécoute) et **est-ce que tu es accordé** (accordeur). Ce n’est pas une API Grok : les réponses viennent de ce que le micro capte.

## Compte (rappel)

Le compte n’est pas au milieu du jeu. Il sert à garder partitions et prises.
