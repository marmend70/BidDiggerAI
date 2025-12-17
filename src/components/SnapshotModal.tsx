
import React from 'react';
import { X, Zap, Building2, DollarSign, Clock, ScrollText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { AnalysisResult } from '@/types';

interface SnapshotModalProps {
    isOpen: boolean;
    onClose: () => void;
    data: AnalysisResult | null;
}

export const SnapshotModal: React.FC<SnapshotModalProps> = ({ isOpen, onClose, data }) => {
    if (!isOpen) return null;

    // Data Extraction
    const snapshotSintesi = data?.['3_sintesi'];
    const snapshotImporti = data?.['6_importi']?.[0];
    const snapshotDurata = data?.['7_durata']?.[0];
    const snapshotCcnl = data?.['8_ccnl']?.[0];
    const snapshotScadenze = data?.['5_scadenze']?.[0];

    // Helper: Calculate Percentage
    const manpowerCost = snapshotImporti?.costi_manodopera || 0;
    const baseAmount = snapshotImporti?.base_asta_totale || 0;
    const hasManpowerInfo = manpowerCost > 0 && baseAmount > 0;
    const manpowerPercentage = hasManpowerInfo ? ((manpowerCost / baseAmount) * 100).toFixed(2) : null;

    // Helper: Find Deadline (Termine Presentazione Offerte)
    const deadlineEvent = snapshotScadenze?.timeline?.find(t =>
        t.evento.toLowerCase().includes('presentazione') ||
        t.evento.toLowerCase().includes('scadenza') ||
        t.evento.toLowerCase().includes('termine')
    );
    const deadlineDate = deadlineEvent?.data || snapshotScadenze?.timeline?.[0]?.data;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-hidden">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl relative animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-t-xl flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/80 rounded-lg shadow-sm border border-yellow-100">
                            <Zap className="h-6 w-6 text-yellow-500 fill-yellow-500" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">Snapshot di Gara</h2>
                            <p className="text-sm text-slate-500">Sintesi principali dati estratti</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/50 rounded-full transition-colors text-slate-500 hover:text-slate-700"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content - Scrollable */}
                <div className="p-6 overflow-y-auto">
                    <div className="grid gap-6 md:grid-cols-2">

                        {/* 1. Oggetto (Full Width) */}
                        <div className="md:col-span-2">
                            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Oggetto della Gara</h3>
                            <p className="text-lg font-medium text-slate-900 leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-100">
                                {snapshotSintesi?.oggetto || <span className="text-slate-400 italic">Oggetto non disponibile</span>}
                            </p>
                        </div>

                        {/* 2. Ente & Scadenza */}
                        <Card className="md:col-span-2 border-l-4 border-l-blue-600 shadow-sm">
                            <CardHeader className="py-4">
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <div className="flex items-center gap-2 text-sm font-semibold text-blue-600 uppercase tracking-wider mb-1">
                                            <Building2 className="h-4 w-4" />
                                            Ente / Stazione Appaltante
                                        </div>
                                        <CardTitle className="text-xl text-slate-900 leading-tight">
                                            {snapshotSintesi?.stazione_appaltante || snapshotSintesi?.ente || <span className="text-slate-400 italic">Dato non disponibile</span>}
                                        </CardTitle>
                                    </div>
                                    <div className="md:border-l md:pl-6 border-slate-100">
                                        <div className="flex items-center gap-2 text-sm font-semibold text-red-600 uppercase tracking-wider mb-1">
                                            <Clock className="h-4 w-4" />
                                            Scadenza Offerta
                                        </div>
                                        <p className="text-xl font-bold text-slate-900">
                                            {deadlineDate || <span className="text-slate-400 italic">Data non indicata</span>}
                                        </p>
                                        {deadlineEvent && <p className="text-xs text-slate-500 mt-1">{deadlineEvent.evento}</p>}
                                    </div>
                                </div>
                            </CardHeader>
                        </Card>

                        {/* 3. Importi */}
                        <Card className="shadow-sm">
                            <CardHeader className="pb-4 border-b bg-slate-50/50">
                                <CardTitle className="flex items-center gap-2 text-slate-800 text-lg">
                                    <DollarSign className="h-5 w-5 text-green-600" />
                                    Valore Economico
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6 pt-6">
                                <div>
                                    <p className="text-sm font-medium text-slate-500 mb-1">Importo a Base d'Asta</p>
                                    <p className="text-2xl font-bold text-slate-900">
                                        {snapshotImporti?.base_asta_totale
                                            ? new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(snapshotImporti.base_asta_totale)
                                            : <span className="text-slate-400 italic">Non disponibile</span>}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-sm font-medium text-slate-500 mb-1">Importo Complessivo (incl. opzioni)</p>
                                    <p className="text-lg font-semibold text-slate-700">
                                        <span className="text-slate-500 text-base">Vedi dettaglio Quadro Economico</span>
                                    </p>
                                </div>

                                <div className="pt-4 border-t">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-sm font-medium text-slate-500 mb-1">Stima Costi Manodopera</p>
                                            <p className="text-lg font-medium text-slate-900">
                                                {snapshotImporti?.costi_manodopera
                                                    ? new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(snapshotImporti.costi_manodopera)
                                                    : <span className="text-slate-400 italic">Non specificato</span>}
                                            </p>
                                        </div>
                                        {manpowerPercentage && (
                                            <div className="text-right">
                                                <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50">
                                                    Incidenza: {manpowerPercentage}%
                                                </Badge>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* 4. Durata e CCNL */}
                        <div className="space-y-6">
                            <Card className="shadow-sm">
                                <CardHeader className="pb-4 border-b bg-slate-50/50">
                                    <CardTitle className="flex items-center gap-2 text-slate-800 text-lg">
                                        <Clock className="h-5 w-5 text-blue-600" />
                                        Durata e Tempistiche
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    <div>
                                        <p className="text-sm font-medium text-slate-500 mb-1">Durata Appalto</p>
                                        <p className="text-xl font-semibold text-slate-900">
                                            {snapshotDurata?.durata_base || <span className="text-slate-400 italic">Non specificata</span>}
                                        </p>
                                    </div>
                                    {snapshotDurata?.proroghe && (
                                        <div className="mt-4 pt-4 border-t">
                                            <p className="text-sm font-medium text-slate-500 mb-1">Opzioni e Rinnovi</p>
                                            <p className="text-sm text-slate-700 leading-relaxed">
                                                {snapshotDurata.proroghe}
                                            </p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            <Card className="shadow-sm border-l-4 border-l-orange-500">
                                <CardHeader className="pb-2">
                                    <CardTitle className="flex items-center gap-2 text-slate-800 text-lg">
                                        <ScrollText className="h-5 w-5 text-orange-600" />
                                        CCNL Applicato
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex flex-wrap gap-2">
                                        {snapshotCcnl?.contratti?.length ? (
                                            snapshotCcnl.contratti.map((c, i) => (
                                                <Badge key={i} variant="secondary" className="bg-orange-50 text-orange-800 hover:bg-orange-100 border-orange-200">
                                                    {c}
                                                </Badge>
                                            ))
                                        ) : (
                                            <span className="text-slate-400 italic">Non disponibile</span>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
