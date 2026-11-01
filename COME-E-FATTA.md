# Come è online senza Vercel

Mimmo, la notizia è questa: Duel LP è una web app vera, si installa sull'iPhone, funziona senza rete e costa zero. Vercel non c'entra, perché qui non c'è niente che gli serva fare.

## A cosa servirebbe Vercel

Vercel fa soprattutto due cose: **costruisce** il sito (per esempio un progetto Next.js) e **fa girare codice su un server** (API, login, database). Duel LP non ha bisogno di nessuna delle due:

- **Niente build:** i file in `docs/` sono già pronti per il browser, così come sono scritti.
- **Niente server:** tutti i conti li fa il telefono e i punti restano salvati sul telefono.

Serve solo qualcuno che consegni dei file. Lo fa gratis GitHub Pages.

## Come è fatta

| Pezzo | File | A cosa serve |
|---|---|---|
| Pagina | `index.html`, `style.css` | La schermata |
| Logica | `app.js`, `logic.js` | Tastierino, punti, dado |
| Installazione | `manifest.webmanifest`, icone | Nome e icona sulla schermata Home |
| Offline | `sw.js` | Il service worker salva l'app sul telefono |

## Come rifarlo in 4 passi

1. Metti i file in una cartella `docs/` del repository.
2. Rendi pubblico il repository: GitHub Pages gratis funziona solo così.
3. Su GitHub vai in **Settings → Pages**, scegli il branch `main` e la cartella `/docs`.
4. Dopo un minuto il sito è su `https://<utente>.github.io/<repo>/`.

Da lì basta un `git push` per aggiornarlo.

## Quando Vercel serve davvero

Se l'app dovesse avere account, classifiche online, un database o duelli tra due telefoni, servirebbe un server, e allora Vercel o simili avrebbero senso. Per un segnapunti che vive sul telefono sarebbe un passaggio in più.

## E l'App Store?

GitHub Pages copre solo la versione web. Per l'App Store la stessa cartella `docs/` viene inserita in un'app nativa con Capacitor, e qui serve il tuo Mac: le istruzioni sono in [IOS.md](IOS.md).
