import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Trash2, FileText, Download, Search, Loader2, Archive } from 'lucide-react';
import type { AnalysisResult } from '@/types';
import { SummaryModal } from './SummaryModal';
import { exportToDocx } from '@/lib/exportUtils';

interface ArchivePageProps {
    userId: string;
    onLoadAnalysis: (data: AnalysisResult) => void;
}

interface ArchivedAnalysis {
    id: string; // analysis id
    tender_id: string;
    created_at: string;
    result_json: AnalysisResult;
    tenders: {
        title: string;
    };
}

export function ArchivePage({ userId, onLoadAnalysis }: ArchivePageProps) {
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
            user_id
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
        if (!confirm('Sei sicuro di voler eliminare questa analisi? Questa azione è irreversibile.')) return;

        try {
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
                        Archivio Analisi
                    </h1>
                    <p className="text-slate-500 mt-1">Gestisci e consulta le tue analisi passate</p>
                </div>
                <div className="flex items-center gap-4">
                    {analyses.length > 0 && (
                        <button
                            onClick={handleDeleteAll}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-200"
                        >
                            <Trash2 className="h-4 w-4" />
                            Elimina tutto
                        </button>
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

            <div className="grid gap-4">
                {filteredAnalyses.length === 0 ? (
                    <div className="text-center py-12 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                        <p className="text-slate-500">Nessuna analisi trovata nell'archivio.</p>
                    </div>
                ) : (
                    filteredAnalyses.map((item) => {
                        const offerDeadline = getOfferDeadline(item.result_json);
                        return (
                            <div
                                key={item.id}
                                onClick={() => {
                                    onLoadAnalysis({ ...item.result_json, tender_id: item.tender_id });
                                    alert("Analisi caricata correttamente! Ora puoi navigare nelle sezioni.");
                                }}
                                className="group bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-amber-200 transition-all cursor-pointer"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-3 mb-2">
                                            <h3 className="font-semibold text-lg text-slate-900 truncate mr-2">
                                                {item.tenders?.title || "Senza titolo"}
                                            </h3>

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
            </div>

            {selectedAnalysis && (
                <SummaryModal
                    isOpen={!!selectedAnalysis}
                    onClose={() => setSelectedAnalysis(null)}
                    data={selectedAnalysis}
                />
            )}
        </div>
    );
}
