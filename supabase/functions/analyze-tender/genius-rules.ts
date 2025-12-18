export const GENIUS_RULES_MAP: Record<string, string> = {
    "3_sintesi": `
1. Sintesi gara. Oggetto e scenario di gara
Verifica, oltre ai dati standard, la presenza dei seguenti casi e riportali se rilevanti:
- Oggetto di gara descritto in modo generico o non coerente tra disciplinare, capitolato e schema di contratto.
- Scostamento tra titolo della procedura e servizi effettivamente richiesti.
- Presenza di servizi accessori o opzionali citati marginalmente ma con impatto operativo o economico.
- Ambiguità tra gara di servizi puri e servizi con fornitura di beni/tecnologie.
- Indicazioni sul contesto (multi-sede, multi-lotto, continuità di servizio) non chiaramente esplicitate.
`,

    "3b_checklist_amministrativa": `
2. Checklist amministrativa
Verifica e segnala:
- Elenchi documentali non allineati tra disciplinare, modelli allegati e piattaforma telematica.
- Richiesta di dichiarazioni non standard o ulteriori rispetto al DGUE.
- Ambiguità su firma digitale singola o multipla, poteri di firma, procure.
- Documenti richiesti solo per alcune forme di partecipazione ma non chiaramente distinti (es. solo RTI).
- Mancata indicazione se un documento è richiesto a pena di esclusione o meno.
`,

    "1_requisiti_partecipazione": `
3. Requisiti di partecipazione
Verifica e segnala potenziali barriere all'entrata o incongruenze:
- Requisiti economico-finanziari o tecnici formulati in modo cumulativo o alternativo senza chiarezza.
- Ambiguità su periodo di riferimento (ultimi 3, 5 esercizi, media, singolo anno).
- Regole RTI, consorzi, avvalimento incomplete o contraddittorie.
- Requisiti che sembrano tarati sull’operatore uscente (rischio lock-in).
- Mancata coerenza tra requisiti richiesti e dimensione economica della gara.
`,

    "5_scadenze": `
4. Scadenze
Verifica e segnala criticità temporali:
- Date discordanti tra disciplinare, piattaforma e allegati.
- Mancata chiarezza su orari di scadenza o fusi orari.
- Sovrapposizione critica tra termine quesiti e scadenza offerta (tempo insufficiente per adeguarsi alle risposte).
- Assenza di indicazioni su eventuali proroghe o meccanismi di rettifica.
`,

    "6_importi": `
5. Quadro economico
Verifica e segnala incongruenze economiche:
- Importi a base d’asta non coerenti tra testo, tabelle e allegati economici.
- Mancata distinzione tra importo soggetto a ribasso e non soggetto a ribasso (es. oneri sicurezza).
- Ambiguità su oneri sicurezza, manodopera, costi indiretti.
- Importi pluriennali indicati senza ripartizione annuale.
- Valori stimati che non tornano rispetto ai volumi dichiarati.
`,

    "8_ccnl": `
6. CCNL e clausola sociale
Verifica e segnala:
- CCNL indicato in modo generico o plurimo senza criteri di prevalenza.
- Clausola sociale descritta senza numeri, profili, livelli, ore (rischio calcolo costo del lavoro errato).
- Assenza di dati su personale uscente, o dati incompleti.
- Ambiguità su assorbimento totale/parziale del personale.
- Incoerenza tra clausola sociale e importo della manodopera stimata.
NOTA: Se manca l'elenco del personale, segnalalo come "Dato mancante da verificare con allegati".
`,

    "4_servizi": `
7. Dettaglio servizi
Verifica e segnala ambiguità operative:
- Elenchi di attività descrittivi ma non quantificati (volumi incerti).
- Servizi citati solo in premessa o note, ma non nel corpo operativo.
- Confusione tra obblighi contrattuali minimi e miglioramenti offerti.
- Attività richieste “se necessario”, “a richiesta”, “eventualmente”, senza criteri di attivazione.
- Incongruenze tra servizi richiesti e SLA definiti.
`,

    "7_durata": `
8. Durata e tempistiche
Verifica e segnala:
- Durata contrattuale indicata in più punti con valori diversi.
- Rinnovi, proroghe o opzioni non chiaramente disciplinate.
- Avvio del servizio legato a eventi non deterministici (es. "dalla consegna aree").
- Tempi di subentro o start-up non compatibili con gli obblighi richiesti (rischio penali immediate).
`,

    "9_oneri": `
9. Oneri e costi
Verifica e segnala costi occulti:
- Oneri a carico dell’aggiudicatario non quantificati.
- Costi trasferiti implicitamente tramite formulazioni ambigue.
- Doppia attribuzione di uno stesso costo.
- Costi infrastrutturali o tecnologici citati ma non valorizzati.
- Incoerenza tra oneri richiesti e modello di remunerazione.
`,

    "15_remunerazione": `
10. Remunerazione
Verifica e segnala sostenibilità finanziaria:
- Modello di remunerazione non coerente con la natura del servizio.
- Ambiguità tra canone fisso e variabile.
- Assenza di regole su adeguamenti prezzi, revisione, indicizzazione.
- Metriche di misura non definite (giorno, ora, chiamata, evento).
- Remunerazioni legate a volumi non garantiti.
`,

    "16_sla_penali": `
11. SLA e penali
Verifica e segnala rischi sanzionatori:
- SLA definiti senza baseline o condizioni operative.
- KPI non misurabili o non verificabili oggettivamente.
- Penali cumulative senza tetto massimo o con tetto troppo alto.
- Penali applicabili anche per cause non controllabili dall’operatore.
- Disallineamento tra SLA richiesti e risorse dichiarate.
`,

    "12_offerta_tecnica": `
12. Offerta tecnica
Verifica e segnala insidie documentali:
- Documenti richiesti senza indicazione se obbligatori o facoltativi.
- Vincoli di formattazione poco chiari o eccessivamente stringenti (rischio esclusione formale).
- Ambiguità su numero massimo di pagine, carattere, allegati.
- Richiesta di contenuti tecnici non valutati nei criteri.
- Incoerenza tra struttura richiesta e griglia di valutazione.
`,

    "13_offerta_economica": `
13. Offerta economica
Verifica e segnala:
- Modelli economici non coerenti con il quadro economico.
- Campi obbligatori non spiegati.
- Ambiguità tra prezzo complessivo e prezzi unitari.
- Formula economica non chiaramente applicabile ai dati richiesti.
- Rischi di errore formale a pena di esclusione.
`,

    "10_punteggi": `
14. Criteri e punteggi
Verifica e segnala la discrezionalità:
- Criteri descritti in modo qualitativo ma valutati quantitativamente.
- Sub-criteri non associati a punteggi parziali (valutazione "black box").
- Discrezionalità non governata da indicatori oggettivi.
- Formula economica non standard o non spiegata (possibili paradossi matematici).
- Incoerenza tra punteggio massimo e somma dei sub-punteggi.
`,

    "11_pena_esclusione": `
15. Pena di esclusione
Verifica e segnala tassatività:
- Clausole di esclusione non evidenziate chiaramente.
- Ambiguità tra irregolarità sanabili (Soccorso Istruttorio) e non sanabili.
- Rinvii normativi non aggiornati.
- Cause di esclusione implicite nascoste in note o allegati.
- Differenze tra quanto dichiarato come “pena di esclusione” e quanto effettivamente applicato.
`,

    "14_note_importanti": `
16. Note importanti
Verifica e segnala clausole vessatorie:
- Clausole atipiche o squilibrate a favore della PA.
- Obblighi assicurativi o garanzie non standard o sproporzionati.
- Limitazioni alla subfornitura o subappalto non motivate.
- Obblighi di reportistica o audit non proporzionati al valore del contratto.
- Clausole risolutive espresse particolarmente stringenti.
`,

    "17_ambiguita_punti_da_chiarire": `
17. Ambiguità e chiarimenti
Raccogli e segnala in modo sintetico:
- Tutte le incongruenze tra documenti.
- Informazioni mancanti ma operative.
- Rischi economici, organizzativi o contrattuali non esplicitati nelle altre sezioni.
- Aree che richiederebbero chiarimento ufficiale alla Stazione Appaltante.
- Possibili quesiti formulabili in modo neutro e tecnico.
`
};
