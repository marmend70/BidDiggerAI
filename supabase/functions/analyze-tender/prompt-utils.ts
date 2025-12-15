export const generateAnalysisPrompt = (preferences: Record<string, boolean>, batchName: string, semanticPreferences: Record<string, boolean> = {}): string => {



  const prompts: string[] = [];
  prompts.push(`
  OBIETTIVO: Analisi Multi - Livello(Structured + Semantic Analysis) di documenti di gara.
    OUTPUT: Unico oggetto JSON. 
Ogni sezione attivata deve avere la struttura:
  "Key": {
    "structured": ... (Vedi Schema),
    "analysis": { ... },
    "semantic_analysis": "..."(Opzionale: Solo se richiesto),
      "rischi_rilevati": [...](Opzionale)
  }
  `);

  // GENIUS MODE LOGIC
  const activeSemanticKeys = Object.keys(semanticPreferences).filter(k => semanticPreferences[k]);

  const rules = `
REGOLE GENERALI:
  - JSON valido.
- Se un dato manca, usa null o[].Non inventare.
- Normalizza date in YYYY - MM - DD.
- "structured" DEVE seguire rigorosamente lo schema indicato(Spesso è un ARRAY di 1 elemento).
`;

  if (activeSemanticKeys.length > 0) {
    prompts.push(`
    *** ATTENZIONE: GENIUS MODE(ANALISI SEMANTICA) ATTIVO PER LE SEZIONI: ${activeSemanticKeys.join(', ')} ***

      PER QUESTE SPECIFICHE SEZIONI, IL TUO OUTPUT JSON DEVE INCLUDERE(Allo stesso livello di "structured" e "analysis") I SEGUENTI CAMPI:
  1. "semantic_analysis": "Analisi critica approfondita. Vai dritto al punto: evidenzia insidie, opportunità nascoste e consigli strategici senza premesse."
  2. "rischi_rilevati": ["Elenco rischi specifici rilevati in questa sezione"]
    `);
  }

  prompts.push(rules);

  // --- 1. SINTESI GARA (3_sintesi) ---
  // Dashboard: data['3_sintesi'].oggetto (Object Access)
  if (preferences['3_sintesi']) prompts.push(`
  Chiave: "3_sintesi"
  ISTRUZIONI: Estrai Sintesi, Stazione Appaltante, Oggetto.
  IMPORTANTE: Report "stazione_appaltante" (Ente banditore) e "oggetto" (Oggetto dell'appalto) in modo COMPLETO ed ESAUSTIVO come da documenti.
JSON SCHEMA:
  "3_sintesi": {
    "structured": {
      "stazione_appaltante": "Nome completo Stazione Appaltante / Amministrazione",
      "oggetto": "Oggetto dell'appalto completo",
          "scopo": "Scopo generale",
            "scenario": "Descrizione contesto",
              "codici": { "cig": "...", "cup": "...", "cpv": "..." }
    },
    "analysis": {
      "sintesi_procedura": "Quadro generale",
        "obiettivi_strategici": "...",
          "contest_operativo": "..."
    }
  } `);

  // --- 2. CHECKLIST (3b_checklist_amministrativa) ---
  // Dashboard: data['3b_checklist_amministrativa'][0] (Array Access)
  if (preferences['3b_checklist_amministrativa']) prompts.push(`
  Chiave: "3b_checklist_amministrativa"
  ISTRUZIONI: Checklist documenti e requisiti formali.
CERCA SPECIFICATAMENTE:
  - Garanzia Provvisoria: % su base asta e importo esatto.
- Contributo ANAC e Bollo.
JSON SCHEMA:
  "3b_checklist_amministrativa": {
    "structured": [
      {
        "contributo_anac": { "importo": "...", "cig": "..." },
        "imposta_bollo": { "importo": "...", "modalita": "..." },
        "garanzia_provvisoria": { "importo": "...", "beneficiario": "...", "validita": "...", "clausole": "..." },
        "sopralluogo": { "stato": "Obbligatorio/Facoltativo", "modalita": "..." },
        "firma_formato": { "formato": "PAdES/CAdES", "piattaforma": "..." },
        "elenco_documenti": [
          { "documento": "Nome documento (Stringa)", "descrizione": "...", "ref": "..." }
        ]
      }
    ],
      "analysis": {
      "rischi_formali": "...",
        "punti_attenzione": "..."
    }
  }
  Nota: "structured" è un ARRAY di 1 oggetto.`);

  // --- 3. REQUISITI (1_requisiti_partecipazione) ---
  // Dashboard: data['1_requisiti_partecipazione'][0] keys: ordine_generale, ordine_speciale, idoneita_professionale, capacita_tecnica
  if (preferences['1_requisiti_partecipazione']) prompts.push(`
  Chiave: "1_requisiti_partecipazione"
  ISTRUZIONI: Analisi Profonda Requisiti(6 Categorie Tassonomiche).
MAPPA I REQUISITI TROVATI NELLE SEGUENTI CATEGORIE ESATTE:

  1. "ordine_generale":
  - Inesistenza condanne penali(Art. 94 / 95)
    - Regolarità Fiscale e Contributiva(DURC)
      - Codice Antimafia e Illeciti Professionali
        - Normativa Disabili(L. 68 / 99) e Parità di Genere

  2. "idoneita_professionale":
  - Iscrizione CCIAA(attività coerente)
    - Albi Speciali(es.Gestori Ambientali, Pulizie L. 82 / 94)

  3. "ordine_speciale": (Usa questo per Capacità Economica e Forme Partecipazione)
  - Fatturato Globale e Specifico(Ultimi N esercizi)
    - Copertura Assicurativa(RC Professionale)
      - Forme Partecipazione: Regole RTI, Limiti Avvalimento, Subappalto

  4. "capacita_tecnica":
  - Elenco Servizi Analoghi(Punta)
    - Organico Medio Annuo
      - Certificazioni ISO(9001, 14001, 27001, ecc.)
        - Figure Chiave(PM, Sistemisti)

JSON SCHEMA:
  "1_requisiti_partecipazione": {
    "structured": [
      {
        "ordine_generale": [{ "requisito": "...", "ref": "..." }],
        "idoneita_professionale": [{ "requisito": "...", "ref": "..." }],
        "capacita_tecnica": [{ "requisito": "...", "ref": "..." }],
        "ordine_speciale": [{ "requisito": "...", "ref": "..." }]
      }
    ],
      "analysis": {
      "requisiti_restrittivi": "...",
        "ambiguita": "..."
    }
  }
  Nota: "structured" è un ARRAY.Mappa tutte le 6 categorie tassonomiche nei 4 array sopra.`);

  // --- 4. SCADENZE (5_scadenze) ---
  // Dashboard: data['5_scadenze'][0].timeline (Array Access)
  if (preferences['5_scadenze']) prompts.push(`
  Chiave: "5_scadenze"
  ISTRUZIONI: Date e Timeline.
JSON SCHEMA:
  "5_scadenze": {
    "structured": [
      {
        "timeline": [
          { "data": "YYYY-MM-DD", "evento": "Scadenza Offerte/Chiarimenti/Apertura", "ref": "Art. X" }
        ],
        "sopralluogo": {
          "previsto": "Si/No",
          "obbligatorio": "Si/No",
          "modalita": "..."
        }
      }
    ],
      "analysis": {
      "timeline_critica": "...",
        "rischi_scadenze": "..."
    }
  } `);

  // --- 5. IMPORTI (6_importi) ---
  // Dashboard: data['6_importi'][0].base_asta_totale (Array Access)
  if (preferences['6_importi']) prompts.push(`
  Chiave: "6_importi"
  ISTRUZIONI: Importi e Dettagli.
JSON SCHEMA:
  "6_importi": {
    "structured": [
      {
        "base_asta_totale": 100000.00,
        "costi_manodopera": 50000.00,
        "dettaglio": [
          { "voce": "Descrizione voce", "importo": 1000.00 }
        ]
      }
    ],
      "analysis": {
      "rischi_economici": "...",
        "redditivita_commento": "..."
    }
  }
  Nota: Importi numerici float(no stringhe valuta).`);

  // --- 6. CCNL (8_ccnl) ---
  // Dashboard: data['8_ccnl'][0].contratti (Array Access)
  if (preferences['8_ccnl']) prompts.push(`
  Chiave: "8_ccnl"
  ISTRUZIONI: Contratti e Clausola Sociale.
JSON SCHEMA:
  "8_ccnl": {
    "structured": [
      {
        "contratti": ["CCNL Multiservizi", "CCNL Commercio"],
        "equivalenze": "...",
        "clausola_sociale": "Descrizione obbligo riassorbimento..."
      }
    ],
      "analysis": {
      "impatto_costo_lavoro": "...",
        "rigidita_gestione": "..."
    }
  } `);

  // --- 7. SERVIZI (4_servizi) ---
  // Dashboard: data['4_servizi'][0].attivita (Array Access)
  if (preferences['4_servizi']) prompts.push(`
  Chiave: "4_servizi"
  ISTRUZIONI: Servizi e Tecnologie.
JSON SCHEMA:
  "4_servizi": {
    "structured": [
      {
        "attivita": ["Elenco puntato attività 1", "Attività 2"],
        "innovazioni": "...",
        "fabbisogno": "..."
      }
    ],
      "analysis": {
      "complessita_operativa": "...",
        "punti_critici_tecnici": "..."
    }
  } `);

  // --- 8. DURATA (7_durata) ---
  // Dashboard: data['7_durata'][0].durata_base (Array Access)
  if (preferences['7_durata']) prompts.push(`
  Chiave: "7_durata"
  ISTRUZIONI: Durata e Proroghe.
JSON SCHEMA:
  "7_durata": {
    "structured": [
      {
        "durata_base": "Es. 24 Mesi",
        "proroghe": "Descrizione opzioni rinnovo",
        "tempistiche_operative": "Fasi start-up o transizione"
      }
    ],
      "analysis": {
      "rischi_avvio": "...",
        "rigidita_cronoprogramma": "..."
    }
  } `);

  // --- 9. ONERI (9_oneri) ---
  // Dashboard: data['9_oneri'][0].carico_fornitore (Array Access)
  if (preferences['9_oneri']) prompts.push(`
  Chiave: "9_oneri"
  ISTRUZIONI: Ripartizione Oneri.
JSON SCHEMA:
  "9_oneri": {
    "structured": [
      {
        "carico_fornitore": ["Voce 1", "Voce 2"],
        "carico_stazione": ["Voce 1"]
      }
    ],
      "analysis": { "costi_occulti_o_rischi": "..." }
  } `);

  // --- 10. REMUNERAZIONE (15_remunerazione) ---
  // Dashboard: data['15_remunerazione'][0] keys: modalita, pagamenti, clausole
  if (preferences['15_remunerazione']) prompts.push(`
  Chiave: "15_remunerazione"
  ISTRUZIONI: Pagamenti.
JSON SCHEMA:
  "15_remunerazione": {
    "structured": [
      {
        "modalita": "...",
        "pagamenti": "...",
        "clausole": "..."
      }
    ],
      "analysis": { "sostenibilita_finanziaria": "..." }
  } `);

  // --- 11. SLA (16_sla_penali) ---
  // Dashboard: data['16_sla_penali'][0] keys: sla, penali, clausole_cumulative
  if (preferences['16_sla_penali']) prompts.push(`
  Chiave: "16_sla_penali"
  ISTRUZIONI: SLA e Penali.
  IMPORTANTE:
  - Tenta SEMPRE di strutturare i dati in "sla" e "penali".
  - Analizza con RIGORE: Cerca Livelli di Servizio, Priorità, Tempi di Risposta, Gravità e Penali correlate.
  - Mappa ogni SLA trovato nei campi specifici (vedi schema).
  - SE e SOLO SE i dati non sono strutturabili, usa "elenco_testuale".
  JSON SCHEMA:
  "16_sla_penali": {
    "structured": [
      {
        "sla": [
          {
            "servizio": "Descrizione Livello Servizio / Ambito",
            "indicatore": "KPI o Parametro (es. Tempo Presa in Carico)",
            "soglia": "Valore limite o Obiettivo (es. 99%, < 4h)",
            "priorita": "Livello Priorità o Gravità (es. Alta, Bloccante, Severity 1)",
            "penale_correlata": "Importo o calcolo penale specifica per questo SLA"
          }
        ],
        "penali": [{ "descrizione": "Causa applicazione (penali generiche)", "calcolo": "Formula o Importo" }],
        "clausole_cumulative": "...",
        "elenco_testuale": "..."
      }
    ],
      "analysis": {
      "severita_penali": "...",
      "ambiguita_sla": "..."
    }
  }
  Nota: "structured" è un ARRAY contenente un oggetto con liste di SLA e Penali.`);

  // --- 12. OFFERTA TECNICA (12_offerta_tecnica) ---
  // Dashboard: data['12_offerta_tecnica'][0].documenti (Array of Strings) + formattazione_modalita
  if (preferences['12_offerta_tecnica']) prompts.push(`
  Chiave: "12_offerta_tecnica"
  ISTRUZIONI: Offerta Tecnica.
JSON SCHEMA:
  "12_offerta_tecnica": {
    "structured": [
      {
        "documenti": ["doc1 (stringa)", "doc2"],
        "formattazione_modalita": "...",
        "limiti": "...",
        "criteri_formali": "..."
      }
    ],
      "analysis": {
      "fattori_successo": "...",
        "strategia_redazione": "..."
    }
  }
  Nota: "documenti" DEVE essere un array di stringhe, NON oggetti.`);

  // --- 13. OFFERTA ECONOMICA (13_offerta_economica) ---
  // Dashboard: data['13_offerta_economica'][0].documenti (Array of Strings) + formattazione_modalita
  if (preferences['13_offerta_economica']) prompts.push(`
  Chiave: "13_offerta_economica"
  ISTRUZIONI: Offerta Economica.
JSON SCHEMA:
  "13_offerta_economica": {
    "structured": [
      {
        "documenti": ["doc1 (stringa)"],
        "formattazione_modalita": "...",
        "modello": "Allegato C",
        "formula": "..."
      }
    ],
      "analysis": {
      "rischi_errore": "..."
    }
  }
  Nota: "documenti" DEVE essere un array di stringhe, NON oggetti.`);

  // --- 14. CRITERI (10_punteggi) ---
  // Dashboard: data['10_punteggi'][0].tecnico (Array Access)
  if (preferences['10_punteggi']) prompts.push(`
  Chiave: "10_punteggi"
  ISTRUZIONI: Punteggi e Criteri.
JSON SCHEMA:
  "10_punteggi": {
    "structured": [
      {
        "tecnico": 70,
        "economico": 30,
        "soglia_sbarramento": "40/70",
        "criteri_tecnici": [
          {
            "criterio": "Nome",
            "punti_max": 20,
            "descrizione": "...",
            "subcriteri": [{ "descrizione": "...", "punti_max": 10 }]
          }
        ],
        "formula_economica_dettaglio": {
          "formula": "...",
          "parametri_legenda": "...",
          "modalita_calcolo": "..."
        },
        "note_economiche": "..."
      }
    ],
      "analysis": {
      "discrezionalita": "...",
        "ambiguita_valutazione": "..."
    }
  } `);

  // --- 15. ESCLUSIONE (11_pena_esclusione) ---
  // Dashboard: data['11_pena_esclusione'][0].elementi (Array Access)
  if (preferences['11_pena_esclusione']) prompts.push(`
  Chiave: "11_pena_esclusione"
  ISTRUZIONI: Cause Esclusione.
JSON SCHEMA:
  "11_pena_esclusione": {
    "structured": [
      {
        "elementi": [{ "descrizione": "...", "ref": "..." }]
      }
    ],
      "analysis": { "rischi_critici": "..." }
  } `);

  // --- 16. NOTE (14_note_importanti) ---
  // Dashboard: data['14_note_importanti'][0].note (Array of Objects)
  if (preferences['14_note_importanti']) prompts.push(`
  Chiave: "14_note_importanti"
JSON SCHEMA:
  "14_note_importanti": {
    "structured": [
      {
        "note": [{ "nota": "...", "ref": "..." }]
      }
    ],
      "analysis": { "impatti_operativi": "..." }
  } `);

  // --- 17. AMBIGUITA (17_ambiguita_punti_da_chiarire) ---
  // NUOVA LOGICA: Senior Bid Manager con 4 Check Fondamentali + Mapping JSON
  if (preferences['17_ambiguita_punti_da_chiarire']) prompts.push(`
  Chiave: "17_ambiguita_punti_da_chiarire"
  RUOLO: Senior Bid Manager & Legale Appalti(D.lgs. 36 / 2023).
    OBIETTIVO: Analisi "Go/No-Go" e Matrice dei Rischi.
CONTROLLI LOGICI DA ESEGUIRE(Cerca ogni anomalia):
  1. CHECK DOCUMENTALE: Discrepanze tra Bando / Disciplinare / Capitolato(date, importi).Rif.normativi obsoleti(es.D.lgs 50 / 2016).
2. CHECK ECONOMICO: Costi manodopera non scorporati o fissi o "non soggetti a ribasso"(Art. 41).Oneri sicurezza zero o incongrui.Base d'asta sottostimata. Revisione prezzi assente.
  3. CHECK OPERATIVO: Penali senza tetto(capping > 10 %) o cumulabili.SLA vaghi o irrealistici.Clausole risolutive sbilanciate.
4. CHECK LOCK - IN: Requisiti sartoriali, software proprietari, limiti al subappalto o avvalimento non motivati.

ISTRUZIONE OUTPUT(IMPORTANTE):
Non usare Markdown.Mappa i risultati ESCLUSIVAMENTE nel JSON sotto:
  - "tipo": Assegna "ALTO", "MEDIO", "BASSO" in base alla gravità.
- "descrizione": Descrivi il rischio e la categoria(es. "[Economico] Base d'asta sottostimata...").
- "riferimento_documento": Fonte esatta e pagina.
- "punti_da_chiarire": Genera quesiti specifici per mitigare i rischi.

JSON SCHEMA:
  "17_ambiguita_punti_da_chiarire": {
    "structured": [
      {
        "ambiguita": [
          { "tipo": "ALTO/MEDIO/BASSO", "descrizione": "...", "riferimento_documento": "Pagina X / Art. Y" }
        ],
        "punti_da_chiarire": [
          { "quesito_suggerito": "...", "contesto": "...", "motivazione": "..." }
        ]
      }
    ],
      "analysis": { "quesiti_da_porre": "Sintesi generale strategia quesiti" }
  } `);

  return prompts.join("\n\n");
};
