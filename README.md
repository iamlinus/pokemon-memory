# Pokémon Memory 🔴⚪

Ett memoryspel för **1–2 spelare** byggt på [PokeAPI](https://pokeapi.co/).
Installerbar **PWA** som fungerar **offline på iPad** efter första laddningen.

## Funktioner

- **1 spelare** – med tidtagning och personligt rekord per svårighetsgrad.
- **2 spelare** – med poängjakt, turindikator och vinnarfanfar.
- **Namn** matas in i VERSALER.
- **Antal brickor**: 4 → 18 par (Mini till Mästare).
- **Välj Pokémon** på fyra sätt:
  - 🎲 **Slumpa** ur hela Pokédexen (1025 st)
  - 🔥 **Välj typ** (eld, vatten, gräs …)
  - 🌍 **Generation** (Kanto → Paldea)
  - ✋ **Välj själv** i en sökbar väljare med alla Pokémon
- Massor av animationer: kort som vänds i 3D, matchglöd, skak vid fel, konfetti och syntetiska ljud (med ljud av/på).
- **Pokéboll-baksida** ritad helt i CSS – knivskarp i alla storlekar.
- Helt offline: bilder och API-svar cachas av en service worker vid första spelet.

## Kör lokalt

```bash
npm install
npm run dev        # utvecklingsserver
npm run build      # bygg till dist/
npm run preview    # förhandsgranska bygget
npm run icons      # generera om app-ikoner från public/pokeball.svg
```

## Driftsättning på Netlify

Projektet innehåller `netlify.toml` – allt är förkonfigurerat.

**Via Git:** Pusha till GitHub/GitLab och koppla repot i Netlify. Build-kommando
`npm run build`, publish-mapp `dist` (läses automatiskt från `netlify.toml`).

**Via CLI:**

```bash
npm i -g netlify-cli
npm run build
netlify deploy --prod --dir=dist
```

## Teknik

- Vanilla JavaScript + [Vite](https://vitejs.dev/)
- [`vite-plugin-pwa`](https://vite-pwa-org.netlify.app/) (Workbox) för offline/installerbarhet
- Självhostade typsnitt (Fredoka + Press Start 2P) via `@fontsource` → fungerar offline
- Inga ramverk, inga externa körtidsberoenden

## Datakälla

Pokémon-data och officiell artwork hämtas från PokeAPI och dess sprite-repo.
Pokémon © Nintendo/Game Freak. Det här är ett icke-kommersiellt hobbyprojekt.
