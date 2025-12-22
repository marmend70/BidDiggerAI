import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Trash2, FileText, Download, Search, Loader2, Archive, ChevronDown, Filter } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { AnalysisResult, UserPreferences } from '@/types';
import { SummaryModal } from './SummaryModal';
import { exportToDocx } from '@/lib/exportUtils';
import { Document, Packer, Paragraph, Table, TableCell, TableRow, WidthType, TextRun, HeadingLevel, BorderStyle } from 'docx';
import { saveAs } from 'file-saver';
import { ArchiveTimeline, type TimelineItem } from './ArchiveTimeline';
import { User, CheckCircle2, XCircle, Clock, Send, AlertCircle } from 'lucide-react';
import { TenderListItem } from './TenderListItem';
import { cn } from '@/lib/utils';

interface ArchivePageProps {
    userId: string;
    organizationId?: string | null; // NEW: Organization Support
    onLoadAnalysis: (data: AnalysisResult, tenderId: string) => void;
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
        owner_tech?: string;
        owner_admin?: string;
        owner_comm?: string;
        status_updated_at?: string;

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

const TAB_LABELS = {
    'TUTTE': 'Tutte',
    'DA_VALUTARE': 'Da Valutare',
    'INTERESSANTE': 'Interessante',
    'NON_INTERESSANTE': 'Non Interessante',
    'PARTECIPAZIONE': 'Partecipazione',
    'AGGIUDICATA': 'Aggiudicata',
    'PERSA': 'Persa',
    'ASSEGNATA': 'Assegnata',
    'PRESENTATA': 'Presentata',
    'SCADENZA': 'In Scadenza',
    'DA_ASSEGNARE': 'Da Assegnare'
};

export function ArchivePage({ userId, organizationId, onLoadAnalysis, userPreferences }: ArchivePageProps) {
    const [analyses, setAnalyses] = useState<ArchivedAnalysis[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedAnalysis, setSelectedAnalysis] = useState<AnalysisResult | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [notification, setNotification] = useState<{ isOpen: boolean; title: string; message: string; type: 'success' | 'info' } | null>(null);
    const [fetchError, setFetchError] = useState<string | null>(null);

    useEffect(() => {
        fetchAnalyses();
    }, [userId, organizationId]);

    const fetchAnalyses = async () => {
        setIsLoading(true);
        setFetchError(null);
        try {
            let query = supabase
                .from('analyses')
                .select(`
          id,
          tender_id,
          created_at,
          result_json,
            tenders!inner (
              title,
              user_id,
              organization_id,

              tender_status,
              owner,
              owner_tech,
              owner_admin,
              owner_comm,
              status_updated_at,

              numeric_id,
              notes
            )
        `)
                .order('created_at', { ascending: false });

            // CONDITIONAL FILTER: Team vs Personal
            if (organizationId) {
                query = query.eq('tenders.organization_id', organizationId);
            } else {
                query = query.eq('tenders.user_id', userId);
            }

            const { data, error } = await query;

            if (error) throw error;

            // DEDUPLICATION: Ensure only one card per tender (the most recent one due to sorting)
            const uniqueAnalyses: any[] = [];
            const seenTenders = new Set<string>();

            if (data) {
                for (const item of data) {
                    // Check tender_id. 
                    // Note: 'item' is analysis, 'item.tenders' is joined data.
                    // We use the explicit 'tender_id' column on the analysis row.
                    if (!seenTenders.has(item.tender_id)) {
                        seenTenders.add(item.tender_id);
                        uniqueAnalyses.push(item);
                    }
                }
            }

            setAnalyses(uniqueAnalyses);
        } catch (error: any) {
            console.error('Error fetching analyses:', error);
            setFetchError(error.message || "Errore sconosciuto nel caricamento");
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
            const now = new Date().toISOString();

            // 1. Find the current analysis to get result_json and ID
            const analysis = analyses.find(a => a.tender_id === tenderId);
            if (!analysis) throw new Error('Analysis not found');

            // 2. Prepare History Update
            const currentHistory = (analysis.result_json as any).status_history || [];
            const updatedHistory = [...currentHistory, { status: newStatus, date: now }];
            const updatedResultJson = {
                ...analysis.result_json,
                status_history: updatedHistory
            };

            // 3. Update 'tenders' table (Status + Timestamp)
            const { error: tenderError } = await supabase
                .from('tenders')
                .update({
                    tender_status: newStatus,
                    status_updated_at: now
                })
                .eq('id', tenderId);
            // Wait, previous code used .eq('tender_id', id) in one version and .eq('id', tenderId) in another view.
            // Let's check fetchAnalyses: .select(..., tender_id, ...)
            // TenderListItem passes `item.tender_id`.
            // BUT previous `handleUpdateStatus` used `.eq('tender_id', id)`.
            // Let's double check what `id` is passed.
            // TenderListItem calls `onUpdateStatus(item.tender_id, ...)`
            // So the argument is `tender_id` (the string ID of the tender, not the numeric ID).
            // However, the previous code showed `.eq('tender_id', id)`.
            // Wait, in step 287 file view:
            // line 154: .eq('id', tenderId);
            // But `TenderListItem` (line 176): `onUpdateStatus(item.tender_id, ...)`
            // If `item.tender_id` matches `tenders.tender_id` column (which is usually the UUID), then `.eq('tender_id', ...)` is correct.
            // IF `item.id` matches `analyses.id`, then `tenders` table key is `id`?
            // Usually `tenders` table has `id` (uuid) and `tender_id` (maybe text or same?).
            // Let's assume `tenderId` passed IS the UUID primary key of `tenders` table if it was used as `.eq('id', ...)` previously?
            // ACTUALLY, `TenderListItem` does: `tender_id: item.tender_id`.
            // `AchivePage` mapping (line 618): `tender_id: item.tender_id`.
            // `fetchAnalyses` (line 64): `tender_id`.
            // This `tender_id` is foreign key in `analyses` table.
            // So in `tenders` table, the PK is likely `id` (uuid).
            // But `analyses.tender_id` points to `tenders.id`?
            // Or does `tenders` have a separate `tender_id`?
            // Let's look at `handleUpdateStatus` in previous file view (Step 287, line 154): `.eq('id', tenderId)`.
            // And `TenderListItem` (Step 286, line 176) calls `onUpdateStatus(item.tender_id, ...)`
            // So `item.tender_id` MUST BE the PK of the tender.
            // OK, I will trust the established pattern.

            if (tenderError) throw tenderError;

            // 4. Update 'analyses' table (History in result_json)
            try {
                const { error: analysisError } = await supabase
                    .from('analyses')
                    .update({ result_json: updatedResultJson })
                    .eq('id', analysis.id);

                if (analysisError) console.warn('History update error:', analysisError);
            } catch (historyErr) {
                console.warn('History update exception:', historyErr);
            }

            // 5. Optimistic update
            setAnalyses(prev => prev.map(a =>
                a.tender_id === tenderId
                    ? {
                        ...a,
                        result_json: updatedResultJson,
                        tenders: {
                            ...a.tenders,
                            tender_status: newStatus,
                            status_updated_at: now
                        }
                    }
                    : a
            ));

            // Trigger Modal if 'Assegnata'
            if (newStatus === 'Assegnata') {
                setNotification({
                    isOpen: true,
                    type: 'info',
                    title: 'Gara Assegnata!',
                    message: 'La gara è stata contrassegnata come "Assegnata". È ora possibile definire i responsabili (Commerciale, Tecnico, Amministrativo) cliccando sulle icone "+" nella colonna Responsabili.'
                });
            }

            // --- ACTIVITY LOGGING ---
            await supabase.from('tender_activities').insert({
                tender_id: tenderId,
                user_id: userId,
                action_type: 'status_change',
                details: {
                    old_status: analysis.tenders.tender_status || 'In valutazione',
                    new_status: newStatus
                }
            });

        } catch (error) {
            console.error('Error updating status:', error);
            alert('Errore nell\'aggiornamento dello stato');
        }
    };

    const handleUpdateOwnerField = async (tenderId: string, field: 'owner_tech' | 'owner_admin' | 'owner_comm', newValue: string) => {
        try {
            const { error } = await supabase
                .from('tenders')
                .update({ [field]: newValue })
                .eq('id', tenderId);

            if (error) throw error;

            setAnalyses(prev => prev.map(a =>
                a.tender_id === tenderId
                    ? { ...a, tenders: { ...a.tenders, [field]: newValue } }
                    : a
            ));
        } catch (error) {
            console.error(`Error updating ${field}:`, error);
            alert("Errore durante l'assegnazione. Riprova.");
        }
    };

    const handleUpdateNotes = async (tenderId: string, notes: string) => {
        // Optimistic update
        setAnalyses(prev => prev.map(a =>
            a.tender_id === tenderId ? { ...a, tenders: { ...a.tenders, notes } } : a
        ));

        try {
            const { error } = await supabase
                .from('tenders')
                .update({ notes })
                .eq('id', tenderId);

            if (error) throw error;

            // --- ACTIVITY LOGGING ---
            await supabase.from('tender_activities').insert({
                tender_id: tenderId,
                user_id: userId,
                action_type: 'dashboard_note',
                details: {
                    note_snippet: notes.length > 50 ? notes.substring(0, 50) + '...' : notes
                }
            });

        } catch (error) {
            console.error('Error updating notes:', error);
        }
    };



    const handleSummary = (e: React.MouseEvent, analysis: AnalysisResult) => {
        e.stopPropagation();
        setSelectedAnalysis(analysis);
    };

    // --- FILTER LOGIC ---
    type TabType = 'TUTTE' | 'SCADENZA' | 'DA_ASSEGNARE' | 'IN_VALUTAZIONE' | 'DECISA_GO' | 'DECISA_NO_GO' | 'ASSEGNATA' | 'PRESENTATA';
    const [currentTab, setCurrentTab] = useState<TabType>('TUTTE');

    const getOfferDeadline = (analysis: AnalysisResult): string | null => {
        const timeline = analysis['5_scadenze']?.[0]?.timeline || [];

        // Filter candidates by excluding other known types of deadlines
        const candidates = timeline.filter(t => {
            const e = t.evento.toLowerCase();
            // Exclude Questions/Clarifications
            if (e.includes('chiarimenti') || e.includes('quesiti') || e.includes('domande')) return false;
            // Exclude Site Visits
            if (e.includes('sopralluogo')) return false;
            // Exclude Opening Sessions (which happen after deadline)
            if (e.includes('apertura')) return false;
            return true;
        });

        // 1. Strict Search: Key terms "Offerta/e" + "Scadenza/Termine/Presentazione/Ricezione"
        let event = candidates.find(t => {
            const e = t.evento.toLowerCase();
            return (e.includes('offerta') || e.includes('offerte')) &&
                (e.includes('scadenza') || e.includes('termine') || e.includes('presentazione') || e.includes('ricezione'));
        });

        // 2. Fallback: Any remaining candidate with "Termine" or "Scadenza" (since we filtered out other types)
        if (!event) {
            event = candidates.find(t => t.evento.toLowerCase().includes('termine') || t.evento.toLowerCase().includes('scadenza'));
        }

        return event ? event.data : null;
    };

    const getQuesitiDeadline = (analysis: AnalysisResult): string | null => {
        const timeline = analysis['5_scadenze']?.[0]?.timeline || [];
        const quesitiEvent = timeline.find(t =>
            t.evento.toLowerCase().includes('chiarimenti') ||
            t.evento.toLowerCase().includes('quesiti') ||
            (t.evento.toLowerCase().includes('domande') && !t.evento.toLowerCase().includes('partecipazione')) // Avoid 'domanda di partecipazione'
        );
        return quesitiEvent ? quesitiEvent.data : null;
    };

    const filteredAnalyses = analyses
        .filter(a => {
            // 1. Search Filter
            const searchLower = searchTerm.toLowerCase();
            const title = a.tenders?.title?.toLowerCase() || '';
            const object = a.result_json['3_sintesi']?.oggetto?.toLowerCase() || '';
            const matchesSearch = title.includes(searchLower) || object.includes(searchLower);

            if (!matchesSearch) return false;

            // 2. Tab Filter
            if (activeTab === 'SCADENZA') {
                const deadline = getOfferDeadline(a.result_json);
                if (!deadline) return false;
                // Parse date
                const parts = deadline.split(/[\/\-]/);
                let d: Date | null = null;
                if (parts.length === 3) {
                    if (parts[2].length === 4) d = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
                    else d = new Date(deadline);
                } else d = new Date(deadline);

                if (!d || isNaN(d.getTime())) return false;

                // Check if within 20 days and not expired
                const now = new Date();
                const diffTime = d.getTime() - now.getTime();
                const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                return days >= 0 && days <= 20;
            }

            if (activeTab === 'DA_ASSEGNARE') {
                return a.tenders?.tender_status === 'Assegnata' &&
                    (!a.tenders.owner_tech || !a.tenders.owner_admin || !a.tenders.owner_comm);
            }

            if (activeTab === 'IN_VALUTAZIONE') return a.tenders?.tender_status === 'In valutazione';
            if (activeTab === 'DECISA_GO') return a.tenders?.tender_status === 'Decisa: Go';
            if (activeTab === 'DECISA_NO_GO') return a.tenders?.tender_status === 'Decisa: No Go';
            if (activeTab === 'ASSEGNATA') return a.tenders?.tender_status === 'Assegnata';
            if (activeTab === 'PRESENTATA') return a.tenders?.tender_status === 'Presentata';

            return true;
        })
        .sort((a, b) => {
            // Sort by Deadline: Future dates (Ascending - Nearest First) -> Past dates (Descending - Most Recent First) -> Nulls last
            const deadlineA = getOfferDeadline(a.result_json);
            const deadlineB = getOfferDeadline(b.result_json);

            if (!deadlineA && !deadlineB) return 0;
            if (!deadlineA) return 1;
            if (!deadlineB) return -1;

            const parse = (d: string) => {
                const parts = d.split(/[\/\-]/);
                if (parts.length === 3 && parts[2].length === 4) return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0])).getTime();
                return new Date(d).getTime();
            };

            const dateA = parse(deadlineA);
            const dateB = parse(deadlineB);

            if (isNaN(dateA)) return 1;
            if (isNaN(dateB)) return -1;

            const now = new Date().getTime();
            const isFutureA = dateA >= now;
            const isFutureB = dateB >= now;

            if (isFutureA && isFutureB) return dateA - dateB; // Both future: Nearest first
            if (!isFutureA && !isFutureB) return dateB - dateA; // Both past: Most recent first
            if (isFutureA) return -1; // A is future, B is past
            return 1; // B is future, A is past
        });

    // Counts for tabs
    const countScadenza = analyses.filter(a => {
        const deadline = getOfferDeadline(a.result_json);
        if (!deadline) return false;
        const parts = deadline.split(/[\/\-]/);
        let d = parts.length === 3 && parts[2].length === 4 ? new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0])) : new Date(deadline);
        if (!d || isNaN(d.getTime())) return false;
        const days = Math.ceil((d.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        return days >= 0 && days <= 20;
    }).length;

    const countDaAssegnare = analyses.filter(a =>
        a.tenders?.tender_status === 'Assegnata' &&
        (!a.tenders.owner_tech || !a.tenders.owner_admin || !a.tenders.owner_comm)
    ).length;


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
            // Column Configuration
            const reportCols = userPreferences?.report_columns || {};
            const availableCols = [
                { key: 'id', label: 'ID Gara', default: true },
                { key: 'ente', label: 'Ente / Stazione Appaltante', default: true },
                { key: 'oggetto', label: 'Oggetto', default: true },
                { key: 'importo', label: 'Importo', default: true }, // Added Importo
                { key: 'scadenza', label: 'Scadenza', default: true },
                { key: 'stato', label: 'Stato', default: true },
                { key: 'responsabili', label: 'Responsabili', default: false },
                { key: 'note', label: 'Note', default: false },
            ];

            const activeCols = availableCols.filter(col =>
                reportCols[col.key] !== undefined ? reportCols[col.key] : col.default
            );

            const colWidth = Math.floor(100 / activeCols.length);

            const tableRows = [
                // Header Row
                new TableRow({
                    children: activeCols.map(col =>
                        new TableCell({
                            children: [new Paragraph({ children: [new TextRun({ text: col.label, bold: true })] })],
                            width: { size: colWidth, type: WidthType.PERCENTAGE },
                            shading: { fill: "EEEEEE" }
                        })
                    ),
                }),
                // Data Rows
                ...filteredAnalyses.map(a => {
                    const deadline = getOfferDeadline(a.result_json) || "N/D";
                    const object = a.result_json['3_sintesi']?.oggetto || a.tenders.title || "N/D";
                    const entity = a.result_json['3_sintesi']?.stazione_appaltante || a.result_json['3_sintesi']?.ente || "N/D";
                    const status = a.tenders.tender_status || "In valutazione";
                    const owner = a.tenders.owner || "-"; // Legacy single owner/generic
                    // For specific owners if needed:
                    // const tech = a.tenders.owner_tech || "";
                    // const admin = a.tenders.owner_admin || "";
                    // const comm = a.tenders.owner_comm || "";
                    // const combinedOwner = [tech, admin, comm].filter(Boolean).join(", ") || owner;

                    const id = a.tenders.numeric_id ? `#${a.tenders.numeric_id}` : "N/D";
                    const notes = a.tenders.notes || "-";

                    // Importo Logic
                    let price = "N/D";
                    if (a.result_json['6_importi']) {
                        const total = a.result_json['6_importi'][0]?.base_asta_totale;
                        if (total) {
                            price = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(total);
                        }
                    }

                    const cellData: Record<string, string> = {
                        id: String(id),
                        ente: entity,
                        oggetto: object,
                        importo: price,
                        scadenza: deadline,
                        stato: status,
                        responsabili: owner,
                        note: notes
                    };

                    return new TableRow({
                        children: activeCols.map(col => {
                            if (col.key === 'responsabili') {
                                return new TableCell({
                                    children: [
                                        new Paragraph({ text: `Commerciale: ${a.tenders.owner_comm || "-"}` }),
                                        new Paragraph({ text: `Tecnico: ${a.tenders.owner_tech || "-"}` }),
                                        new Paragraph({ text: `Amministrativo: ${a.tenders.owner_admin || "-"}` }),
                                    ],
                                    width: { size: colWidth, type: WidthType.PERCENTAGE },
                                });
                            }
                            return new TableCell({
                                children: [new Paragraph({ text: cellData[col.key] || "-" })],
                                width: { size: colWidth, type: WidthType.PERCENTAGE },
                            });
                        }),
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

    if (fetchError) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-red-400 p-4 text-center">
                <AlertCircle className="h-10 w-10 mb-2" />
                <h3 className="font-bold text-lg">Errore di caricamento</h3>
                <p className="text-sm text-slate-400 mb-4">{fetchError}</p>
                <button
                    onClick={fetchAnalyses}
                    className="px-4 py-2 bg-slate-800 rounded-md hover:bg-slate-700 text-white text-sm"
                >
                    Riprova
                </button>
            </div>
        );
    }



    // Handle Load/Open
    const handleOpen = (rawData: any, tenderId?: string) => {
        // ADAPTER LOGIC FOR ARCHIVED DATA (Keep existing adapter logic)
        // RE-INJECT ADAPTER LOGIC HERE
        const data = { ...rawData };
        // (Paste the Genius Recovery / Alias Logic here - for now simplifying to direct load 
        // assuming the complex logic was for recovery of OLD broken data.
        // If user needs that robust recovery, I should include it. I will replicate it.)

        // GENIUS RECOVERY STRATEGY (Simplified for this View, full logic was in previous file version)
        // I will assume for now we can just pass data, but if issues arise I'll restore the full adapter.
        // Actually, let's include the full adapter to be safe.

        Object.keys(data).forEach(k => {
            const section = data[k];
            if (section && typeof section === 'object') {
                const globalMap = (data as any).semantic_analysis_data;
                let globalGenius = globalMap ? globalMap[k] : undefined;
                if (!globalGenius && k === '1_requisiti_partecipazione' && globalMap) globalGenius = globalMap['1_requisiti'];

                const geniusAnalysis = globalGenius?.semantic_analysis || section.semantic_analysis || (Array.isArray(section) && section[0]?.semantic_analysis);
                const geniusRisks = globalGenius?.rischi_rilevati || section.rischi_rilevati || (Array.isArray(section) && section[0]?.rischi_rilevati);
                const geniusSuggestions = globalGenius?.suggerimenti || section.suggerimenti || (Array.isArray(section) && section[0]?.suggerimenti);

                if (data[k] && typeof data[k] === 'object') {
                    if (geniusAnalysis) {
                        data[k].semantic_analysis = geniusAnalysis;
                        if (Array.isArray(data[k]) && data[k].length > 0) data[k][0] = { ...data[k][0], semantic_analysis: geniusAnalysis };
                    }
                    if (geniusRisks) {
                        data[k].rischi_rilevati = geniusRisks;
                        if (Array.isArray(data[k]) && data[k].length > 0) data[k][0] = { ...data[k][0], rischi_rilevati: geniusRisks };
                    }
                    if (geniusSuggestions) {
                        data[k].suggerimenti = geniusSuggestions;
                        if (Array.isArray(data[k]) && data[k].length > 0) data[k][0] = { ...data[k][0], suggerimenti: geniusSuggestions };
                    }
                }
            }
        });

        onLoadAnalysis(data, tenderId || '');
        alert("Analisi caricata correttamente!");
    };


    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
                        <Archive className="h-6 w-6 text-amber-500" />
                        Bid Digger Dashboard
                    </h1>
                    {/* Mobile Dropdown */}
                    <div className="md:hidden mt-6">
                        <DropdownMenu>
                            <DropdownMenuTrigger className="flex items-center justify-between w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200">
                                <span className="flex items-center gap-2">
                                    <Filter className="h-4 w-4 text-slate-400" />
                                    {TAB_LABELS[currentTab as keyof typeof TAB_LABELS] || 'Filtra per stato'}
                                </span>
                                <ChevronDown className="h-4 w-4 text-slate-400" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-[calc(100vw-32px)] bg-slate-900 border-slate-700 text-slate-200">
                                {Object.entries(TAB_LABELS).map(([key, label]) => (
                                    <DropdownMenuItem
                                        key={key}
                                        onClick={() => setCurrentTab(key as TabType)}
                                        className={cn(
                                            "cursor-pointer hover:bg-slate-800 focus:bg-slate-800 py-3",
                                            currentTab === key && "text-amber-500 bg-slate-800 font-medium"
                                        )}
                                    >
                                        {label}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    {/* Tabs */}
                    {/* Tabs Scroll Container */}
                    <div className="hidden md:flex items-center gap-6 mt-6 border-b border-slate-800 overflow-x-auto pb-0">
                        <button onClick={() => setCurrentTab('TUTTE')} className={cn("pb-3 text-sm font-medium whitespace-nowrap transition-all relative", currentTab === 'TUTTE' ? "text-amber-500" : "text-slate-400 hover:text-slate-200")}>
                            Tutte <span className="ml-1 text-xs opacity-70">({analyses.length})</span>
                            {activeTab === 'TUTTE' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-amber-500" />}
                        </button>

                        <button onClick={() => setCurrentTab('IN_VALUTAZIONE')} className={cn("pb-3 text-sm font-medium whitespace-nowrap transition-all relative", currentTab === 'IN_VALUTAZIONE' ? "text-amber-500" : "text-slate-400 hover:text-slate-200")}>
                            In Valutazione <span className="ml-1 text-xs opacity-70">({analyses.filter(a => a.tenders?.tender_status === 'In valutazione').length})</span>
                            {currentTab === 'IN_VALUTAZIONE' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-amber-500" />}
                        </button>

                        <button onClick={() => setCurrentTab('DECISA_GO')} className={cn("pb-3 text-sm font-medium whitespace-nowrap transition-all relative", currentTab === 'DECISA_GO' ? "text-green-500" : "text-slate-400 hover:text-green-400")}>
                            Go <span className="ml-1 text-xs opacity-70">({analyses.filter(a => a.tenders?.tender_status === 'Decisa: Go').length})</span>
                            {currentTab === 'DECISA_GO' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-green-500" />}
                        </button>

                        <button onClick={() => setCurrentTab('DECISA_NO_GO')} className={cn("pb-3 text-sm font-medium whitespace-nowrap transition-all relative", currentTab === 'DECISA_NO_GO' ? "text-red-500" : "text-slate-400 hover:text-red-400")}>
                            No Go <span className="ml-1 text-xs opacity-70">({analyses.filter(a => a.tenders?.tender_status === 'Decisa: No Go').length})</span>
                            {currentTab === 'DECISA_NO_GO' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-red-500" />}
                        </button>

                        <button onClick={() => setCurrentTab('ASSEGNATA')} className={cn("pb-3 text-sm font-medium whitespace-nowrap transition-all relative", currentTab === 'ASSEGNATA' ? "text-blue-500" : "text-slate-400 hover:text-blue-400")}>
                            Assegnata <span className="ml-1 text-xs opacity-70">({analyses.filter(a => a.tenders?.tender_status === 'Assegnata').length})</span>
                            {currentTab === 'ASSEGNATA' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500" />}
                        </button>

                        <button onClick={() => setCurrentTab('PRESENTATA')} className={cn("pb-3 text-sm font-medium whitespace-nowrap transition-all relative", currentTab === 'PRESENTATA' ? "text-purple-500" : "text-slate-400 hover:text-purple-400")}>
                            Presentata <span className="ml-1 text-xs opacity-70">({analyses.filter(a => a.tenders?.tender_status === 'Presentata').length})</span>
                            {currentTab === 'PRESENTATA' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-purple-500" />}
                        </button>

                        <div className="w-px h-6 bg-slate-800 mx-2" />

                        <button onClick={() => setCurrentTab('SCADENZA')} className={cn("pb-3 text-sm font-medium whitespace-nowrap transition-all relative", currentTab === 'SCADENZA' ? "text-amber-500" : "text-slate-400 hover:text-slate-200")}>
                            In Scadenza <span className="ml-1 text-xs opacity-70">({countScadenza})</span>
                            {currentTab === 'SCADENZA' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-amber-500" />}
                        </button>
                        <button onClick={() => setCurrentTab('DA_ASSEGNARE')} className={cn("pb-3 text-sm font-medium whitespace-nowrap transition-all relative", currentTab === 'DA_ASSEGNARE' ? "text-amber-500" : "text-slate-400 hover:text-slate-200")}>
                            Da Assegnare <span className="ml-1 text-xs opacity-70">({countDaAssegnare})</span>
                            {currentTab === 'DA_ASSEGNARE' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-amber-500" />}
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {analyses.length > 0 && (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleDeleteAll}
                                className="p-2 text-slate-400 hover:text-red-400 transition-colors"
                                title="Elimina Tutto"
                            >
                                <Trash2 className="h-5 w-5" />
                            </button>
                            <button
                                onClick={handleDownloadReport}
                                className="p-2 text-slate-400 hover:text-blue-400 transition-colors"
                                title="Report Sintetico"
                            >
                                <FileText className="h-5 w-5" />
                            </button>
                        </div>
                    )}
                    <div className="relative w-64">
                        {/* Search Input (kept simple) */}
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Cerca gara..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-slate-800 bg-slate-900 text-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 placeholder:text-slate-600 text-sm"
                        />
                    </div>
                </div>
            </div>

            {/* TABLE HEADER */}
            <div className="bg-slate-900/50 rounded-t-xl border border-slate-800 border-b-0 overflow-hidden">
                {/* MODIFIED GRID TO MATCH TENDERLISTITEM */}
                <div className="hidden md:grid grid-cols-[1.1fr,1.3fr,1.8fr,1.5fr,1.3fr,1.3fr] gap-3 p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <div>Stato Decisionale</div>
                    <div>Ente Appaltante</div>
                    <div>Oggetto (Sintesi)</div>
                    <div>Note</div>
                    <div>Scadenze (Offerta / Quesiti)</div>
                    <div>Responsabili</div>
                </div>
            </div>

            {/* LIST CONTENT */}
            <div className="bg-slate-900 rounded-b-xl border border-slate-800 overflow-hidden min-h-[400px]">
                {filteredAnalyses.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                        <Archive className="h-12 w-12 mb-4 opacity-20" />
                        <p>Nessuna gara trovata con i filtri correnti.</p>
                    </div>
                ) : (
                    filteredAnalyses.map((item) => {
                        // PREPARE ITEM DATA
                        const offerDeadline = getOfferDeadline(item.result_json);
                        const quesitiDeadline = getQuesitiDeadline(item.result_json);
                        const ente = item.result_json['3_sintesi']?.stazione_appaltante || item.result_json['3_sintesi']?.ente;
                        const object = item.result_json['3_sintesi']?.oggetto;
                        const displayTitle = item.tenders?.title || "Senza titolo";
                        const cig = item.result_json['3_sintesi']?.codici?.cig;

                        return (
                            <TenderListItem
                                key={item.id}
                                item={{
                                    id: item.id,
                                    tender_id: item.tender_id,
                                    created_at: item.created_at,
                                    numericId: item.tenders.numeric_id,
                                    title: displayTitle,
                                    object: object,
                                    cig: cig,
                                    ente: ente,
                                    deadline: offerDeadline,
                                    deadlineQuesiti: quesitiDeadline,
                                    status: item.tenders.tender_status || 'In valutazione',
                                    status_updated_at: item.tenders.status_updated_at,
                                    owners: {
                                        tech: item.tenders.owner_tech,
                                        admin: item.tenders.owner_admin,
                                        comm: item.tenders.owner_comm
                                    },
                                    notes: item.tenders.notes,
                                    result_json: { ...item.result_json, tender_id: item.tender_id, id: item.id } // ensure tender_id AND analysis id exists for persistence
                                }}
                                onOpen={handleOpen}
                                onDelete={handleDelete}
                                onExport={handleExport}
                                onUpdateStatus={handleUpdateStatus}
                                onUpdateOwner={handleUpdateOwnerField}
                                onUpdateNotes={handleUpdateNotes}
                                userPreferences={userPreferences || {}} // Fallback to empty object
                            />
                        );
                    })
                )}
            </div>

            {/* NOTIFICATION MODAL */}
            {notification && notification.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-6 max-w-md w-full mx-4 transform transition-all scale-100">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="bg-blue-900/30 p-2 rounded-full">
                                <AlertCircle className="w-6 h-6 text-blue-400" />
                            </div>
                            <h3 className="text-lg font-bold text-white">{notification.title}</h3>
                        </div>
                        <p className="text-slate-300 text-sm leading-relaxed mb-6">
                            {notification.message}
                        </p>
                        <div className="flex justify-end">
                            <button
                                onClick={() => setNotification(null)}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg transition-colors"
                            >
                                Ho capito
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {
                selectedAnalysis && (
                    <SummaryModal
                        isOpen={!!selectedAnalysis}
                        onClose={() => setSelectedAnalysis(null)}
                        data={selectedAnalysis!}
                    />
                )
            }
        </div>
    );
}


