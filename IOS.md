# Pubblicare Duel LP sull'App Store

L'app web sta in `docs/`. Capacitor la inserisce in un'app iOS vera, che funziona senza rete e aggiunge vibrazione e schermo sempre acceso.

## Cosa serve

- Mac con **Xcode 26** o più recente.
- **Node 22** o più recente.
- **Apple Developer Program**: abbonamento annuale a pagamento, necessario per l'App Store e per TestFlight. Per provare sul proprio iPhone basta un Apple ID gratuito.

## Prima volta

```sh
git clone https://github.com/Ohhvalvaa/Duel-Lp.git
cd Duel-Lp
npm run ios:setup
git add -A && git commit -m "Aggiunge il progetto iOS" && git push
npm run ios:open
```

Lo script crea la cartella `ios/`, genera icone e schermata di avvio da `assets/` e blocca l'app in orizzontale. È stato scritto su Windows e **non è ancora stato provato su un Mac**: se si ferma, leggi l'errore e correggilo.

## Provare sull'iPhone

1. In Xcode seleziona il target **App**, poi **Signing & Capabilities**, e scegli il tuo Team.
2. Se Xcode rifiuta `com.ohhvalvaa.duellp`, cambialo con un identificatore tuo, sia in Xcode sia in `capacitor.config.json`. Una volta pubblicata l'app non si può più cambiare.
3. Collega l'iPhone, selezionalo in alto e premi Run.

Da controllare sul telefono vero: vibrazione, schermo che resta acceso, tacca dell'iPhone, dado.

## Pubblicare

1. In Xcode scegli **Product → Archive**, poi **Distribute App** verso App Store Connect.
2. In [App Store Connect](https://appstoreconnect.apple.com) crea l'app e prova la build con TestFlight.
3. Compila la scheda. Privacy Policy: `https://ohhvalvaa.github.io/Duel-Lp/privacy.html`. Alla domanda sui dati raccolti rispondi **Data Not Collected**.
4. Invia alla revisione.

## Attenzione alla revisione Apple

- **Marchi:** niente "Yu-Gi-Oh", Konami o immagini delle carte nel nome, nelle parole chiave, nella descrizione o negli screenshot. Apple rifiuta le app che usano marchi altrui senza permesso. L'app è volutamente generica: "segnapunti per giochi di carte".
- **App troppo semplici:** Apple può rifiutare le app che sembrano siti impacchettati. Vibrazione, funzionamento offline e dado 3D aiutano, ma il rischio resta.

## Aggiornamenti

Modifica i file in `docs/`, poi:

```sh
npm run ios:sync
```

Alza la versione in Xcode, archivia e invia di nuovo. Per la versione web basta `git push`, ricordando di alzare `CACHE` in `docs/sw.js`.

**Sfondo dalla galleria (novembre 2026):** se il progetto `ios/` esisteva già prima di questa novità, lancia di nuovo `npm run ios:setup`. Aggiunge in `Info.plist` i testi per galleria e fotocamera: senza, l'app si chiude quando si tocca il **+** nella scelta dello sfondo.
