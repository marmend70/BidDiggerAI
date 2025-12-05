export interface AnalysisResult {
    "1_requisiti_partecipazione": Array<{
        lotto: string;
        ordine_generale: Array<{ requisito: string; ref: string }>;
        ordine_speciale: Array<{ requisito: string; ref: string }>;
        idoneita_professionale: Array<{ requisito: string; ref: string }>;
        capacita_tecnica: Array<{ requisito: string; ref: string }>;
        rti_consorzi: string;
        consorzi_stabili: string;
        avvalimento: string;
        subappalto: string;
    }>;
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
    "3b_checklist_amministrativa": Array<{
        lotto: string;
        garanzia_provvisoria: { importo: string; beneficiario: string; validita: string; clausole: string; ref: string; };
        contributo_anac: { importo: string; cig: string; ref: string; };
        sopralluogo: { stato: string; modalita: string; ref: string; };
        imposta_bollo: { importo: string; modalita: string; ref: string; };
        firma_formato: { formato: string; piattaforma: string; ref: string; };
        elenco_documenti: Array<{ documento: string; descrizione: string; ref: string; }>;
    }>;
    "4_servizi": Array<{
        lotto: string;
        attivita: string[];
        innovazioni: string;
        fabbisogno: string;
        ref: string;
    }>;
    "5_scadenze": Array<{
        lotto: string;
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
    }>;
    "6_importi": Array<{
        lotto: string;
        base_asta_totale: number;
        costi_manodopera: number;
        dettaglio: Array<{
            voce: string;
            importo: number;
        }>;
        ref: string;
    }>;
    "7_durata": Array<{
        lotto: string;
        durata_base: string;
        proroghe: string;
        tempistiche_operative: string;
        ref: string;
    }>;
    "8_ccnl": Array<{
        lotto: string;
        contratti: string[];
        equivalenze: string;
        clausola_sociale: string;
        ref: string;
    }>;
    "9_oneri": Array<{
        lotto: string;
        carico_fornitore: string[];
        carico_stazione: string[];
        ref: string;
    }>;
    "10_punteggi": Array<{
        lotto: string;
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
    }>;
    "11_pena_esclusione": Array<{
        lotto: string;
        elementi: Array<{
            descrizione: string;
            ref: string;
        }>;
    }>;
    "12_offerta_tecnica": Array<{
        lotto: string;
        documenti: string[];
        formattazione_modalita: string;
        ref: string;
    }>;
    "13_offerta_economica": Array<{
        lotto: string;
        documenti: string[];
        formattazione_modalita: string;
        ref: string;
    }>;
    "14_note_importanti": Array<{
        lotto: string;
        note: Array<{
            nota: string;
            ref: string;
        }>;
    }>;
    "15_remunerazione": Array<{
        lotto: string;
        modalita: string;
        pagamenti: string;
        clausole: string;
        ref: string;
    }>;
    "16_sla_penali": Array<{
        lotto: string;
        sla: Array<{
            indicatore: string;
            soglia: string;
            penale_associata?: string;
        }>;
        penali: Array<{
            descrizione: string;
            calcolo: string;
            sla_associato: string;
        }>;
        clausole_cumulative: string;
        ref: string;
    }>;
    "17_ambiguita_punti_da_chiarire": Array<{
        lotto: string;
        ambiguita: Array<{ descrizione: string; riferimento_documento: string; tipo: string }>;
        punti_da_chiarire: Array<{ quesito_suggerito: string; contesto: string; motivazione: string }>;
        ref: string;
    }>;
    deep_dives?: {
        [sectionId: string]: Array<{
            question: string;
            answer: string;
            timestamp: string;
        }>;
    };
    semantic_analysis_data?: {
        [sectionId: string]: {
            semantic_analysis: string;
            rischi_rilevati: string[];
        };
    };
    tender_id?: string;
    _batch_name?: string;
    _semantic_debug_info?: any;
    _semantic_error?: any;
    [key: string]: any;
}

export interface UserPreferences {
    structured_model?: string;
    semantic_model?: string;
    faq_questions: string[];
    export_sections: {
        [key: string]: boolean;
    };
    analysis_sections: {
        [key: string]: boolean;
    };
    semantic_analysis_sections: {
        [key: string]: boolean;
    };
}

export interface UserProfile {
    id: string;
    company_name?: string;
    full_name?: string;
    preferences?: UserPreferences;
}
