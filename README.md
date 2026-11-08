# Duel LP

Segnapunti per i duelli di carte, pensato per il telefono in orizzontale: due giocatori, tastierino con `+` e `−`, tasto ½ e dado nero 3D. Funziona anche senza rete.

**Prova subito su iPhone:** apri https://ohhvalvaa.github.io/Duel-Lp/ con Safari, tocca Condividi e poi "Aggiungi alla schermata Home".

**Uso:** tocca un giocatore, che si illumina, scrivi i punti e premi `−` o `+`.

## Guide

- [IOS.md](IOS.md): come creare l'app iOS sul Mac e pubblicarla sull'App Store.
- [COME-E-FATTA.md](COME-E-FATTA.md): come è online senza Vercel.

## Sviluppo

L'app sta tutta in `docs/`, senza build. `npm test` prova la logica. Quando cambi un file, alza la versione di `CACHE` in `docs/sw.js`, altrimenti i telefoni continuano a usare la copia vecchia.

Il carattere Bebas Neue è distribuito con licenza SIL OFL (`docs/fonts/OFL.txt`).
