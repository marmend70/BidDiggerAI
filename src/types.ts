export interface AnalysisResult {
    "1_requisiti_partecipazione": {
        ordine_generale: Array<{ requisito: string; ref: string }>;
        ordine_speciale: Array<{ requisito: string; ref: string }>;
        idoneita_professionale: Array<{ requisito: string; ref: string }>;
        capacita_tecnica: Array<{ requisito: string; ref: string }>;
        rti_consorzi: string;
        consorzi_stabili: string;
        avvalimento: string;
        subappalto: string;
    };
    "3_sintesi": {
        oggetto: string;
        codici: {
            cig: string;
            cup: string;
            cpv: string;
        };
        scenario: string;
        ref: string;
    };
    "4_servizi": {
        attivita: string[];
        innovazioni: string;
        fabbisogno: string;
        ref: string;
    };
    "5_scadenze": {
        timeline: Array<{
            evento: string;
            data: string;
            ref: string;
        }>;
        sopralluogo: {
            previsto: string;
            obbligatorio: string;
            modalita: string;
            scadenze: string;
        };
    };
    "6_importi": {
        base_asta_totale: number;
        costi_manodopera: number;
        dettaglio: Array<{
            voce: string;
            importo: number;
        }>;
        ref: string;
    };
    "7_durata": {
        durata_base: string;
        proroghe: string;
        tempistiche_operative: string;
        ref: string;
    };
    "8_ccnl": {
        contratti: string[];
        equivalenze: string;
        ref: string;
    };
    "9_oneri": {
        carico_fornitore: string[];
        carico_stazione: string[];
        ref: string;
    };
    "10_punteggi": {
        tecnico: number;
        economico: number;
        soglia_sbarramento: number;
        criteri_tecnici: Array<{
            criterio: string;
            punti_max: number;
            descrizione: string;
            modalita: string;
            subcriteri?: Array<{
                descrizione: string;
                punti_max: number;
            }>;
        }>;
        formula_economica: string;
        note_economiche: string;
        ref: string;
    };
    "11_pena_esclusione": Array<{
        descrizione: string;
        ref: string;
    }>;
    "12_offerta_tecnica": {
        documenti: string[];
        formattazione_modalita: string;
        ref: string;
    };
    "13_offerta_economica": {
        documenti: string[];
        formattazione_modalita: string;
        ref: string;
    };
    "14_note_importanti": Array<{
        nota: string;
        ref: string;
    }>;
    "15_remunerazione": {
        modalita: string;
        pagamenti: string;
        clausole: string;
        ref: string;
    };
    "16_sla_penali": {
        sla: Array<{
            indicatore: string;
            soglia: string;
        }>;
        penali: Array<{
            descrizione: string;
            calcolo: string;
            sla_associato: string;
        }>;
        clausole_cumulative: string;
        ref: string;
    };
}
