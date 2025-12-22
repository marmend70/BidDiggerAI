# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

## Funzionalità di Bid Digger

### Gestione e analisi documenti di gara
•	Caricamento e lettura di bandi, disciplinari, capitolati tecnici e allegati.
•	Analisi strutturata dei contenuti rilevanti per la partecipazione alla gara.
•	Individuazione delle informazioni chiave distribuite su più documenti.

### Sintesi e quadro generale della gara
•	Sintesi dell’oggetto della gara e dell’ambito dei servizi richiesti.
•	Evidenziazione di importi, durata, lotti, scadenze e principali condizioni contrattuali.
•	Riepilogo dei punti di attenzione principali.

### Analisi amministrativa
•	Checklist amministrativa dei documenti richiesti.
•	Analisi dei requisiti di partecipazione e delle cause di esclusione.
•	Supporto alla verifica di conformità formale.

### Analisi economica
•	Ricostruzione del quadro economico della gara.
•	Analisi di canoni, importi a base d’asta, opzioni, rinnovi e revisioni prezzi.
•	Evidenziazione di oneri, costi della sicurezza e vincoli economici.

### Analisi del personale e CCNL
•	Individuazione del CCNL applicabile e delle clausole sociali.
•	Analisi dei requisiti sul personale, livelli, inquadramenti e monte ore.
•	Evidenziazione di obblighi di assorbimento e criticità occupazionali.

### Analisi dei servizi
•	Dettaglio dei servizi richiesti e delle attività previste.
•	Analisi di durata, tempistiche, avviamento e continuità del servizio.
•	Evidenziazione di SLA, livelli di servizio e penali.

### Analisi dei criteri di valutazione
•	Lettura strutturata dei criteri e sub-criteri tecnici ed economici.
•	Evidenziazione di pesi e delle modalità di attribuzione del punteggio.
•	Supporto alla comprensione delle logiche valutative della Commissione.

### Genius Mode – analisi semantica avanzata
•	Analisi interpretativa dei testi di gara.
•	Individuazione di ambiguità, incoerenze e punti critici.
•	Evidenziazione di rischi impliciti e vincoli non immediatamente evidenti.

### Suggerimenti operativi
•	Indicazioni pratiche per la gestione della gara e della documentazione.
•	Suggerimenti concreti e spiegati, con esempi applicativi.
•	Evidenziazione di errori ricorrenti da evitare.

### Suggerimenti progettuali orientati al punteggio
•	Indicazioni progettuali collegate ai criteri di valutazione tecnica.
•	Supporto alla costruzione dell’offerta in funzione del punteggio.
•	Evidenziazione di leve progettuali e trade-off.

### Suggerimenti progettuali per l’offerta tecnica
•	Proposte di modelli di servizio e assetti organizzativi.
•	Supporto alla strutturazione dei capitoli dell’offerta tecnica.
•	Distinzione tra impostazione base e possibili miglioramenti.

### Contestualizzazione settoriale (opzionale)
•	Selezione del settore di riferimento della gara.
•	Contestualizzazione delle analisi semantiche e progettuali.
•	Inquadramento settoriale e logiche progettuali tipiche.

### Gestione Workspace e Collaborazione
•	**Gestione dei workspace:** creazione di ambienti condivisi per la collaborazione in team sulle gare.
•	**Condivisione:** accesso condiviso e sicuro alle analisi e ai documenti di gara.
•	**Tracciamento modifiche (Activity Log):** storico dettagliato delle attività, aggiornamenti e azioni eseguite da ogni utente sulla gara.

### Dashboard di controllo gare
•	Vista riepilogativa delle gare in gestione.
•	Stato singola gara.
•	Evidenza scadenze su timeline.
•	Tracciamento dello stato gare.
•	Assegnazione dei responsabili gara.

### Configurazioni e parametri
•	Impostazione dei parametri di analisi e conservazione dati.
•	Personalizzazione analisi e report gara docx.
•	Gestione liste responsabili e FAQ.

### Funzioni di approfondimento
•	FAQ
•	Possibilità di avviare analisi di approfondimento dall’app.
•	ChatBOT di assistenza diretta.
