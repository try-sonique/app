# Sonique

Music practice app with coach **Aria**: pick a piece → practice with your score on screen → record a take → get feedback.

## Demo (English)

**GitHub Pages:** https://elodieybs.github.io/Sonique/

> After renaming the repo from `Sonique-app-` to `Sonique`, that URL is live. Until then use: https://elodieybs.github.io/Sonique-app-/

Old `/yc/` and `/live/` links redirect to the site root.

Score-first flow · noir/gold · Manrope · score scrolls with your playing

## Flow

1. Welcome → account  
2. **Upload your score** (required — no preset pieces)  
3. How it works  
4. Practice room — score on screen, Aria whispers, nothing recorded  
5. Performance — synced take  
6. Aria feedback (max 3 takes per piece)

## Deploy (GitHub Pages)

```bash
npm run build:v2-en
npm run deploy:pages
```

Publishes the English YC demo to the root of GitHub Pages (`username.github.io/Sonique/`).
