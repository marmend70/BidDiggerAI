import {
    FileText,
    Calendar,
    DollarSign,
    Clock,
    ScrollText,
    Scale,
    PieChart,
    AlertTriangle,
    CheckSquare,
    CreditCard,
    Gavel,
    Info,
    HelpCircle,
    ClipboardCheck,
    Briefcase
} from 'lucide-react';

export const SECTIONS_MAP: Record<string, { label: string; icon: any; isSpecial?: boolean; isConfig?: boolean }> = {
    '1_requisiti_partecipazione': { label: 'Requisiti Partecipazione', icon: CheckSquare },
    '3_sintesi': { label: 'Sintesi Gara', icon: FileText },
    '3b_checklist_amministrativa': { label: 'Checklist Amministrativa', icon: ClipboardCheck },
    '4_servizi': { label: 'Dettaglio Servizi', icon: Briefcase },
    '5_scadenze': { label: 'Scadenze', icon: Calendar },
    '6_importi': { label: 'Quadro Economico', icon: DollarSign },
    '7_durata': { label: 'Durata e Tempistiche', icon: Clock },
    '8_ccnl': { label: 'CCNL e Clausola sociale', icon: ScrollText },
    '9_oneri': { label: 'Oneri e Costi', icon: Scale },
    '10_punteggi': { label: 'Criteri e Punteggi', icon: PieChart },
    '11_pena_esclusione': { label: 'Pena Esclusione', icon: AlertTriangle },
    '12_offerta_tecnica': { label: 'Offerta Tecnica', icon: CheckSquare },
    '13_offerta_economica': { label: 'Offerta Economica', icon: CheckSquare },
    '14_note_importanti': { label: 'Note Importanti', icon: Info },
    '15_remunerazione': { label: 'Remunerazione', icon: CreditCard },
    '16_sla_penali': { label: 'SLA e Penali', icon: Gavel },
    '17_ambiguita_punti_da_chiarire': { label: 'Ambiguità e Chiarimenti', icon: HelpCircle },
    'faq': { label: 'FAQ & Approfondimenti', icon: HelpCircle, isSpecial: true },
};

export const DEEP_DIVE_EXAMPLES: Record<string, string> = {
    '1_requisiti_partecipazione': "Quali sono i requisiti di fatturato specifico per questo appalto?",
    '3_sintesi': "Qual è l'obiettivo principale di questo appalto?",
    '3b_checklist_amministrativa': "Quali documenti devono essere firmati digitalmente?",
    '4_servizi': "Sono previste attività accessorie non esplicitamente elencate?",
    '5_scadenze': "Ci sono scadenze intermedie per la consegna dei SAL?",
    '6_importi': "Come sono ripartiti i costi della sicurezza?",
    '7_durata': "È prevista la possibilità di rinnovo tacito?",
    '8_ccnl': "Quale CCNL è applicato al personale uscente?",
    '9_oneri': "Quali oneri sono a carico esclusivo dell'aggiudicatario?",
    '10_punteggi': "Qual è il peso dell'offerta tecnica rispetto a quella economica?",
    '11_pena_esclusione': "Quali irregolarità comportano l'esclusione immediata?",
    '12_offerta_tecnica': "Qual è il limite massimo di pagine per la relazione tecnica?",
    '13_offerta_economica': "Sono ammesse offerte al rialzo?",
    '14_note_importanti': "Ci sono vincoli particolari per i sopralluoghi?",
    '15_remunerazione': "Quali sono i tempi di pagamento previsti?",
    '16_sla_penali': "Qual è la penale massima applicabile?",
    '17_ambiguita_punti_da_chiarire': "Quali punti del disciplinare risultano contraddittori?",
    'faq': "Quali sono i rischi principali di questo appalto?"
};

export const MENU_ORDER = [
    // Gruppo 1: Sintesi e analisi amministrativa
    '3_sintesi',
    '3b_checklist_amministrativa',
    '1_requisiti_partecipazione',
    '5_scadenze',
    '6_importi',
    '8_ccnl',

    // Gruppo 2: Servizi
    '4_servizi',
    '7_durata',
    '9_oneri',
    '15_remunerazione',
    '16_sla_penali',

    // Gruppo 3
    '12_offerta_tecnica',
    '13_offerta_economica',
    '10_punteggi',
    '11_pena_esclusione',

    // Gruppo 4: Extra
    '14_note_importanti',
    '17_ambiguita_punti_da_chiarire',

    'faq'
];

export const SECTION_BATCH_MAP: Record<string, string> = {
    "3_sintesi": "batch_1",
    "3b_checklist_amministrativa": "batch_1",
    "1_requisiti_partecipazione": "batch_1",
    "5_scadenze": "batch_1",
    "6_importi": "batch_1",
    "8_ccnl": "batch_1",

    "4_servizi": "batch_2",
    "7_durata": "batch_2",
    "9_oneri": "batch_2b",
    "15_remunerazione": "batch_2b",
    "16_sla_penali": "batch_2c",

    "12_offerta_tecnica": "batch_3",

    "13_offerta_economica": "batch_3b",
    "10_punteggi": "batch_3b",
    "11_pena_esclusione": "batch_3b",

    "14_note_importanti": "batch_4",
    "17_ambiguita_punti_da_chiarire": "batch_4"
};

export const AVAILABLE_MODELS = [
    // ESTRAZIONE STRUTTURATA (Structured)
    {
        id: 'gemini-3-pro-preview',
        name: 'Gemini 3 Pro (Preview)',
        description: 'Ultima generazione. Potenza massima per ogni task.',
        recommendedFor: 'Tutto',
        type: 'structured',
        isRecommended: true,
        speed: 'Medio',
        cost: 'Basso'
    },
    {
        id: 'gpt-5-mini',
        name: 'GPT-5 Mini',
        description: 'Rapidissimo, ideale per parsing strutturato veloce.',
        recommendedFor: 'Parsing veloce, tabelle',
        type: 'structured',
        speed: 'Molto Veloce',
        cost: 'Basso'
    },
    {
        id: 'gpt-5.1',
        name: 'GPT-5.1 (High Precision)',
        description: 'Massima accuratezza per strutture complesse.',
        recommendedFor: 'Estrazione accurata',
        type: 'structured',
        speed: 'Medio',
        cost: 'Alto'
    },

    // ANALISI SEMANTICA (Semantic)
    {
        id: 'gemini-3-pro-preview',
        name: 'Gemini 3 Pro (Preview)',
        description: 'Ragionamento superiore. Ideale per analisi complesse.',
        recommendedFor: 'Tutto',
        type: 'semantic',
        isRecommended: true,
        speed: 'Medio',
        cost: 'Basso'
    },
    {
        id: 'gemini-2.5-pro',
        name: 'Gemini 2.5 Pro',
        description: 'Ragionamento complesso e contesto ampio.',
        recommendedFor: 'Analisi profonda',
        type: 'semantic',
        speed: 'Medio',
        cost: 'Alto'
    },
    {
        id: 'gemini-2.5-flash',
        name: 'Gemini 2.5 Flash',
        description: 'Velocità e capacità multimodale.',
        recommendedFor: 'Analisi veloce',
        type: 'semantic',
        speed: 'Veloce',
        cost: 'Basso'
    }
];

export const LEMON_SQUEEZY_URLS = {
    STARTER: "https://biddigger.lemonsqueezy.com/buy/35ed83e3-8cf3-4f30-b532-9b9f270647a6",
    PRO: "https://biddigger.lemonsqueezy.com/buy/93698d97-8778-4a25-87c1-c9c98a1557a5",
    AGENCY: "https://biddigger.lemonsqueezy.com/buy/69aa6cca-70fb-406c-b1d5-f8c633e4e719"
};
