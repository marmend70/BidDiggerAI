import type { AnalysisResult } from './types';

export const MOCK_ANALYSIS: any = {
    "1_requisiti_generali": [
        { requisito: "Iscrizione CCIAA", norme: "Art. 100 D.Lgs. 36/2023", doc_richiesti: "Visura Camerale", ref: "Disc. p. 12" },
        { requisito: "Assenza motivi esclusione", norme: "Art. 94-95 D.Lgs. 36/2023", doc_richiesti: "DGUE Parte III", ref: "Disc. p. 13" }
    ],
    "2_requisiti_speciali": [
        { requisito: "Fatturato globale ultimo triennio > 1M€", tipo: "economico", norme: "Art. 100 c. 11", doc_richiesti: "Dichiarazione fatturato", ref: "Disc. p. 15" },
        { requisito: "Esecuzione servizi analoghi", tipo: "tecnico", norme: "Art. 100 c. 3", doc_richiesti: "Elenco servizi", ref: "Disc. p. 16" }
    ],
    "3_sintesi": {
        oggetto: "Affidamento servizi di manutenzione evolutiva software gestionale",
        codici: { cig: "A001234567", cup: "B12C34000010001", cpv: "72267100-0" },
        scenario: "L'ente necessita di aggiornare il sistema informativo per adeguamento normative PNRR.",
        ref: "Cap. 1 p. 3"
    },
    "4_servizi": {
        attivita: ["Manutenzione correttiva", "Manutenzione evolutiva", "Help Desk II livello"],
        innovazioni: "Implementazione modulo AI per ticketing",
        fabbisogno: "Stima 200gg/uomo annui",
        ref: "Cap. Tecnico p. 5"
    },
    "5_scadenze": [
        { evento: "Termine richieste chiarimenti", data: "2023-12-10 12:00", ref: "Bando p. 2" },
        { evento: "Termine presentazione offerte", data: "2023-12-20 12:00", ref: "Bando p. 2" },
        { evento: "Apertura buste", data: "2023-12-21 10:00", ref: "Bando p. 2" }
    ],
    "6_importi": {
        base_asta_totale: 450000.00,
        dettaglio: [
            { voce: "Canone manutenzione", importo: 300000.00 },
            { voce: "Sviluppo evolutivo", importo: 140000.00 },
            { voce: "Oneri sicurezza (non soggetti a ribasso)", importo: 10000.00 }
        ],
        ref: "Q.E. p. 1"
    },
    "7_durata": {
        durata_base: "36 mesi",
        proroghe: "Opzione rinnovo 12 mesi",
        tempistiche_operative: "Avvio entro 30gg dalla stipula",
        ref: "Schema Contratto art. 4"
    },
    "8_ccnl": {
        contratti: ["CCNL Metalmeccanici", "CCNL Commercio e Servizi"],
        equivalenze: "Ammessi contratti equivalenti con tutele equiparabili",
        ref: "Disc. p. 18"
    },
    "9_oneri": {
        carico_fornitore: ["Formazione personale", "Hardware on-site"],
        carico_stazione: ["Licenze database", "Connettività server"],
        ref: "Cap. Tecnico p. 20"
    },
    "10_punteggi": {
        tecnico: 80,
        economico: 20,
        soglia_sbarramento: 40,
        criteri_tecnici: [
            { criterio: "Qualità piano progetto", punti_max: 30, descrizione: "Dettaglio WBS e metodologie", modalita: "Discrezionale" },
            { criterio: "Esperienza team", punti_max: 20, descrizione: "CV figure chiave", modalita: "Tabellare" },
            { criterio: "Migliorie tecniche", punti_max: 30, descrizione: "Proposte innovative", modalita: "Discrezionale" }
        ],
        formula_economica: "P = 20 * (R_off / R_max)^0.5",
        note_economiche: "Ribasso massimo ammesso 30%",
        ref: "Disc. p. 25"
    },
    "11_pena_esclusione": [
        { descrizione: "Mancata sottoscrizione digitale offerta", ref: "Disc. p. 8" },
        { descrizione: "Mancato versamento contributo ANAC", ref: "Disc. p. 9" }
    ],
    "12_offerta_tecnica": {
        doc_richiesti: ["Relazione tecnica (max 50 pag)", "CV gruppo di lavoro", "Certificazioni ISO"],
        vincoli_formali: "Formato PDF/A, firma digitale PAdES",
        allegati: "Allegato C (Schema relazione)",
        ref: "Disc. p. 22"
    },
    "13_offerta_economica": {
        doc_richiesti: ["Modello offerta economica", "Giustificativi manodopera"],
        modalita: "Caricamento a portale sezione dedicata",
        vincoli: "Max 2 decimali",
        ref: "Disc. p. 24"
    },
    "14_note_importanti": [
        { nota: "Attenzione: richiesta sopralluogo obbligatorio", ref: "Bando p. 4" },
        { nota: "Discrepanza tra Bando e Disciplinare su data scadenza (prevale Bando)", ref: "N/A" }
    ],
    "15_remunerazione": {
        modalita: "Canone trimestrale posticipato",
        pagamenti: "30 gg data fattura fine mese",
        clausole: "Revisione prezzi secondo indici ISTAT",
        ref: "Schema Contratto art. 10"
    },
    "16_sla_penali": {
        sla: [
            { indicatore: "Tempo presa in carico bloccante", soglia: "< 2 ore" },
            { indicatore: "Uptime sistema", soglia: "> 99.5%" }
        ],
        penali: [
            { descrizione: "Ritardo presa in carico", calcolo: "100€ per ogni ora di ritardo", sla_associato: "Tempo presa in carico" },
            { descrizione: "Indisponibilità sistema", calcolo: "500€ per ogni 0.1% sotto soglia", sla_associato: "Uptime" }
        ],
        clausole_cumulative: "Max 10% importo contrattuale",
        ref: "Schema Contratto art. 15"
    }
};
