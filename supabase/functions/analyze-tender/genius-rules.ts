export const GENIUS_RULES_MAP: Record<string, string> = {
    "3_sintesi": `
1. Sintesi gara. Oggetto e scenario di gara
Verifica, oltre ai dati standard, la presenza dei seguenti casi e riportali se rilevanti:
- Oggetto di gara descritto in modo generico o non coerente tra disciplinare, capitolato e schema di contratto.
- Scostamento tra titolo della procedura e servizi effettivamente richiesti.
- Presenza di servizi accessori o opzionali citati marginalmente ma con impatto operativo o economico.
- Ambiguità tra gara di servizi puri e servizi con fornitura di beni/tecnologie.
- Indicazioni sul contesto (multi-sede, multi-lotto, continuità di servizio) non chiaramente esplicitate.

SUGGERIMENTI STRATEGICI (Output in campo "suggerimenti"):
Formula suggerimenti condizionali quando l’oggetto è ampio o il contesto poco chiaro:
- Evidenziare la necessità di chiarire lo scenario operativo reale.
- Suggerire un’impostazione dell’offerta tecnica che dimostri comprensione del contesto (es. continuità, multi-sede).
- Consigliare di valorizzare l’esperienza su scenari analoghi, se coerente.
`,

    "3b_checklist_amministrativa": `
2. Checklist amministrativa
Verifica e segnala:
- Elenchi documentali non allineati tra disciplinare, modelli allegati e piattaforma telematica.
- Richiesta di dichiarazioni non standard o ulteriori rispetto al DGUE.
- Ambiguità su firma digitale singola o multipla, poteri di firma, procure.
- Documenti richiesti solo per alcune forme di partecipazione ma non chiaramente distinti.
- Mancata indicazione se un documento è richiesto a pena di esclusione o meno.

SUGGERIMENTI OPERATIVI (Output in campo "suggerimenti"):
Formula suggerimenti se la documentazione è frammentata:
- Suggerire una verifica incrociata tra disciplinare, modelli e piattaforma.
- Evidenziare documenti che richiedono attenzione preventiva per evitare errori formali.
- Consigliare gestione prudenziale di firme e procure.
`,

    "1_requisiti_partecipazione": `
3. Requisiti di partecipazione
Verifica e segnala potenziali barriere all'entrata o incongruenze:
- Requisiti economico-finanziari o tecnici formulati in modo cumulativo o alternativo senza chiarezza.
- Ambiguità su periodo di riferimento (ultimi 3, 5 esercizi, media, singolo anno).
- Regole RTI, consorzi, avvalimento incomplete o contraddittorie.
- Requisiti che sembrano tarati sull’operatore uscente (rischio lock-in).
- Mancata coerenza tra requisiti richiesti e dimensione economica della gara.

SUGGERIMENTI DI PARTECIPAZIONE (Output in campo "suggerimenti"):
Formula suggerimenti se i requisiti sono stringenti:
- Valutare con anticipo la forma di partecipazione idonea (RTI, consorzio).
- Suggerire verifiche puntuali sulla copertura requisiti per ogni soggetto.
- Evidenziare opportunità o rischi dell’avvalimento.
`,

    "5_scadenze": `
4. Scadenze
Verifica e segnala criticità temporali:
- Date discordanti tra disciplinare, piattaforma e allegati.
- Mancata chiarezza su orari di scadenza o fusi orari.
- Sovrapposizione critica tra termine quesiti e scadenza offerta.
- Assenza di indicazioni su eventuali proroghe o meccanismi di rettifica.

SUGGERIMENTI DI PIANIFICAZIONE (Output in campo "suggerimenti"):
Formula suggerimenti se i tempi sono compressi:
- Suggerire pianificazione anticipata.
- Evidenziare rischio sovrapposizione tra chiarimenti e consegna.
- Consigliare caricamento anticipato in piattaforma.
`,

    "6_importi": `
5. Quadro economico
Verifica e segnala incongruenze economiche:
- Importi a base d’asta non coerenti tra testo, tabelle e allegati economici.
- Mancata distinzione tra importo soggetto a ribasso e non soggetto a ribasso.
- Ambiguità su oneri sicurezza, manodopera, costi indiretti.
- Importi pluriennali indicati senza ripartizione annuale.
- Valori stimati che non tornano rispetto ai volumi dichiarati.

SUGGERIMENTI ECONOMICI (Output in campo "suggerimenti"):
Formula suggerimenti se l’equilibrio è delicato:
- Suggerire analisi di sostenibilità preventiva.
- Evidenziare voci potenzialmente sottostimate.
- Consigliare attenzione alla distinzione importi ribassabili/non ribassabili.
`,

    "8_ccnl": `
6. CCNL e clausola sociale
Verifica e segnala:
- CCNL indicato in modo generico o plurimo senza criteri di prevalenza.
- Clausola sociale descritta senza numeri, profili, livelli, ore.
- Assenza di dati su personale uscente, o dati incompleti.
- Ambiguità su assorbimento totale/parziale del personale.
- Incoerenza tra clausola sociale e importo della manodopera stimata.

SUGGERIMENTI SUL PERSONALE (Output in campo "suggerimenti"):
Formula suggerimenti se la componente lavoro è rilevante:
- Suggerire verifica del CCNL applicabile.
- Evidenziare necessità di simulazioni costo con assorbimento.
- Consigliare cautela nell'offerta economica se i dati sono incompleti.
`,

    "4_servizi": `
7. Dettaglio servizi
Verifica e segnala ambiguità operative:
- Elenchi di attività descrittivi ma non quantificati.
- Servizi citati solo in premessa o note, ma non nel corpo operativo.
- Confusione tra obblighi contrattuali minimi e miglioramenti offerti.
- Attività richieste “se necessario”, “a richiesta”, “eventualmente”, senza criteri.
- Incongruenze tra servizi richiesti e SLA definiti.

SUGGERIMENTI OPERATIVI (Output in campo "suggerimenti"):
Formula suggerimenti se i servizi sono poco puntuali:
- Suggerire distinzione netta tra obblighi e migliorie nell'offerta tecnica.
- Evidenziare attività con carichi operativi occulti.
- Consigliare mappatura servizi–risorse.
`,

    "7_durata": `
8. Durata e tempistiche
Verifica e segnala:
- Durata contrattuale indicata in più punti con valori diversi.
- Rinnovi, proroghe o opzioni non chiaramente disciplinate.
- Avvio del servizio legato a eventi non deterministici.
- Tempi di subentro o start-up non compatibili con gli obblighi richiesti.

SUGGERIMENTI TEMPORALI (Output in campo "suggerimenti"):
Formula suggerimenti se la durata incide sull'equilibrio:
- Suggerire valutazione separata periodo base vs opzioni.
- Evidenziare impatto di start-up brevi.
- Consigliare prudenza su proroghe non garantite.
`,

    "9_oneri": `
9. Oneri e costi
Verifica e segnala costi occulti:
- Oneri a carico dell’aggiudicatario non quantificati.
- Costi trasferiti implicitamente tramite formulazioni ambigue.
- Doppia attribuzione di uno stesso costo.
- Costi infrastrutturali o tecnologici citati ma non valorizzati.
- Incoerenza tra oneri richiesti e modello di remunerazione.

SUGGERIMENTI SUI COSTI (Output in campo "suggerimenti"):
Formula suggerimenti se emergono oneri impliciti:
- Suggerire di esplicitare internamente i costi non valorizzati.
- Evidenziare rischi di trasferimento improprio costi.
- Consigliare riserva tecnica/economica prudenziale.
`,

    "15_remunerazione": `
10. Remunerazione
Verifica e segnala sostenibilità finanziaria:
- Modello di remunerazione non coerente con la natura del servizio.
- Ambiguità tra canone fisso e variabile.
- Assenza di regole su adeguamenti prezzi, revisione, indicizzazione.
- Metriche di misura non definite.
- Remunerazioni legate a volumi non garantiti.

SUGGERIMENTI FINANZIARI (Output in campo "suggerimenti"):
Formula suggerimenti se il modello è variabile:
- Suggerire simulazioni su scenari min/max.
- Evidenziare rischi volatilità ricavi.
- Consigliare attenzione a clausole revisione prezzi.
`,

    "16_sla_penali": `
11. SLA e penali
Verifica e segnala rischi sanzionatori:
- SLA definiti senza baseline o condizioni operative.
- KPI non misurabili o non verificabili oggettivamente.
- Penali cumulative senza tetto massimo o con tetto troppo alto.
- Penali applicabili anche per cause non controllabili dall’operatore.
- Disallineamento tra SLA richiesti e risorse dichiarate.

SUGGERIMENTI SUGLI SLA (Output in campo "suggerimenti"):
Formula suggerimenti se gli SLA sono stringenti:
- Suggerire allineamento organizzazione proposta–SLA.
- Evidenziare KPI particolarmente penalizzanti.
- Consigliare verifica sostenibilità operativa.
`,

    "12_offerta_tecnica": `
12. Offerta tecnica
Verifica e segnala insidie documentali:
- Documenti richiesti senza indicazione se obbligatori o facoltativi.
- Vincoli di formattazione poco chiari o eccessivamente stringenti.
- Ambiguità su numero massimo di pagine, carattere, allegati.
- Richiesta di contenuti tecnici non valutati nei criteri.
- Incoerenza tra struttura richiesta e griglia di valutazione.

SUGGERIMENTI DI REDAZIONE (Output in campo "suggerimenti"):
Formula suggerimenti se i criteri sono articolati:
- Suggerire allineamento puntuale struttura offerta–criteri.
- Evidenziare elementi da presidiare per evitare penalizzazioni.
- Consigliare di evitare contenuti non valutati.
`,

    "13_offerta_economica": `
13. Offerta economica
Verifica e segnala:
- Modelli economici non coerenti con il quadro economico.
- Campi obbligatori non spiegati.
- Ambiguità tra prezzo complessivo e prezzi unitari.
- Formula economica non chiaramente applicabile ai dati richiesti.
- Rischi di errore formale a pena di esclusione.

SUGGERIMENTI PREZZO (Output in campo "suggerimenti"):
Formula suggerimenti se la formula è complessa:
- Suggerire simulazione preventiva punteggi.
- Evidenziare rischi errore formale.
- Consigliare verifiche multiple pre-caricamento.
`,

    "10_punteggi": `
14. Criteri e punteggi
Verifica e segnala la discrezionalità:
- Criteri descritti in modo qualitativo ma valutati quantitativamente.
- Sub-criteri non associati a punteggi parziali.
- Discrezionalità non governata da indicatori oggettivi.
- Formula economica non standard o non spiegata.
- Incoerenza tra punteggio massimo e somma dei sub-punteggi.

SUGGERIMENTI STRATEGICI (Output in campo "suggerimenti"):
Formula suggerimenti se il peso tecnico è alto/discrezionale:
- Suggerire focus su criteri a maggior peso.
- Evidenziare criteri "facili" vs "ad alto rischio discrezionale".
- Consigliare strategia bilanciamento tecnica–economica.
`,

    "11_pena_esclusione": `
15. Pena di esclusione
Verifica e segnala tassatività:
- Clausole di esclusione non evidenziate chiaramente.
- Ambiguità tra irregolarità sanabili e non sanabili.
- Rinvii normativi non aggiornati.
- Cause di esclusione implicite nascoste in note o allegati.
- Differenze tra quanto dichiarato come “pena di esclusione” e quanto effettivamente applicato.

SUGGERIMENTI DI COMPLIANCE (Output in campo "suggerimenti"):
Formula suggerimenti se ci sono molte clausole escludenti:
- Suggerire controllo formale dedicato.
- Evidenziare aree ad alto rischio esclusione.
- Consigliare checklist finali conformità.
`,

    "14_note_importanti": `
16. Note importanti
Verifica e segnala clausole vessatorie:
- Clausole atipiche o squilibrate a favore della PA.
- Obblighi assicurativi o garanzie non standard.
- Limitazioni alla subfornitura o subappalto non motivate.
- Obblighi di reportistica o audit non proporzionati.
- Clausole risolutive espresse particolarmente stringenti.

SUGGERIMENTI GENERALI (Output in campo "suggerimenti"):
- Valutare l’opportunità strategica della partecipazione.
- Evidenziare elementi che riducono la competitività.
`,

    "17_ambiguita_punti_da_chiarire": `
17. Ambiguità e chiarimenti
Raccogli e segnala in modo sintetico:
- Tutte le incongruenze tra documenti.
- Informazioni mancanti ma operative.
- Rischi economici, organizzativi o contrattuali non esplicitati.
- Aree che richiederebbero chiarimento ufficiale alla Stazione Appaltante.

SUGGERIMENTI TRASVERSALI (Output in campo "suggerimenti"):
- Suggerire quesiti di chiarimento strategici.
- Valutare impatto complessivo dei rischi rilevati.
`
};
