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

## Connexion

1. Accueil (slogan)
2. **Bienvenue sur Sonique** — Google, Facebook, e-mail (lien, pas de mot de passe). Tu peux **Continuer sans compte**.

Dans l’en-tête : **Se connecter** (puis **Mon compte** une fois connectée).

- **Google** : ouvre le sélecteur de comptes Google (comme Cursor).
- **Facebook** : même principe. À activer dans Supabase → Authentication → Providers → Facebook (App ID + secret Meta).
- **Instagram** : Instagram n’offre pas de connexion web comme Google. Le bouton le dit. Facebook (Meta) est la porte si tes utilisateurs viennent d’Instagram.
- **E-mail** : un lien dans la boîte, pas un mot de passe.

Redirect URLs (Supabase → Authentication → URL Configuration) :

- Site URL : `https://try-sonique.github.io/app/`
- Redirect : `https://try-sonique.github.io/app/**` et `http://127.0.0.1:43123/**`

## Parcours piano

Après la connexion (ou sans compte) : niveau **Débutant** / **Moyen**, ta partition, entraînement → prise → retour Aria.
