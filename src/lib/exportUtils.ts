import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, BorderStyle } from "docx";
import { saveAs } from "file-saver";
import type { AnalysisResult } from "@/types";

export const exportToDocx = async (data: AnalysisResult) => {
    const doc = new Document({
        sections: [
            {
                properties: {},
                children: [
                    // Cover Page
                    new Paragraph({
                        text: "Report di Analisi Gara",
                        heading: HeadingLevel.TITLE,
                        alignment: "center",
                        spacing: { after: 300 },
                    }),
                    new Paragraph({
                        text: safeText(data['3_sintesi']?.oggetto),
                        heading: HeadingLevel.HEADING_1,
                        alignment: "center",
                        spacing: { after: 500 },
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({ text: "CIG: ", bold: true }),
                            new TextRun(safeText(data['3_sintesi']?.codici?.cig)),
                        ],
                        alignment: "center",
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({ text: "CUP: ", bold: true }),
                            new TextRun(safeText(data['3_sintesi']?.codici?.cup)),
                        ],
                        alignment: "center",
                    }),
                    new Paragraph({
                        text: "",
                        pageBreakBefore: true,
                    }),

                    // 1. Requisiti di Partecipazione
                    createHeading("1. Requisiti di Partecipazione"),
                    createSubHeading("Ordine Generale"),
                    ...createRequirementsList(data['1_requisiti_partecipazione']?.ordine_generale),
                    createSubHeading("Ordine Speciale"),
                    ...createRequirementsList(data['1_requisiti_partecipazione']?.ordine_speciale),
                    createSubHeading("Idoneità Professionale"),
                    ...createRequirementsList(data['1_requisiti_partecipazione']?.idoneita_professionale),
                    createSubHeading("Capacità Tecnica"),
                    ...createRequirementsList(data['1_requisiti_partecipazione']?.capacita_tecnica),

                    // 3. Sintesi
                    createHeading("2. Sintesi Gara"),
                    new Paragraph({ text: safeText(data['3_sintesi']?.scenario) }),

                    // 4. Servizi
                    createHeading("3. Dettaglio Servizi"),
                    createSubHeading("Attività"),
                    ...(data['4_servizi']?.attivita?.map(a => createBullet(a)) || [createBullet("Nessuna attività rilevata")]),
                    createSubHeading("Innovazioni"),
                    new Paragraph({ text: safeText(data['4_servizi']?.innovazioni) }),

                    // 5. Scadenze
                    createHeading("4. Scadenze"),
                    ...(data['5_scadenze'].timeline?.map(s => new Paragraph({
                        children: [
                            new TextRun({ text: safeText(s.data) + ": ", bold: true }),
                            new TextRun(safeText(s.evento))
                        ],
                        spacing: { after: 100 }
                    })) || []),
                    createSubHeading("Sopralluogo"),
                    new Paragraph({
                        children: [
                            new TextRun({ text: "Previsto: ", bold: true }),
                            new TextRun(safeText(data['5_scadenze'].sopralluogo?.previsto))
                        ]
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({ text: "Obbligatorio: ", bold: true }),
                            new TextRun(safeText(data['5_scadenze'].sopralluogo?.obbligatorio))
                        ]
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({ text: "Modalità: ", bold: true }),
                            new TextRun(safeText(data['5_scadenze'].sopralluogo?.modalita))
                        ]
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({ text: "Scadenze: ", bold: true }),
                            new TextRun(safeText(data['5_scadenze'].sopralluogo?.scadenze))
                        ]
                    }),

                    // 6. Importi
                    createHeading("5. Quadro Economico"),
                    new Paragraph({
                        children: [
                            new TextRun({ text: "Base d'Asta: ", bold: true }),
                            new TextRun(formatCurrency(data['6_importi']?.base_asta_totale))
                        ]
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({ text: "Costi Manodopera: ", bold: true }),
                            new TextRun(formatCurrency(data['6_importi']?.costi_manodopera))
                        ],
                        spacing: { after: 200 }
                    }),
                    createTable(data['6_importi']?.dettaglio?.map(d => [safeText(d.voce), formatCurrency(d.importo)]) || []),

                    // 7. Durata
                    createHeading("6. Durata"),
                    new Paragraph({ text: `Durata Base: ${safeText(data['7_durata']?.durata_base)}` }),
                    new Paragraph({ text: `Proroghe: ${safeText(data['7_durata']?.proroghe)}` }),

                    // 8. CCNL
                    createHeading("7. CCNL"),
                    createSubHeading("Contratti Applicabili"),
                    ...(data['8_ccnl']?.contratti?.map(c => createBullet(c)) || [createBullet("Nessun contratto specifico rilevato")]),
                    createSubHeading("Equivalenze"),
                    new Paragraph({ text: safeText(data['8_ccnl']?.equivalenze) }),

                    // 9. Oneri
                    createHeading("8. Ripartizione Oneri"),
                    createSubHeading("A Carico Fornitore"),
                    ...(data['9_oneri']?.carico_fornitore?.map(c => createBullet(c)) || [createBullet("Nessun onere specifico rilevato")]),
                    createSubHeading("A Carico Stazione Appaltante"),
                    ...(data['9_oneri']?.carico_stazione?.map(c => createBullet(c)) || [createBullet("Nessun onere specifico rilevato")]),

                    // 10. Punteggi
                    createHeading("9. Criteri di Valutazione"),
                    new Paragraph({ text: `Tecnico: ${data['10_punteggi']?.tecnico || 0} / Economico: ${data['10_punteggi']?.economico || 0}` }),
                    new Paragraph({ text: `Soglia Sbarramento: ${data['10_punteggi']?.soglia_sbarramento || 0}` }),
                    createSubHeading("Criteri Tecnici"),
                    ...(data['10_punteggi']?.criteri_tecnici?.flatMap(c => [
                        new Paragraph({
                            children: [
                                new TextRun({ text: safeText(c.criterio), bold: true }),
                                new TextRun(` (${c.punti_max || 0} pt)`)
                            ],
                            spacing: { before: 200 }
                        }),
                        new Paragraph({ text: safeText(c.descrizione) }),
                        ...(c.subcriteri?.map(s => createBullet(`${safeText(s.descrizione)} (${s.punti_max || 0} pt)`)) || [])
                    ]) || []),

                    // 11. Pena Esclusione
                    createHeading("10. Prescrizioni a Pena di Esclusione"),
                    ...(data['11_pena_esclusione']?.map(p => createBullet(p.descrizione)) || []),

                    // 12. Offerta Tecnica
                    createHeading("11. Offerta Tecnica"),
                    createSubHeading("Documenti Richiesti"),
                    ...(data['12_offerta_tecnica']?.documenti?.map(d => createBullet(d)) || [createBullet("Nessun documento specifico rilevato")]),
                    createSubHeading("Modalità e Formattazione"),
                    new Paragraph({ text: safeText(data['12_offerta_tecnica']?.formattazione_modalita) }),

                    // 13. Offerta Economica
                    createHeading("12. Offerta Economica"),
                    createSubHeading("Documenti Richiesti"),
                    ...(data['13_offerta_economica']?.documenti?.map(d => createBullet(d)) || [createBullet("Nessun documento specifico rilevato")]),
                    createSubHeading("Modalità e Formattazione"),
                    new Paragraph({ text: safeText(data['13_offerta_economica']?.formattazione_modalita) }),

                    // 14. Note Importanti
                    createHeading("13. Note Importanti AI"),
                    ...(data['14_note_importanti']?.map(n => createBullet(n.nota)) || [createBullet("Nessuna nota particolare")]),

                    // 15. Remunerazione
                    createHeading("14. Remunerazione"),
                    new Paragraph({ text: `Modalità: ${safeText(data['15_remunerazione']?.modalita)}` }),
                    new Paragraph({ text: `Pagamenti: ${safeText(data['15_remunerazione']?.pagamenti)}` }),
                    new Paragraph({ text: `Clausole: ${safeText(data['15_remunerazione']?.clausole)}` }),

                    // 16. SLA e Penali
                    createHeading("15. SLA e Penali"),
                    createSubHeading("SLA"),
                    createTable(data['16_sla_penali']?.sla?.map(s => [safeText(s.indicatore), safeText(s.soglia)]) || []),
                    createSubHeading("Penali"),
                    createTable(data['16_sla_penali']?.penali?.map(p => [safeText(p.descrizione), safeText(p.calcolo)]) || []),
                    new Paragraph({
                        text: `Clausole Cumulative: ${safeText(data['16_sla_penali']?.clausole_cumulative)}`,
                        spacing: { before: 200 }
                    }),

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
                        alignment: "right",
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

// Helpers
function safeText(text: string | undefined | null): string {
    return text || "-";
}

function formatCurrency(amount: number | undefined): string {
    if (amount === undefined || amount === null) return "-";
    return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(amount);
}

function createHeading(text: string) {
    return new Paragraph({
        text: text,
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 },
    });
}

function createSubHeading(text: string) {
    return new Paragraph({
        text: text,
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 },
    });
}

function createBullet(text: string) {
    return new Paragraph({
        text: safeText(text),
        bullet: {
            level: 0
        }
    });
}

function createRequirementsList(items: { requisito: string }[] | undefined) {
    if (!items || items.length === 0) return [createBullet("Nessun requisito specifico rilevato")];
    return items.map(i => createBullet(i.requisito));
}

function createTable(rows: string[][]) {
    if (!rows || rows.length === 0) return new Paragraph("Nessun dato disponibile");

    return new Table({
        rows: rows.map(row =>
            new TableRow({
                children: row.map(cell =>
                    new TableCell({
                        children: [new Paragraph(cell)],
                        width: {
                            size: 50,
                            type: WidthType.PERCENTAGE,
                        },
                    })
                ),
            })
        ),
        width: {
            size: 100,
            type: WidthType.PERCENTAGE,
        }
    });
}
