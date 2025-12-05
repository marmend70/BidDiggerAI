import { X, Calendar, DollarSign, Clock, FileText, Briefcase } from 'lucide-react';
import type { AnalysisResult } from '@/types';

interface SummaryModalProps {
    isOpen: boolean;
    onClose: () => void;
    data: AnalysisResult;
}

export function SummaryModal({ isOpen, onClose, data }: SummaryModalProps) {
    if (!isOpen) return null;

    const sintesi = data['3_sintesi'];
    const servizi = data['4_servizi'];
    const durata = data['7_durata'];
    const importi = data['6_importi'];
    const scadenze = data['5_scadenze'];

    // Attempt to find submission deadline
    const submissionDeadline = scadenze?.[0]?.timeline?.find(e =>
        e.evento.toLowerCase().includes('termine') ||
        e.evento.toLowerCase().includes('scadenza') ||
        e.evento.toLowerCase().includes('presentazione')
    )?.data || scadenze?.[0]?.timeline?.[scadenze[0].timeline.length - 1]?.data || "N/D";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-6 border-b border-slate-100">
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <FileText className="h-5 w-5 text-amber-500" />
                        Sintesi Gara
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 transition-colors p-1 hover:bg-slate-100 rounded-full"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Oggetto */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Oggetto</h3>
                            {sintesi?.codici?.cig && (
                                <span className="text-xs font-bold px-2 py-1 bg-blue-50 text-blue-600 rounded-md border border-blue-100">
                                    CIG: {sintesi.codici.cig}
                                </span>
                            )}
                        </div>
                        <p className="text-slate-800 leading-relaxed">{sintesi?.oggetto || "N/D"}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Importo */}
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                            <div className="flex items-center gap-2 mb-2 text-emerald-600">
                                <DollarSign className="h-4 w-4" />
                                <h3 className="font-semibold">Importo a base d'asta</h3>
                            </div>
                            <p className="text-2xl font-bold text-slate-900">
                                {importi?.[0]?.base_asta_totale
                                    ? new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(importi[0].base_asta_totale)
                                    : "N/D"}
                            </p>
                        </div>

                        {/* Scadenza */}
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                            <div className="flex items-center gap-2 mb-2 text-red-500">
                                <Calendar className="h-4 w-4" />
                                <h3 className="font-semibold">Scadenza Offerta</h3>
                            </div>
                            <p className="text-lg font-medium text-slate-900">{submissionDeadline}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Durata */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-blue-600">
                                <Clock className="h-4 w-4" />
                                <h3 className="font-semibold">Durata</h3>
                            </div>
                            <p className="text-slate-700">{durata?.[0]?.durata_base || "N/D"}</p>
                        </div>

                        {/* Servizi */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-purple-600">
                                <Briefcase className="h-4 w-4" />
                                <h3 className="font-semibold">Servizi Richiesti</h3>
                            </div>
                            <ul className="list-disc list-inside text-sm text-slate-700 space-y-1">
                                {servizi?.[0]?.attivita?.slice(0, 3).map((s, i) => (
                                    <li key={i} className="truncate">{s}</li>
                                ))}
                                {servizi?.[0]?.attivita?.length > 3 && (
                                    <li className="text-slate-500 italic">...e altri {servizi[0].attivita.length - 3}</li>
                                )}
                                {!servizi?.[0]?.attivita?.length && <li>N/D</li>}
                            </ul>
                        </div>
                    </div>

                </div>

                <div className="p-6 border-t border-slate-100 bg-slate-50 rounded-b-xl flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-white border border-slate-300 text-slate-700 font-medium rounded-md hover:bg-slate-50 transition-colors"
                    >
                        Chiudi
                    </button>
                </div>
            </div>
        </div>
    );
}
