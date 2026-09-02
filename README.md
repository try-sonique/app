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

## GitHub, Supabase, domaine

Ce n’est pas l’un ou l’autre.

- **GitHub** = le code, et aujourd’hui le site (`try-sonique.github.io/app/`). Ça ne disparaît pas avec un nom de domaine.
- **Supabase** = comptes, Google, sessions. Ça ne disparaît pas non plus. Le lien moche `….supabase.co` sur l’écran Google, c’est le backend d’auth, pas le site.
- **sonique.co** plus tard = une adresse plus propre **par-dessus** les deux. Le site peut rester sur GitHub Pages (ou Vercel). Auth peut afficher `sonique.co` au lieu de `….supabase.co`. Tu ne supprimes ni GitHub ni Supabase.

## Connexion

1. Accueil (slogan) → **Commencer**.
2. **Connexion** — Google ou e-mail (lien, pas de mot de passe). Pour jouer, tu te connectes d’abord. **Mon compte**, en haut, garde tes prises.
3. **Quel est ton instrument ?** — Piano, guitare ou basse.

Dans l’en-tête : **Se connecter** (puis **Mon compte** une fois connectée).

- **Google** : ouvre le sélecteur de comptes Google (« Sélectionnez un compte »). Tant que le provider n’est pas allumé dans Supabase, le bouton le dit sur Sonique — plus de page JSON.
- **E-mail** : un lien dans la boîte, pas un mot de passe.
- **Facebook / Instagram** : pas maintenant. Facebook demanderait une app Meta (comme Google Cloud). Instagram n’a pas de sélecteur web comme Google.

### Allumer Google (pour avoir l’écran « Sélectionnez un compte »)

Ce n’est pas un réglage dans le code. Il faut une app Google + le provider dans Supabase.

1. [Google Cloud Console](https://console.cloud.google.com/) → projet **Sonique** → APIs & Services → **OAuth consent screen**. Nom de l’appli : **Sonique**. Type : External. En mode Testing, ajoute ton Gmail comme test user.
2. APIs & Services → **Credentials** → Create credentials → **OAuth client ID** → Web application.
3. Origines JavaScript autorisées :
   - `http://127.0.0.1:43123`
   - `https://try-sonique.github.io`
4. URI de redirection autorisés (le callback Supabase, pas GitHub) :
   - `https://rzoqsbxiioaescaoyonh.supabase.co/auth/v1/callback`
5. Copie **Client ID** et **Client secret**.
6. [Supabase](https://supabase.com/dashboard) → projet Sonique → **Authentication → Providers → Google** → Enable → colle Client ID + secret → Save.
7. Authentication → URL Configuration :
   - Site URL : `https://try-sonique.github.io/app/`
   - Redirect URLs : `https://try-sonique.github.io/app/**` et `http://127.0.0.1:43123/**`

Le texte « Accéder à l’application … » vient de Google (nom de l’appli / page d’accueil sur l’écran de consentement). **sonique.co** n’apparaîtra que quand le domaine existera et sera mis dans cet écran. En attendant, mets la page GitHub comme page d’accueil : `https://try-sonique.github.io/app/`. Google affichera plutôt **Sonique**.

Facebook / Instagram : plus tard, si besoin. Meta for Developers → app → Facebook Login → même callback Supabase, puis Providers → Facebook dans Supabase. Instagram n’a pas cet écran-là sur le web.

## Parcours

- **Piano** : niveau **Débutant** / **Moyen · Confirmé** (même chemin Aria pour moyen et confirmé : les deux mains) → ta partition → entraînement → prise → retour Aria.
- **Guitare / basse** : micro + accordeur. Aria dit deux choses : tu es accordé, et le son de ta prise tient-il pour te réécouter. Ce n’est pas le coaching notes du piano. Pas de voix, pas de Grok.
