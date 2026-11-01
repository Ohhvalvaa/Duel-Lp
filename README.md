# Duel LP

Calcolatore dei Life Point per i duelli di Yu-Gi-Oh. È una web app: gira su iPhone senza App Store e, dopo la prima apertura, anche senza rete.

**Installazione:** apri https://ohhvalvaa.github.io/duel-lp/ con Safari, tocca Condividi e poi "Aggiungi alla schermata Home".

**Uso:** tocca il giocatore, scrivi il valore (anche un calcolo, come `2500−1800`) e premi Danno o Cura.

**Sviluppo:** nessuna dipendenza. I test della logica si lanciano con `node --test`. Quando cambi un file, alza la versione di `CACHE` in `sw.js`, altrimenti i telefoni continuano a usare la copia vecchia.
