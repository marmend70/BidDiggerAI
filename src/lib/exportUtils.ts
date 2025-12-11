import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, BorderStyle, AlignmentType, TableOfContents } from "docx";
import { saveAs } from "file-saver";
import type { AnalysisResult } from "@/types";

// Helper to safely extract text from either a string or an object property
function getText(item: any, propName?: string): string {
    if (item === undefined || item === null) return "Non rilevato";
    if (typeof item === 'string') return item;
    if (typeof item === 'number') return item.toString();
    if (typeof item === 'object') {
        if (propName && item[propName]) return safeText(item[propName]);

        // Fallbacks
        if (item.descrizione) return safeText(item.descrizione);
        if (item.nota) return safeText(item.nota);
        if (item.requisito) return safeText(item.requisito);
        if (item.text) return safeText(item.text);
        if (item.valore) return safeText(item.valore);
        if (item.nome) return safeText(item.nome);

        // If it's a simple object with just one or two keys, try to join them
        const values = Object.values(item).filter(v => typeof v === 'string' || typeof v === 'number');
        if (values.length > 0 && values.length <= 3) return values.join(" - ");

        return "Non rilevato";
    }
    return String(item);
}

function safeText(text: any): string {
    if (text === undefined || text === null) return "Non rilevato";
    if (typeof text === 'object') return JSON.stringify(text);
    return String(text);
}

// Helper to ensure we have a list of items to iterate over
function getList(data: any, nestedKey?: string): any[] {
    if (!data) return [];

    // If it's an array, return it
    if (Array.isArray(data)) return data;

    // If it has the nested key (e.g. 'elenco'), use that
    if (nestedKey && data[nestedKey] && Array.isArray(data[nestedKey])) {
        return data[nestedKey];
    }

    // If it's an object that looks like a lot container (has 'lotto'), wrap it
    if (typeof data === 'object' && data.lotto) {
        return [data];
    }

    // If it's a generic object, maybe it IS the item? Wrap it.
    if (typeof data === 'object') {
        return [data];
    }

    return [];
}

// Helper to check if data is likely a multi-lot structure
function isMultiLot(data: any): boolean {
    if (Array.isArray(data) && data.length > 0 && data[0].lotto) {
        // If there is only one lot, check if it's a "default" name that should be hidden
        if (data.length === 1) {
            const name = String(data[0].lotto).trim().toLowerCase();
            const skippedNames = ['1', '01', 'lotto 1', 'lotto 01', 'unico', 'generale', 'unico / generale'];
            if (skippedNames.includes(name)) return false;
        }
        return true;
    }
    return false;
}

export const exportToDocx = async (data: AnalysisResult, exportPreferences?: { [key: string]: boolean }) => {
    const shouldInclude = (sectionKey: string) => {
        if (!exportPreferences) return true;
        return exportPreferences[sectionKey] !== false;
    };

    const doc = new Document({
        styles: {
            paragraphStyles: [
                {
                    id: "Normal",
                    name: "Normal",
                    run: {
                        font: "Times New Roman",
                        size: 22, // 11pt
                    },
                    paragraph: {
                        spacing: { line: 276 }, // 1.15 spacing
                    },
                },
            ],
        },
        sections: [
            {
                properties: {},
                children: [
                    // Cover Page
                    new Paragraph({
                        text: "BID DIGGER AI",
                        heading: HeadingLevel.TITLE,
                        alignment: AlignmentType.CENTER,
                        spacing: { before: 2000, after: 300 },
                        run: {
                            color: "2E74B5",
                            bold: true,
                            font: "Times New Roman",
                        }
                    }),
                    new Paragraph({
                        text: "Report di Analisi Gara",
                        heading: HeadingLevel.HEADING_2,
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 800 },
                        run: {
                            color: "555555",
                            font: "Times New Roman",
                        }
                    }),
                    new Paragraph({
                        text: safeText(data['3_sintesi']?.oggetto),
                        heading: HeadingLevel.HEADING_1,
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 500 },
                    }),
                    createKeyValueLine("CIG", safeText(data['3_sintesi']?.codici?.cig), true),
                    createKeyValueLine("CUP", safeText(data['3_sintesi']?.codici?.cup), true),

                    new Paragraph({
                        text: "",
                        pageBreakBefore: true,
                    }),

                    // Table of Contents
                    new Paragraph({
                        text: "Sommario",
                        heading: HeadingLevel.HEADING_1,
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 400 },
                    }),
                    new TableOfContents("Sommario", {
                        hyperlink: true,
                        headingStyleRange: "1-3",
                    }),
                    new Paragraph({
                        text: "",
                        pageBreakBefore: true,
                    }),

                    // 1. Requisiti di Partecipazione
                    ...(shouldInclude('1_requisiti_partecipazione') ? [
                        createHeading("1. Requisiti di Partecipazione"),
                        ...renderMultiLotSection(data['1_requisiti_partecipazione'], (lotData) => [
                            createSubHeading("Ordine Generale"),
                            ...createList(lotData.ordine_generale, 'requisito'),
                            createSubHeading("Ordine Speciale"),
                            ...createList(lotData.ordine_speciale, 'requisito'),
                            createSubHeading("Idoneità Professionale"),
                            ...createList(lotData.idoneita_professionale, 'requisito'),
                            createSubHeading("Capacità Tecnica"),
                            ...createList(lotData.capacita_tecnica, 'requisito'),

                            ...(lotData.rti_consorzi ? [createKeyValueLine("RTI/Consorzi", lotData.rti_consorzi)] : []),
                            ...(lotData.avvalimento ? [createKeyValueLine("Avvalimento", lotData.avvalimento)] : []),
                            ...(lotData.subappalto ? [createKeyValueLine("Subappalto", lotData.subappalto)] : []),
                        ]),
                        ...createDeepDiveSection(data.deep_dives?.['1_requisiti_partecipazione']),
                    ] : []),

                    // 3. Sintesi
                    ...(shouldInclude('3_sintesi') ? [
                        createHeading("2. Sintesi Gara"),
                        new Paragraph({ text: safeText(data['3_sintesi']?.scenario) }),
                        createKeyValueLine("Riferimento", data['3_sintesi']?.ref),
                        ...createDeepDiveSection(data.deep_dives?.['3_sintesi']),
                    ] : []),

                    // 3b. Checklist Busta Amministrativa
                    ...(shouldInclude('3b_checklist_amministrativa') ? [
                        createHeading("2b. Checklist Busta Amministrativa"),
                        ...renderMultiLotSection(data['3b_checklist_amministrativa'], (lotData) => [
                            createSubHeading("Garanzia Provvisoria"),
                            createKeyValueLine("Importo", lotData.garanzia_provvisoria?.importo),
                            createKeyValueLine("Beneficiario", lotData.garanzia_provvisoria?.beneficiario),
                            createKeyValueLine("Validità", lotData.garanzia_provvisoria?.validita),
                            createKeyValueLine("Clausole", lotData.garanzia_provvisoria?.clausole),

                            createSubHeading("Contributo ANAC"),
                            createKeyValueLine("Importo", lotData.contributo_anac?.importo),
                            createKeyValueLine("CIG", lotData.contributo_anac?.cig),

                            createSubHeading("Sopralluogo"),
                            createKeyValueLine("Stato", lotData.sopralluogo?.stato),
                            createKeyValueLine("Modalità", lotData.sopralluogo?.modalita),

                            createSubHeading("Imposta di Bollo"),
                            createKeyValueLine("Importo", lotData.imposta_bollo?.importo),
                            createKeyValueLine("Modalità", lotData.imposta_bollo?.modalita),

                            createSubHeading("Firma e Piattaforma"),
                            createKeyValueLine("Formato Firma", lotData.firma_formato?.formato),
                            createKeyValueLine("Piattaforma", lotData.firma_formato?.piattaforma),

                            createSubHeading("Elenco Documenti"),
                            ...createList(lotData.elenco_documenti, 'documento'),
                        ]),
                        ...createDeepDiveSection(data.deep_dives?.['3b_checklist_amministrativa']),
                    ] : []),

                    // 4. Servizi
                    ...(shouldInclude('4_servizi') ? [
                        createHeading("3. Dettaglio Servizi"),
                        ...renderMultiLotSection(data['4_servizi'], (lotData) => [
                            createSubHeading("Attività"),
                            ...createList(lotData.attivita),
                            createSubHeading("Innovazioni"),
                            new Paragraph({ text: safeText(lotData.innovazioni) }),
                            createKeyValueLine("Fabbisogno", lotData.fabbisogno),
                        ]),
                        ...createDeepDiveSection(data.deep_dives?.['4_servizi']),
                    ] : []),

                    // 5. Scadenze
                    ...(shouldInclude('5_scadenze') ? [
                        createHeading("4. Scadenze"),
                        ...renderMultiLotSection(data['5_scadenze'], (lotData) => [
                            ...createList(lotData.timeline, 'evento', 'data'),
                            createSubHeading("Sopralluogo"),
                            createKeyValueLine("Previsto", lotData.sopralluogo?.previsto),
                            createKeyValueLine("Obbligatorio", lotData.sopralluogo?.obbligatorio),
                            createKeyValueLine("Modalità", lotData.sopralluogo?.modalita),
                            createKeyValueLine("Scadenze", lotData.sopralluogo?.scadenze),
                        ]),
                        ...createDeepDiveSection(data.deep_dives?.['5_scadenze']),
                    ] : []),

                    // 6. Importi
                    ...(shouldInclude('6_importi') ? [
                        createHeading("5. Quadro Economico"),
                        ...renderMultiLotSection(data['6_importi'], (lotData) => [
                            createKeyValueLine("Base d'Asta", formatCurrency(lotData.base_asta_totale)),
                            createKeyValueLine("Costi Manodopera", formatCurrency(lotData.costi_manodopera)),
                            new Paragraph({ text: "", spacing: { after: 200 } }),
                            createTable(getList(lotData.dettaglio).map(d => [getText(d, 'voce'), formatCurrency(d.importo)])),
                        ]),
                        ...createDeepDiveSection(data.deep_dives?.['6_importi']),
                    ] : []),

                    // 7. Durata
                    ...(shouldInclude('7_durata') ? [
                        createHeading("6. Durata"),
                        ...renderMultiLotSection(data['7_durata'], (lotData) => [
                            createKeyValueLine("Durata Base", lotData.durata_base),
                            createKeyValueLine("Proroghe", lotData.proroghe),
                            createKeyValueLine("Tempistiche Operative", lotData.tempistiche_operative),
                        ]),
                        ...createDeepDiveSection(data.deep_dives?.['7_durata']),
                    ] : []),

                    // 8. CCNL
                    ...(shouldInclude('8_ccnl') ? [
                        createHeading("7. CCNL"),
                        ...renderMultiLotSection(data['8_ccnl'], (lotData) => [
                            createSubHeading("Contratti Applicabili"),
                            ...createList(lotData.contratti),
                            createSubHeading("Equivalenze"),
                            new Paragraph({ text: safeText(lotData.equivalenze) }),
                            createSubHeading("Clausola Sociale"),
                            new Paragraph({ text: safeText(lotData.clausola_sociale) }),
                        ]),
                        ...createDeepDiveSection(data.deep_dives?.['8_ccnl']),
                    ] : []),

                    // 9. Oneri
                    ...(shouldInclude('9_oneri') ? [
                        createHeading("8. Ripartizione Oneri"),
                        ...renderMultiLotSection(data['9_oneri'], (lotData) => [
                            createSubHeading("A Carico Fornitore"),
                            ...createList(lotData.carico_fornitore),
                            createSubHeading("A Carico Stazione Appaltante"),
                            ...createList(lotData.carico_stazione),
                        ]),
                        ...createDeepDiveSection(data.deep_dives?.['9_oneri']),
                    ] : []),

                    // 10. Punteggi
                    ...(shouldInclude('10_punteggi') ? [
                        createHeading("9. Criteri di Valutazione"),
                        ...renderMultiLotSection(data['10_punteggi'], (lotData) => [
                            new Paragraph({ text: `Tecnico: ${lotData.tecnico || 0} / Economico: ${lotData.economico || 0}` }),
                            new Paragraph({ text: `Soglia Sbarramento: ${lotData.soglia_sbarramento || 0}` }),
                            createSubHeading("Criteri Tecnici"),
                            ...getList(lotData.criteri_tecnici).flatMap(c => [
                                new Paragraph({
                                    children: [
                                        new TextRun({ text: getText(c, 'criterio'), bold: true }),
                                        new TextRun(` (${c.punti_max || 0} pt)`)
                                    ],
                                    spacing: { before: 200 }
                                }),
                                new Paragraph({ text: getText(c, 'descrizione') }),
                                ...createList(c.subcriteri, 'descrizione')
                            ]),
                            createSubHeading("Formula Economica"),
                            new Paragraph({ text: safeText(lotData.formula_economica) }),
                        ]),
                        ...createDeepDiveSection(data.deep_dives?.['10_punteggi']),
                    ] : []),

                    // 11. Pena Esclusione
                    ...(shouldInclude('11_pena_esclusione') ? [
                        createHeading("10. Prescrizioni a Pena di Esclusione"),
                        // This section is often just a flat list, or a list of lots.
                        // We use a generic renderer that handles both.
                        ...renderGenericListSection(data['11_pena_esclusione'], 'elementi', 'descrizione'),
                        ...createDeepDiveSection(data.deep_dives?.['11_pena_esclusione']),
                    ] : []),

                    // 12. Offerta Tecnica
                    ...(shouldInclude('12_offerta_tecnica') ? [
                        createHeading("11. Offerta Tecnica"),
                        ...renderMultiLotSection(data['12_offerta_tecnica'], (lotData) => [
                            createSubHeading("Documenti Richiesti"),
                            ...createList(lotData.documenti),
                            createSubHeading("Modalità e Formattazione"),
                            new Paragraph({ text: safeText(lotData.formattazione_modalita) }),
                        ]),
                        ...createDeepDiveSection(data.deep_dives?.['12_offerta_tecnica']),
                    ] : []),

                    // 13. Offerta Economica
                    ...(shouldInclude('13_offerta_economica') ? [
                        createHeading("12. Offerta Economica"),
                        ...renderMultiLotSection(data['13_offerta_economica'], (lotData) => [
                            createSubHeading("Documenti Richiesti"),
                            ...createList(lotData.documenti),
                            createSubHeading("Modalità e Formattazione"),
                            new Paragraph({ text: safeText(lotData.formattazione_modalita) }),
                        ]),
                        ...createDeepDiveSection(data.deep_dives?.['13_offerta_economica']),
                    ] : []),

                    // 14. Note Importanti
                    ...(shouldInclude('14_note_importanti') ? [
                        createHeading("13. Note Importanti AI"),
                        ...renderGenericListSection(data['14_note_importanti'], 'note', 'nota'),
                        ...createDeepDiveSection(data.deep_dives?.['14_note_importanti']),
                    ] : []),

                    // 17. Ambiguità e Punti da Chiarire
                    ...(shouldInclude('17_ambiguita_punti_da_chiarire') ? [
                        createHeading("14. Ambiguità e Punti da Chiarire"),
                        ...renderMultiLotSection(data['17_ambiguita_punti_da_chiarire'], (lotData) => [
                            createSubHeading("Ambiguità Rilevate"),
                            ...getList(lotData.ambiguita).flatMap(a => [
                                new Paragraph({
                                    children: [
                                        new TextRun({ text: `[${getText(a, 'tipo')}] `, bold: true }),
                                        new TextRun(getText(a, 'descrizione'))
                                    ],
                                    bullet: { level: 0 }
                                }),
                            ]),

                            createSubHeading("Suggerimenti per Quesiti"),
                            ...getList(lotData.punti_da_chiarire).flatMap(q => [
                                new Paragraph({
                                    children: [
                                        new TextRun({ text: "Quesito: ", bold: true }),
                                        new TextRun({ text: getText(q, 'quesito_suggerito'), italics: true })
                                    ],
                                    bullet: { level: 0 }
                                }),
                            ]),
                        ]),
                        ...createDeepDiveSection(data.deep_dives?.['17_ambiguita_punti_da_chiarire']),
                    ] : []),

                    // 15. Remunerazione
                    ...(shouldInclude('15_remunerazione') ? [
                        createHeading("14. Remunerazione"),
                        ...renderMultiLotSection(data['15_remunerazione'], (lotData) => [
                            createKeyValueLine("Modalità", lotData.modalita),
                            createKeyValueLine("Pagamenti", lotData.pagamenti),
                            createKeyValueLine("Clausole", lotData.clausole),
                        ]),
                        ...createDeepDiveSection(data.deep_dives?.['15_remunerazione']),
                    ] : []),

                    // 16. SLA e Penali
                    ...(shouldInclude('16_sla_penali') ? [
                        createHeading("15. SLA e Penali"),
                        ...renderSlaPenaliSection(data['16_sla_penali']),
                        ...createDeepDiveSection(data.deep_dives?.['16_sla_penali']),
                    ] : []),

                    // 17. FAQ
                    ...(shouldInclude('faq') && data.deep_dives && Object.keys(data.deep_dives).length > 0 ? [
                        createHeading("16. FAQ & Approfondimenti"),
                        ...createDeepDiveSection(data.deep_dives?.['faq']),
                    ] : []),

                    // Footer with Date
                    new Paragraph({
                        text: "",
                        spacing: { before: 1000 },
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({ text: "Data estrazione: ", italics: true }),
                            new TextRun({ text: new Date().toLocaleString('it-IT'), italics: true }),
                        ],
                        alignment: AlignmentType.RIGHT,
                        border: {
                            top: { style: BorderStyle.SINGLE, size: 1, color: "auto" }
                        },
                        spacing: { before: 500 }
                    })
                ],
            },
        ],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `Analisi_Gara_${new Date().toISOString().split('T')[0]}.docx`);
};

// --- RENDERERS ---

function renderMultiLotSection(data: any, renderer: (lotData: any) => any[]): any[] {
    const list = getList(data);
    if (list.length === 0) return [createNoDataParagraph()];

    // If it's a multi-lot structure, iterate lots
    if (isMultiLot(list)) {
        return list.flatMap(lot => [
            createLotHeader(lot.lotto),
            ...renderer(lot)
        ]);
    }

    // Otherwise, treat as single generic lot
    return renderer(list[0] || {});
}

function renderGenericListSection(data: any, nestedKey: string, textProp: string): any[] {
    const list = getList(data);
    if (list.length === 0) return [createNoDataParagraph()];

    // Case 1: Multi-lot structure
    if (isMultiLot(list)) {
        return list.flatMap(lot => {
            const items = getList(lot, nestedKey);
            return [
                createLotHeader(lot.lotto),
                ...(items.length > 0 ? createList(items, textProp) : [createBullet("Nessun elemento rilevato")])
            ];
        });
    }

    // Case 2: Flat list of items (e.g. data is just [ {nota: "A"}, {nota: "B"} ])
    // OR data is { note: [...] }
    // We try to extract the list from the first item if it looks like a container, or use the list itself
    let items = list;
    if (list.length === 1 && list[0][nestedKey]) {
        items = getList(list[0], nestedKey);
    }

    if (items.length === 0) return [createNoDataParagraph()];
    return createList(items, textProp);
}

function renderSlaPenaliSection(data: any): any[] {
    // The data structure is expected to be an array where the first item contains the 'sla' and 'penali' arrays.
    // data['16_sla_penali'][0].sla = [{ indicatore, soglia }, ...]
    // data['16_sla_penali'][0].penali = [{ descrizione, calcolo }, ...]

    const list = getList(data);
    if (list.length === 0) return [createNoDataParagraph()];

    const renderContent = (item: any) => {
        const slaList = Array.isArray(item.sla) ? item.sla : [];
        const penaliList = Array.isArray(item.penali) ? item.penali : [];

        return [
            createSubHeading("Service Level Agreement (SLA)"),
            ...(slaList.length > 0
                ? slaList.flatMap((s: any) => [
                    createBullet(`Indicatore: ${getText(s, 'indicatore')}`),
                    new Paragraph({
                        text: `   Soglia: ${getText(s, 'soglia')}`,
                        spacing: { after: 100 }
                    })
                ])
                : [createBullet("Nessun SLA specifico rilevato")]),

            createSubHeading("Penali Applicabili"),
            ...(penaliList.length > 0
                ? penaliList.flatMap((p: any) => [
                    createBullet(`Descrizione: ${getText(p, 'descrizione')}`),
                    new Paragraph({
                        text: `   Calcolo: ${getText(p, 'calcolo')}`,
                        spacing: { after: 100 }
                    })
                ])
                : [createBullet("Nessuna penale specifica rilevata")]),

            createSubHeading("Clausole Cumulative"),
            new Paragraph({
                text: safeText(item.clausole_cumulative),
                spacing: { before: 100, after: 200 }
            })
        ];
    };

    // Keep multi-lot support just in case, though the UI seems to treat it as single block mostly.
    if (isMultiLot(list)) {
        return list.flatMap(lot => [
            createLotHeader(lot.lotto),
            ...renderContent(lot)
        ]);
    }

    return renderContent(list[0] || {});
}

// --- COMPONENTS ---

function createNoDataParagraph() {
    return new Paragraph({
        text: "Non rilevato",
        run: { color: "999999", italics: true }
    });
}

function createHeading(text: string) {
    return new Paragraph({
        text: text,
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 },
        run: { color: "2E74B5" }
    });
}

function createSubHeading(text: string) {
    return new Paragraph({
        text: text,
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 },
        run: { color: "444444" }
    });
}

function createLotHeader(lotto: string | undefined) {
    if (!lotto || lotto === "Unico / Generale") return new Paragraph({});
    return new Paragraph({
        text: `Lotto: ${lotto}`,
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 300, after: 100 },
        run: { bold: true, color: "E25041" }
    });
}

function createKeyValueLine(key: string, value: string | undefined | null, center: boolean = false) {
    return new Paragraph({
        children: [
            new TextRun({ text: `${key}: `, bold: true }),
            new TextRun(safeText(value))
        ],
        alignment: center ? AlignmentType.CENTER : AlignmentType.LEFT,
        spacing: { after: 100 }
    });
}

function createBullet(text: string) {
    return new Paragraph({
        text: safeText(text),
        bullet: { level: 0 }
    });
}

function createList(items: any[], textProp?: string, labelProp?: string) {
    if (!items || items.length === 0) return [];
    return items.map(i => {
        let text = getText(i, textProp);
        if (labelProp) {
            const label = getText(i, labelProp);
            text = `${label}: ${text}`;
        }
        // Add ref if available
        if (typeof i === 'object' && i.ref) {
            text += ` [Ref: ${i.ref}]`;
        }
        return createBullet(text);
    });
}

function createTable(rows: string[][]) {
    if (!rows || rows.length === 0) return new Paragraph("Nessun dato disponibile");
    return new Table({
        rows: rows.map(row =>
            new TableRow({
                children: row.map(cell =>
                    new TableCell({
                        children: [new Paragraph(cell)],
                        width: { size: 100 / row.length, type: WidthType.PERCENTAGE },
                    })
                ),
            })
        ),
        width: { size: 100, type: WidthType.PERCENTAGE }
    });
}

function createDeepDiveSection(qaList: { question: string, answer: string }[] | undefined) {
    if (!qaList || qaList.length === 0) return [];
    return [
        new Paragraph({
            text: "Approfondimenti (Q&A)",
            heading: HeadingLevel.HEADING_3,
            spacing: { before: 200, after: 100 },
            run: { color: "555555" }
        }),
        ...qaList.flatMap(qa => [
            new Paragraph({
                children: [
                    new TextRun({ text: "D: " + qa.question, bold: true, italics: true, color: "2E74B5" })
                ],
                spacing: { after: 50 }
            }),
            new Paragraph({
                children: [
                    new TextRun({ text: "R: ", bold: true }),
                    new TextRun(qa.answer)
                ],
                spacing: { after: 200 }
            })
        ])
    ];
}

function formatCurrency(amount: number | undefined): string {
    if (amount === undefined || amount === null) return "-";
    return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(amount);
}
