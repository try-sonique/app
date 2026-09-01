# Sonique

App de pratique musicale avec le coach **Aria** : choisis un morceau, joue avec la partition à l’écran, enregistre une prise, reçois un retour.

Démo publique : https://try-sonique.github.io/app/

L’app est en **français uniquement**.

## Lancer en local

```bash
npm install
npm run dev
```

Ouvre [http://127.0.0.1:43123](http://127.0.0.1:43123).

L’auth utilise le projet Supabase existant (`rzoqsbxiioaescaoyonh`) : Angelina, Ereka, Elise, Elodie et Marie-Odile se reconnectent avec le même email / mot de passe. Les nouvelles inscriptions reçoivent un mail de confirmation.

Dans Supabase → Authentication → URL Configuration, ajoute :

- Site URL : `https://try-sonique.github.io/app/`
- Redirect URLs :
  - `https://try-sonique.github.io/app/**`
  - `https://elodieybs.github.io/Sonique/**`
  - `http://127.0.0.1:43123/**`

## Flow

1. Accueil → compte
2. Importer une partition (ou un preset)
3. Salle de pratique — partition à l’écran, chuchotements d’Aria
4. Performance — prise enregistrée
5. Retour d’Aria (max 3 prises par morceau)
