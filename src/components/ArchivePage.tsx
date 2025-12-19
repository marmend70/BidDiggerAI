import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Trash2, FileText, Download, Search, Loader2, Archive } from 'lucide-react';
import type { AnalysisResult, UserPreferences } from '@/types';
import { SummaryModal } from './SummaryModal';
import { exportToDocx } from '@/lib/exportUtils';
import { Document, Packer, Paragraph, Table, TableCell, TableRow, WidthType, TextRun, HeadingLevel, BorderStyle } from 'docx';
import { saveAs } from 'file-saver';
import { ArchiveTimeline, type TimelineItem } from './ArchiveTimeline';
import { User, CheckCircle2, XCircle, Clock, Send } from 'lucide-react'; // Added icons for status visualization

interface ArchivePageProps {
    userId: string;
    onLoadAnalysis: (data: AnalysisResult) => void;
    userPreferences?: UserPreferences;
}

interface ArchivedAnalysis {
    id: string; // analysis id
    tender_id: string;
    created_at: string;
    result_json: AnalysisResult;
    tenders: {
        title: string;
        tender_status: string;
        owner: string;

        numeric_id: number;
        notes: string;
    };
}

const TENDER_STATUSES = [
    'In valutazione',
    'Decisa: Go',
    'Decisa: No Go',
    'Assegnata',
    'Presentata'
];

export function ArchivePage({ userId, onLoadAnalysis, userPreferences }: ArchivePageProps) {
    const [analyses, setAnalyses] = useState<ArchivedAnalysis[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedAnalysis, setSelectedAnalysis] = useState<AnalysisResult | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchAnalyses();
    }, [userId]);

    const fetchAnalyses = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('analyses')
                .select(`
          id,
          tender_id,
          created_at,
          result_json,
            tenders!inner (
              title,
              user_id,

              tender_status,
              owner,

              numeric_id,
              notes
            )
        `)
                .eq('tenders.user_id', userId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setAnalyses((data || []) as any);
        } catch (error) {
            console.error('Error fetching analyses:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (e: React.MouseEvent, tenderId: string) => {
        e.stopPropagation();
        if (!confirm('Sei sicuro di voler eliminare questa analisi? I file e i dati verranno rimossi permanentemente.')) return;

        try {
            // 1. Get files associated with this tender
            const { data: files } = await supabase
                .from('tender_documents')
                .select('file_path')
                .eq('tender_id', tenderId);

            if (files && files.length > 0) {
                const searchPaths = files.map(f => f.file_path);
                // 2. Delete files from Storage
                const { error: storageError } = await supabase
                    .storage
                    .from('tenders')
                    .remove(searchPaths);

                if (storageError) {
                    console.error('Storage deletion error:', storageError);
                    // We continue to delete the DB record even if storage fails, 
                    // to ensure UI consistency, but valid concern for orphan files.
                }
            }

            // 3. Delete DB record
            const { error } = await supabase
                .from('tenders')
                .delete()
                .eq('id', tenderId);

            if (error) throw error;

            setAnalyses(prev => prev.filter(a => a.tender_id !== tenderId));
        } catch (error) {
            console.error('Error deleting analysis:', error);
            alert('Errore durante l\'eliminazione');
        }
    };

    const handleExport = async (e: React.MouseEvent, analysis: AnalysisResult) => {
        e.stopPropagation();
        try {
            await exportToDocx(analysis);
        } catch (error) {
            console.error('Export failed:', error);
            alert('Errore durante l\'esportazione');
        }
    };

    const handleUpdateStatus = async (tenderId: string, newStatus: string) => {
        try {
            // Logic check for Owner configuration warning
            if (newStatus === 'Assegnata') {
                if (!userPreferences?.owners || userPreferences.owners.length === 0) {
                    alert("ATTENZIONE: La lista dei Responsabili è vuota. Vai in Configurazioni per aggiungere i nominativi.");
                    // We allow setting the status, but user will be reminded.
                }
            }

            const { error } = await supabase
                .from('tenders')
                .update({ tender_status: newStatus })
                .eq('id', tenderId);

            if (error) throw error;

            setAnalyses(prev => prev.map(a =>
                a.tender_id === tenderId
                    ? { ...a, tenders: { ...a.tenders, tender_status: newStatus } }
                    : a
            ));
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Errore nell\'aggiornamento dello stato');
        }
    };

    const handleUpdateOwner = async (tenderId: string, newOwner: string) => {
        try {
            const { error } = await supabase
                .from('tenders')
                .update({ owner: newOwner })
                .eq('id', tenderId);

            if (error) throw error;

            setAnalyses(prev => prev.map(a =>
                a.tender_id === tenderId
                    ? { ...a, tenders: { ...a.tenders, owner: newOwner } }
                    : a
            ));
        } catch (error) {
            console.error('Error updating owner:', error);
            alert("Errore durante l'assegnazione del responsabile. Riprova.");
        }
    };

    const handleUpdateNotes = async (tenderId: string, newNotes: string) => {
        try {
            const { error } = await supabase
                .from('tenders')
                .update({ notes: newNotes })
                .eq('id', tenderId);

            if (error) throw error;

            setAnalyses(prev => prev.map(a =>
                a.tender_id === tenderId
                    ? { ...a, tenders: { ...a.tenders, notes: newNotes } }
                    : a
            ));
        } catch (error) {
            console.error('Error updating notes:', error);
        }
    };

    const handleSummary = (e: React.MouseEvent, analysis: AnalysisResult) => {
        e.stopPropagation();
        setSelectedAnalysis(analysis);
    };

    const filteredAnalyses = analyses.filter(a => {
        const searchLower = searchTerm.toLowerCase();
        const title = a.tenders?.title?.toLowerCase() || '';
        const object = a.result_json['3_sintesi']?.oggetto?.toLowerCase() || '';
        return title.includes(searchLower) || object.includes(searchLower);
    });

    const handleDeleteAll = async () => {
        if (!confirm('ATTENZIONE: Sei sicuro di voler eliminare TUTTE le analisi in archivio? Questa azione è irreversibile e cancellerà tutti i dati.')) return;
        if (!confirm('Confermi definitivamente l\'eliminazione TOTALE dell\'archivio?')) return;

        try {
            // Delete all tenders for this user (cascade deletes analyses)
            const { error } = await supabase
                .from('tenders')
                .delete()
                .eq('user_id', userId);

            if (error) throw error;

            setAnalyses([]);
        } catch (error) {
            console.error('Error deleting all analyses:', error);
            alert('Errore durante l\'eliminazione di tutte le analisi');
        }
    };

    const handleDownloadReport = async () => {
        try {
            const tableRows = [
                // Header Row
                new TableRow({
                    children: [
                        new TableCell({
                            children: [new Paragraph({ children: [new TextRun({ text: "ID Gara", bold: true })] })],
                            width: { size: 10, type: WidthType.PERCENTAGE },
                            shading: { fill: "EEEEEE" }
                        }),
                        new TableCell({
                            children: [new Paragraph({ children: [new TextRun({ text: "Oggetto", bold: true })] })],
                            width: { size: 30, type: WidthType.PERCENTAGE },
                            shading: { fill: "EEEEEE" }
                        }),
                        new TableCell({
                            children: [new Paragraph({ children: [new TextRun({ text: "Ente / Stazione Appaltante", bold: true })] })],
                            width: { size: 20, type: WidthType.PERCENTAGE },
                            shading: { fill: "EEEEEE" }
                        }),
                        new TableCell({
                            children: [new Paragraph({ children: [new TextRun({ text: "Scadenza Offerta", bold: true })] })],
                            width: { size: 15, type: WidthType.PERCENTAGE },
                            shading: { fill: "EEEEEE" }
                        }),
                        new TableCell({
                            children: [new Paragraph({ children: [new TextRun({ text: "Stato", bold: true })] })],
                            width: { size: 10, type: WidthType.PERCENTAGE },
                            shading: { fill: "EEEEEE" }
                        }),
                        new TableCell({
                            children: [new Paragraph({ children: [new TextRun({ text: "Responsabile", bold: true })] })],
                            width: { size: 15, type: WidthType.PERCENTAGE },
                            shading: { fill: "EEEEEE" }
                        }),
                        new TableCell({
                            children: [new Paragraph({ children: [new TextRun({ text: "Note", bold: true })] })],
                            width: { size: 10, type: WidthType.PERCENTAGE },
                            shading: { fill: "EEEEEE" }
                        }),
                    ],
                }),
                // Data Rows
                ...filteredAnalyses.map(a => {
                    const deadline = getOfferDeadline(a.result_json) || "N/D";
                    const object = a.result_json['3_sintesi']?.oggetto || a.tenders.title || "N/D";
                    const entity = a.result_json['3_sintesi']?.stazione_appaltante || a.result_json['3_sintesi']?.ente || "N/D";
                    const status = a.tenders.tender_status || "In valutazione";
                    const owner = a.tenders.owner || "-";
                    const id = a.tenders.numeric_id ? `#${a.tenders.numeric_id}` : "N/D";
                    const notes = a.tenders.notes || "-";

                    return new TableRow({
                        children: [
                            new TableCell({ children: [new Paragraph({ text: String(id) })] }),
                            new TableCell({ children: [new Paragraph({ text: object })] }),
                            new TableCell({ children: [new Paragraph({ text: entity })] }),
                            new TableCell({ children: [new Paragraph({ text: deadline })] }),
                            new TableCell({ children: [new Paragraph({ text: status })] }),
                            new TableCell({ children: [new Paragraph({ text: owner })] }),
                            new TableCell({ children: [new Paragraph({ text: notes })] }),
                        ],
                    });
                })
            ];

            const doc = new Document({
                sections: [{
                    properties: {
                        page: {
                            size: {
                                orientation: "landscape",
                            },
                        },
                    },
                    children: [
                        new Paragraph({
                            text: "Report Sintetico Gare",
                            heading: HeadingLevel.HEADING_1,
                            spacing: { after: 200 }
                        }),
                        new Paragraph({
                            text: `Generato il: ${new Date().toLocaleDateString('it-IT')}`,
                            spacing: { after: 400 }
                        }),
                        new Table({
                            rows: tableRows,
                            width: { size: 100, type: WidthType.PERCENTAGE },
                        })
                    ]
                }]
            });

            const blob = await Packer.toBlob(doc);
            saveAs(blob, `Report_Gare_BidDigger_${new Date().toISOString().split('T')[0]}.docx`);

        } catch (error) {
            console.error('Error generating report:', error);
            alert("Errore durante la generazione del report.");
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 text-amber-500 animate-spin" />
            </div>
        );
    }

    const getOfferDeadline = (analysis: AnalysisResult): string | null => {
        const timeline = analysis['5_scadenze']?.[0]?.timeline || [];
        // Look for keywords indicating the deadline
        const deadlineEvent = timeline.find(t =>
            t.evento.toLowerCase().includes('termine') ||
            t.evento.toLowerCase().includes('scadenza') ||
            t.evento.toLowerCase().includes('presentazione') ||
            t.evento.toLowerCase().includes('ricezione')
        );
        return deadlineEvent ? deadlineEvent.data : null;
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Archive className="h-6 w-6 text-amber-500" />
                        Bid Digger Dashboard
                    </h1>
                    <p className="text-slate-500 mt-1">Gestisci e consulta le tue analisi passate</p>
                </div>
                <div className="flex items-center gap-4">
                    {analyses.length > 0 && (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleDownloadReport}
                                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200"
                            >
                                <FileText className="h-4 w-4" />
                                Report Sintetico
                            </button>
                            <button
                                onClick={handleDeleteAll}
                                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-200"
                            >
                                <Trash2 className="h-4 w-4" />
                                Elimina tutto
                            </button>
                        </div>
                    )}
                    <div className="relative w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Cerca..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                        />
                    </div>
                </div>
            </div>

            {/* TIMELINE SECTION */}
            {
                analyses.length > 0 && (
                    <ArchiveTimeline
                        items={analyses.map(a => {
                            const deadline = getOfferDeadline(a.result_json);
                            let daysRemaining: number | null = null;
                            if (deadline) {
                                // Try to parse DD/MM/YYYY or YYYY-MM-DD
                                const parts = deadline.split(/[\/\-]/);
                                let d: Date | null = null;
                                if (parts.length === 3) {
                                    // Assume DD/MM/YYYY if first part is day (heuristic needed ideally, but usually DD/MM/YYYY in IT)
                                    // or try standard parsing.
                                    // Let's simplify: if we can parse it:
                                    // Typically "DD/MM/YYYY" in Italy
                                    if (parts[2].length === 4) d = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
                                    else d = new Date(deadline);
                                }

                                if (d && !isNaN(d.getTime())) {
                                    const diffTime = d.getTime() - new Date().getTime();
                                    daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                }
                            }

                            const ente = a.result_json['3_sintesi']?.stazione_appaltante || a.result_json['3_sintesi']?.ente;

                            return {
                                id: a.id,
                                numericId: a.tenders?.numeric_id || 0,
                                title: ente || a.tenders?.title || "Senza titolo", // Changed: prioritize Ente
                                deadline: deadline,
                                owner: a.tenders?.owner,
                                daysRemaining: daysRemaining,
                                status: a.tenders?.tender_status || 'In valutazione'
                            };
                        })}
                    />
                )
            }

            <div className="grid gap-4">
                {filteredAnalyses.length === 0 ? (
                    <div className="text-center py-12 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                        <p className="text-slate-500">Nessuna analisi trovata nell'archivio.</p>
                    </div>
                ) : (
                    filteredAnalyses.map((item) => {
                        const offerDeadline = getOfferDeadline(item.result_json);
                        const ente = item.result_json['3_sintesi']?.stazione_appaltante || item.result_json['3_sintesi']?.ente;
                        // Use Ente as main title if available, otherwise fallback to filename title
                        const displayTitle = ente || item.tenders?.title || "Senza titolo";
                        // If we have an Ente, display the original filename title smaller below
                        const subTitle = ente ? item.tenders?.title : null;

                        return (
                            <div
                                key={item.id}
                                onClick={() => {
                                    // ADAPTER LOGIC FOR ARCHIVED DATA
                                    const rawData = { ...item.result_json, tender_id: item.tender_id };

                                    Object.keys(rawData).forEach(key => {
                                        const section = rawData[key];
                                        if (section && typeof section === 'object') {
                                            // GENIUS RECOVERY STRATEGY:
                                            // 1. Try internal prop (if section is object wrapper)
                                            // 2. Try 'semantic_analysis_data' map at root (New Architecture)
                                            // Cast to any to access the sibling property safely
                                            const globalGeniusMap = (rawData as any).semantic_analysis_data;
                                            let globalGenius = globalGeniusMap ? globalGeniusMap[key] : undefined;

                                            // ALIAS RECOVERY FOR REQUISITI
                                            if (!globalGenius && key === '1_requisiti_partecipazione' && globalGeniusMap) {
                                                console.log("[Archive] Attempting alias lookup for 1_requisiti...");
                                                globalGenius = globalGeniusMap['1_requisiti'];
                                                if (globalGenius) console.log("[Archive] FOUND VIA ALIAS: 1_requisiti");
                                            }

                                            // DEBUG KEY INSPECTION
                                            if (key === '3b_checklist_amministrativa' || key === '1_requisiti_partecipazione') {
                                                console.log(`[Archive] Inspecting GlobalGenius for ${key}:`, globalGenius ? JSON.stringify(globalGenius).substring(0, 200) : "UNDEFINED");
                                                if (globalGeniusMap && !globalGenius) {
                                                    console.log(`[Archive] Available Keys in Map:`, Object.keys(globalGeniusMap));
                                                }
                                            }

                                            // ALIAS & LEGACY LOOKUP
                                            // 1. Try Global Map (Best Source)
                                            // 2. Try Section Prop (if object)
                                            // 3. Try Section[0] Prop (if array - Legacy)

                                            const geniusAnalysis = globalGenius?.semantic_analysis
                                                || globalGenius?.analisi_semantica
                                                || globalGenius?.analisi
                                                || section.semantic_analysis
                                                || (Array.isArray(section) && section[0]?.semantic_analysis);

                                            const geniusRisks = globalGenius?.rischi_rilevati
                                                || globalGenius?.rischi_formali
                                                || globalGenius?.rischi
                                                || section.rischi_rilevati
                                                || (Array.isArray(section) && section[0]?.rischi_rilevati);

                                            const geniusSuggestions = globalGenius?.suggerimenti
                                                || globalGenius?.suggerimenti_operativi
                                                || globalGenius?.azioni_consigliate
                                                || section.suggerimenti
                                                || (Array.isArray(section) && section[0]?.suggerimenti);

                                            // Determine data content (unwrap structured if present)
                                            // If structured is missing, we assume 'section' ITSELF is the data (Array or Legacy Object)
                                            let innerData = ('structured' in section) ? section.structured : section;

                                            // SAFETY UNWRAP:
                                            // Some sections are expected to be Objects by Dashboard (e.g. 3_sintesi), 
                                            // but the extractor might return them as a single-item Array in 'structured'.
                                            // (Already assigned to innerData above)

                                            // List of sections that MUST be objects (singletons)
                                            // Added 10_punteggi just in case, though dashboard seems to handle array[0] for it.
                                            // SINGLETONS HANDLING
                                            // WARNING: ONLY 3_sintesi is treated as a singleton object in Dashboard. 
                                            // The rest (scadenze, importi, etc.) are accessed as Arrays [0] in Dashboard.
                                            const SINGLETONS = ['3_sintesi', '_debug_info'];
                                            if (SINGLETONS.includes(key)) {
                                                if (Array.isArray(innerData)) {
                                                    if (innerData.length > 0) {
                                                        innerData = innerData[0];
                                                    } else {
                                                        innerData = {};
                                                    }
                                                }
                                            }

                                            // COPY for Mutability: Ensure we can attach properties
                                            // If it's an array, spread it. If it's an object, spread it.
                                            if (Array.isArray(innerData)) {
                                                innerData = [...innerData];
                                                // FALLBACK HOIST: If genius data is missing on container, check inside first element
                                                if (!geniusAnalysis && innerData.length > 0 && innerData[0].semantic_analysis) {
                                                    // It seems genius data is inside. Let's extract it for the container props.
                                                    // (Note: const variables above are read-only, we create new temp vars if needed, 
                                                    // but here we just pass the inner value if outer is missing)
                                                }
                                            } else if (innerData && typeof innerData === 'object') {
                                                innerData = { ...innerData };
                                            }

                                            rawData[key] = innerData;

                                            // If rawData[key] ends up undefined (e.g. missing structured), set empty to hold Genius props
                                            if (!rawData[key]) rawData[key] = {};

                                            if (rawData[key] && typeof rawData[key] === 'object') {
                                                // Fallback logic: Use container prop OR prop from first element (legacy/mixed format)
                                                const finalAnalysis = geniusAnalysis || (Array.isArray(section.structured) && section.structured[0]?.semantic_analysis);
                                                const finalRisks = geniusRisks || (Array.isArray(section.structured) && section.structured[0]?.rischi_rilevati);
                                                const finalSuggestions = geniusSuggestions || (Array.isArray(section.structured) && section.structured[0]?.suggerimenti);

                                                console.log(`[Archive] Genius Check for ${key}:`, { hasAnalysis: !!finalAnalysis, hasRisks: !!finalRisks });

                                                if (finalAnalysis) {
                                                    console.log(`[Archive] Injecting Semantic Analysis into ${key}`, finalAnalysis?.substring(0, 30));
                                                    rawData[key].semantic_analysis = finalAnalysis;
                                                    // ALSO INJECT into first element if it's an array (for Dashboard compatibility)
                                                    if (Array.isArray(rawData[key]) && rawData[key].length > 0) {
                                                        // We already shallow copied the array, but we need to shallow copy the first element to mutate it safely
                                                        rawData[key][0] = { ...rawData[key][0], semantic_analysis: finalAnalysis };
                                                        console.log(`[Archive] Injected Semantic Analysis into Array[0] of ${key}`);
                                                    }
                                                }
                                                if (finalRisks) {
                                                    rawData[key].rischi_rilevati = finalRisks;
                                                    if (Array.isArray(rawData[key]) && rawData[key].length > 0) {
                                                        rawData[key][0] = { ...rawData[key][0], rischi_rilevati: finalRisks };
                                                    }
                                                }
                                                if (finalSuggestions) {
                                                    rawData[key].suggerimenti = finalSuggestions;
                                                    if (Array.isArray(rawData[key]) && rawData[key].length > 0) {
                                                        rawData[key][0] = { ...rawData[key][0], suggerimenti: finalSuggestions };
                                                    }
                                                }
                                            }
                                        }
                                    });

                                    console.log("Archive Adapter - Final Data:", rawData);

                                    // VERIFY INJECTION (Debug)
                                    const debugChecklist = rawData['3b_checklist_amministrativa'];
                                    if (debugChecklist) {
                                        console.log("[Archive] VERIFY CHECKLIST INJECTION:", {
                                            isArray: Array.isArray(debugChecklist),
                                            hasRisksContainer: !!(debugChecklist as any).rischi_rilevati,
                                            hasRisksItem0: !!(Array.isArray(debugChecklist) && (debugChecklist[0] as any)?.rischi_rilevati),
                                            risksValue: (Array.isArray(debugChecklist) ? (debugChecklist[0] as any)?.rischi_rilevati : (debugChecklist as any).rischi_rilevati)
                                        });
                                    }

                                    // Validation check
                                    if (Array.isArray(rawData['3_sintesi'])) {
                                        console.warn("WARNING: 3_sintesi is an Array! Dashboard might crash.");
                                    }

                                    onLoadAnalysis(rawData);
                                    alert("Analisi caricata correttamente! Ora puoi navigare nelle sezioni.");
                                }}
                                className="group bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-amber-200 transition-all cursor-pointer"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-3 mb-2">
                                            <h3 className="font-semibold text-lg text-slate-900 truncate mr-2">
                                                {displayTitle}
                                            </h3>

                                            {/* Numeric ID Tag (New) */}
                                            {item.tenders?.numeric_id && (
                                                <span className="text-xs font-bold px-2 py-1 bg-amber-100 text-amber-800 rounded-md border border-amber-200">
                                                    #{item.tenders.numeric_id}
                                                </span>
                                            )}

                                            {/* Analysis Date Tag */}
                                            <span className="text-xs font-medium px-2 py-1 bg-slate-100 text-slate-600 rounded-full border border-slate-200 whitespace-nowrap">
                                                Analisi: {new Date(item.created_at).toLocaleDateString('it-IT')}
                                            </span>

                                            {/* Offer Deadline Tag */}
                                            {offerDeadline && (
                                                <span className="text-xs font-medium px-2 py-1 bg-amber-50 text-amber-700 rounded-full border border-amber-100 whitespace-nowrap">
                                                    Offerta: {offerDeadline}
                                                </span>
                                            )}

                                            {/* CIG Tag */}
                                            {item.result_json['3_sintesi']?.codici?.cig && (
                                                <span className="text-xs font-medium px-2 py-1 bg-blue-50 text-blue-600 rounded-full border border-blue-100 whitespace-nowrap">
                                                    CIG: {item.result_json['3_sintesi'].codici.cig}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-slate-600 text-sm line-clamp-2">
                                            {item.result_json['3_sintesi']?.oggetto || "Nessun oggetto estratto"}
                                        </p>

                                        {subTitle && (
                                            <p className="text-slate-400 text-xs mt-1 flex items-center gap-1">
                                                <FileText className="h-3 w-3" />
                                                {subTitle}
                                            </p>
                                        )}

                                        {/* STATUS & OWNER CONTROLS */}
                                        <div className="mt-4 flex flex-wrap items-center gap-4" onClick={(e) => e.stopPropagation()}>
                                            {/* Status Selector */}
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-medium text-slate-500">Stato:</span>
                                                <select
                                                    value={item.tenders?.tender_status || 'In valutazione'}
                                                    onChange={(e) => handleUpdateStatus(item.tender_id, e.target.value)}
                                                    className="text-sm border-slate-200 rounded-lg py-1 px-2 focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-slate-50"
                                                >
                                                    {TENDER_STATUSES.map(s => (
                                                        <option key={s} value={s}>{s}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            {/* Owner Input - Visible only if 'Assegnata' */}
                                            {item.tenders?.tender_status === 'Assegnata' && (
                                                <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-4 duration-300">
                                                    <span className="text-sm font-medium text-slate-500">Responsabile:</span>
                                                    <div className="relative">
                                                        <User className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
                                                        <select
                                                            value={item.tenders?.owner || ''}
                                                            onChange={(e) => handleUpdateOwner(item.tender_id, e.target.value)}
                                                            className="text-sm pl-8 pr-3 py-1 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent w-48 bg-white appearance-none"
                                                            onClick={(e) => {
                                                                if (!userPreferences?.owners || userPreferences.owners.length === 0) {
                                                                    alert("Nessun responsabile configurato. Vai nella sezione Configurazioni per aggiungere i nominativi.");
                                                                }
                                                            }}
                                                        >
                                                            <option value="">-- Nessun Responsabile --</option>
                                                            {userPreferences?.owners?.map((owner, idx) => (
                                                                <option key={idx} value={owner}>{owner}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Notes Section */}
                                        <div className="mt-3">
                                            <textarea
                                                className="w-full text-xs text-slate-600 border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-slate-50 resize-y min-h-[60px]"
                                                placeholder="Aggiungi note personali (max 300 caratteri)..."
                                                maxLength={300}
                                                defaultValue={item.tenders?.notes || ''}
                                                onBlur={(e) => handleUpdateNotes(item.tender_id, e.target.value)}
                                                onClick={(e) => e.stopPropagation()} // Prevent card click
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={(e) => handleSummary(e, item.result_json)}
                                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            title="Sintesi"
                                        >
                                            <FileText className="h-5 w-5" />
                                        </button>
                                        <button
                                            onClick={(e) => handleExport(e, item.result_json)}
                                            className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                            title="Estrai DOCX"
                                        >
                                            <Download className="h-5 w-5" />
                                        </button>
                                        <button
                                            onClick={(e) => handleDelete(e, item.tender_id)}
                                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Elimina"
                                        >
                                            <Trash2 className="h-5 w-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div >

            {
                selectedAnalysis && (
                    <SummaryModal
                        isOpen={!!selectedAnalysis}
                        onClose={() => setSelectedAnalysis(null)}
                        data={selectedAnalysis!}
                    />
                )
            }
        </div >
    );
}
