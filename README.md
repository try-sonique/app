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
2. **Niveau piano** (débutant / je joue déjà) puis morceau prêt ou partition importée
3. Salle de pratique — partition à l’écran, chuchotements d’Aria
4. Performance — prise enregistrée (micro ; pas de concert démo si tu es débutant)
5. Retour d’Aria (max 3 prises par morceau)

### Débutant

Aria ne commente pas le style du morceau. Elle dit ce qu’un prof dirait en première leçon :

1. **Mains séparées** — droite, puis gauche, puis ensemble
2. **Posture** — milieu du banc, dos, épaules, pieds
3. **Placement des mains** — doigts ronds, poignet souple

Les phrases sont dans `src/lib/coachScripts.ts`. Ce n’est pas un modèle entraîné : c’est le script.

### Démo entretien

1. Compte
2. **Débutant** → **Hymne à la joie**
3. Lire « Comment ça marche » (posture, mains, mains séparées)
4. Salle : la carte **Aujourd’hui · Mains séparées**
5. Lancer une prise (micro). Si Aria n’entend pas, elle le dit.
