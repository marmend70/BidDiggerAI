import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { AnalysisResult, UserPreferences } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import {
    AlertTriangle, Info, DollarSign, FileText, CheckSquare, ShieldCheck, Briefcase,
    Award, Users, MapPin, Target, Settings, Zap, Box, Calendar, Clock, AlertCircle,
    TrendingUp, Hourglass, RefreshCw, PlayCircle, BookOpen, Scale, Wallet, Building, Building2,
    Calculator, Percent, Ban, FileCode, Banknote, Lightbulb, CreditCard, Activity, Gavel,
    Bot, MessageSquare, HelpCircle, ClipboardCheck, Database, BrainCircuit, Sparkles, Star
} from 'lucide-react';
import { DeepDive } from './DeepDive';
import { SECTIONS_MAP, MENU_ORDER, DEEP_DIVE_EXAMPLES, SECTION_BATCH_MAP, AVAILABLE_MODELS, SECTORS } from '@/constants';
import { supabase } from '@/lib/supabase';

// Helper for parsing Italian dates
const parseItalianDate = (dateStr: string): Date | null => {
    // console.log("DEBUG: Raw date input:", dateStr); // Uncomment to debug raw dates
    if (!dateStr) return null;
    const months: { [key: string]: number } = {
        'gennaio': 0, 'febbraio': 1, 'marzo': 2, 'aprile': 3, 'maggio': 4, 'giugno': 5,
        'luglio': 6, 'agosto': 7, 'settembre': 8, 'ottobre': 9, 'novembre': 10, 'dicembre': 11,
        'gen': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'mag': 4, 'giu': 5,
        'lug': 6, 'ago': 7, 'set': 8, 'ott': 9, 'nov': 10, 'dic': 11
    };

    try {
        // Cleaning the string
        let cleanStr = dateStr.trim().toLowerCase();

        // Handle ISO format YYYY-MM-DD natively
        if (/^\d{4}-\d{2}-\d{2}/.test(cleanStr)) {
            return new Date(cleanStr);
        }

        const parts = cleanStr.split(/[\/\s-']+/).filter(p => p.length > 0);

        let day, month, year;

        if (parts.length >= 3) {
            // Check for DD/MM/YYYY or DD-MM-YYYY
            if (!isNaN(parseInt(parts[1]))) {
                day = parseInt(parts[0]);
                month = parseInt(parts[1]) - 1;
                year = parseInt(parts[2]);
            } else {
                // Assume DD Month YYYY (or DD Month 'YY)
                day = parseInt(parts[0]);
                month = months[parts[1]] !== undefined ? months[parts[1]] : -1;
                year = parseInt(parts[2]);
            }

            // Smart 2-digit year handling
            // If year is 2 digits (e.g. 23, 24, 09)
            if (year < 100) {
                // If it's something like 90-99, probably 1990s (unlikely for tenders but safe)
                // If it's 00-50, definitely 2000s
                year += 2000;
            }

            if (day > 0 && month >= 0 && year > 1900) {
                // Validation: if day is invalid for month (e.g. 31 Feb), Date autocorrections might occur, but usually acceptable
                return new Date(year, month, day);
            }
        }
    } catch (e) {
        console.warn("Failed to parse date:", dateStr);
    }
    return null;
};

const getDaysDifference = (targetDate: Date): number => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(targetDate);
    target.setHours(0, 0, 0, 0);
    const diffTime = target.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

interface DashboardProps {
    data: AnalysisResult;
    activeSection: string;
    onAskQuestion: (sectionId: string, question: string) => void;
    isGlobalLoading: boolean;
    userPreferences?: UserPreferences;
    onUpdatePreferences?: (newPreferences: UserPreferences) => void;
    loadingBatches?: string[];
}

const SemanticAnalysisBlock = ({ data, sectionId, children }: { data?: { semantic_analysis?: string, rischi_rilevati?: any[] | any, suggerimenti?: any[] | any } | any, sectionId: string, children?: React.ReactNode }) => {
    if (!data) return null;
    // EXCLUSION: Don't show Genius Card for these sections (inherent logic)
    if (sectionId === '14_note_importanti' || sectionId === '17_ambiguita_punti_da_chiarire') return null;

    // DEBUG: Log incoming data for critical sections
    if (sectionId === '3b_checklist_amministrativa' || sectionId === '1_requisiti_partecipazione') {
        console.log(`[Dashboard] SemanticBlock for ${sectionId}:`, data);
    }

    // Fallback Extraction: Check if data is array and props are inside the first element (common in legacy/archived data)
    let semantic_analysis = data.semantic_analysis || (Array.isArray(data) && data.length > 0 ? data[0].semantic_analysis : undefined);
    let risks = data.rischi_rilevati || (Array.isArray(data) && data.length > 0 ? data[0].rischi_rilevati : undefined);
    let suggestions = data.suggerimenti || (Array.isArray(data) && data.length > 0 ? data[0].suggerimenti : undefined);

    // SAFETY NORMALIZE: Ensure risks/suggestions are arrays or undefined (handle string blobs)
    if (risks && typeof risks === 'string') risks = [risks];
    if (suggestions && typeof suggestions === 'string') suggestions = [suggestions];

    console.log(`[Dashboard] Final Genius Data for ${sectionId}:`, {
        hasSem: !!semantic_analysis,
        hasRisks: !!(risks && risks.length),
        hasSugg: !!(suggestions && suggestions.length),
        risksContent: risks
    });

    if (!semantic_analysis && (!risks || risks.length === 0) && (!suggestions || suggestions.length === 0) && !children) return null;

    return (
        <Card className="bg-purple-950/20 border-purple-900 mb-6 shadow-sm">
            <CardHeader className="pb-3 border-b border-purple-900">
                <CardTitle className="flex items-center gap-2 text-purple-100">
                    <Sparkles className="h-5 w-5 text-purple-400" />
                    Bid Digger - Genius Mode
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-4">
                {/* 1. ANALISI SEMANTICA */}
                {semantic_analysis && (
                    <div className="bg-slate-900/60 p-4 rounded-lg border border-purple-900">
                        <h4 className="font-semibold text-purple-100 mb-2 flex items-center gap-2">
                            <BrainCircuit className="h-4 w-4" />
                            Analisi Approfondita
                        </h4>
                        <p className="text-purple-100/80 whitespace-pre-line leading-relaxed text-sm">
                            {semantic_analysis}
                        </p>
                    </div>
                )}

                {/* 2. RISCHI RILEVATI */}
                {risks && risks.length > 0 && (
                    <div>
                        <h4 className="font-semibold text-red-400 mb-3 flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4" />
                            Rischi Rilevati
                        </h4>
                        <div className="grid gap-3">
                            {risks.map((risk, i) => {
                                // BACKWARD COMPATIBILITY: Handle old string format
                                if (typeof risk === 'string') {
                                    return (
                                        <div key={i} className="flex items-start gap-3 p-3 bg-red-950/20 rounded border border-red-900">
                                            <div className="mt-0.5 min-w-[6px] h-1.5 w-1.5 rounded-full bg-red-400" />
                                            <p className="text-sm text-red-200">{risk}</p>
                                        </div>
                                    );
                                }
                                // NEW OBJECT FORMAT
                                return (
                                    <div key={i} className="flex items-start gap-3 p-3 bg-slate-900/50 rounded border border-red-900/50 shadow-sm">
                                        <div className={`mt-0.5 px-1.5 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider
                                            ${risk.livello === 'ALTO' ? 'bg-red-950/40 text-red-400' :
                                                risk.livello === 'MEDIO' ? 'bg-orange-950/40 text-orange-400' :
                                                    'bg-yellow-950/40 text-yellow-400'}`}>
                                            {risk.livello || 'GENERICO'}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-slate-200">{risk.rischio || risk.descrizione}</p>
                                            {risk.fonte && <p className="text-xs text-slate-400 mt-1">Fonte: {risk.fonte}</p>}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* 3. SUGGERIMENTI (NEW) */}
                {suggestions && suggestions.length > 0 && (
                    <div>
                        <h4 className="font-semibold text-emerald-400 mb-3 flex items-center gap-2">
                            <Lightbulb className="h-4 w-4" />
                            Suggerimenti Operativi
                        </h4>
                        <div className="space-y-3">
                            {suggestions.map((sugg, i) => (
                                <div key={i} className="bg-emerald-950/20 border border-emerald-900 rounded-lg p-3 hover:bg-emerald-900/30 transition-colors">
                                    <div className="flex items-start gap-3">
                                        <CheckSquare className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <p className="text-sm font-medium text-emerald-100">{sugg.azione}</p>
                                            {sugg.motivazione && (
                                                <p className="text-xs text-emerald-200/80 mt-1 leading-snug">
                                                    <span className="font-semibold">Perché:</span> {sugg.motivazione}
                                                </p>
                                            )}
                                            {sugg.target && (
                                                <div className="mt-2 flex items-center gap-1.5">
                                                    <Target className="h-3 w-3 text-emerald-400" />
                                                    <span className="text-[10px] text-emerald-600 uppercase font-semibold tracking-wide">
                                                        Target: {sugg.target}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                {children}
            </CardContent>
        </Card>
    );
};

const InquadramentoBlock = ({ data }: { data?: { descrizione_settore: string, criticita_ricorrenti: string, leve_progettuali: string, aspetti_rilevanti: string } }) => {
    if (!data) return null;
    return (
        <Card className="bg-indigo-950/20 border-indigo-900 mb-8 shadow-sm">
            <CardHeader className="pb-3 border-b border-indigo-900">
                <CardTitle className="flex items-center gap-2 text-indigo-100">
                    <Building className="h-5 w-5 text-indigo-400" />
                    Inquadramento Settoriale
                </CardTitle>
                <CardDescription className="text-indigo-200/80">
                    Contestualizzazione e Modelli di Riferimento
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-4">
                <div className="bg-slate-900/60 p-4 rounded-lg border border-indigo-900">
                    <p className="text-indigo-100/90 leading-relaxed text-sm">
                        {data.descrizione_settore}
                    </p>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                    <div>
                        <h4 className="font-semibold text-indigo-300 mb-2 flex items-center gap-2 text-sm">
                            <AlertTriangle className="h-4 w-4" /> Criticità Ricorrenti
                        </h4>
                        <p className="text-sm text-slate-300 bg-slate-900 p-3 rounded border border-indigo-900 leading-relaxed">
                            {data.criticita_ricorrenti}
                        </p>
                    </div>
                    <div>
                        <h4 className="font-semibold text-indigo-300 mb-2 flex items-center gap-2 text-sm">
                            <Target className="h-4 w-4" /> Leve Progettuali
                        </h4>
                        <p className="text-sm text-slate-300 bg-slate-900 p-3 rounded border border-indigo-900 leading-relaxed">
                            {data.leve_progettuali}
                        </p>
                    </div>
                </div>
                {data.aspetti_rilevanti && (
                    <div>
                        <h4 className="font-semibold text-indigo-300 mb-2 flex items-center gap-2 text-sm">
                            <Star className="h-4 w-4" /> Aspetti Rilevanti per la S.A.
                        </h4>
                        <p className="text-sm text-slate-300 bg-slate-900 p-3 rounded border border-indigo-900 leading-relaxed">
                            {data.aspetti_rilevanti}
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

const SuggerimentiPunteggioBlock = ({ tips }: { tips?: Array<{ scelta: string, priorita: string, trade_off: string }> }) => {
    if (!tips || tips.length === 0) return null;
    return (
        <Card className="bg-sky-950/20 border-sky-900 mt-6 shadow-sm">
            <CardHeader className="pb-3 border-b border-sky-900">
                <CardTitle className="flex items-center gap-2 text-sky-100 text-lg">
                    <Lightbulb className="h-5 w-5 text-sky-400" />
                    Suggerimenti Progettuali (Orientati al Punteggio)
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
                <div className="bg-sky-950/30 border border-sky-900/50 p-3 rounded text-xs text-sky-200/80 mb-4 flex gap-2 items-start">
                    <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    <div>
                        <strong>Nota:</strong> I suggerimenti non garantiscono il punteggio massimo, non sostituiscono l’interpretazione ufficiale della Stazione Appaltante e non devono essere applicati in modo automatico.
                    </div>
                </div>
                {tips.map((tip, i) => (
                    <div key={i} className="bg-slate-900 p-4 rounded-lg border border-sky-900 shadow-sm relative overflow-hidden">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-sky-400" />
                        <h5 className="font-bold text-sky-100 mb-1">{tip.scelta}</h5>
                        <div className="flex flex-wrap gap-4 mt-2 text-sm">
                            <div className="flex items-center gap-1.5 text-sky-300">
                                <Target className="h-3 w-3" />
                                <span className="font-medium">Priorità:</span> {tip.priorita}
                            </div>
                            {tip.trade_off && (
                                <div className="flex items-center gap-1.5 text-slate-400">
                                    <Scale className="h-3 w-3" />
                                    <span className="font-medium">Trade-off:</span> {tip.trade_off}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
};

const SuggerimentiOffertaBlock = ({ suggestions }: { suggestions?: Array<{ proposta: string, tipo: string, obiettivi: string, limiti: string }> }) => {
    if (!suggestions || suggestions.length === 0) return null;
    return (
        <Card className="bg-teal-950/20 border-teal-900 mt-6 shadow-sm">
            <CardHeader className="pb-3 border-b border-teal-900">
                <CardTitle className="flex items-center gap-2 text-teal-100 text-lg">
                    <Box className="h-5 w-5 text-teal-400" />
                    Suggerimenti per Offerta Tecnica
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
                <div className="bg-teal-950/30 border border-teal-900/50 p-3 rounded text-xs text-teal-200/80 mb-4 flex gap-2 items-start">
                    <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    <div>
                        <strong>Nota:</strong> I suggerimenti rappresentano possibili impostazioni non vincolanti, non considerano strategie aziendali e richiedono validazione progettuale.
                    </div>
                </div>
                {suggestions.map((sugg, i) => (
                    <div key={i} className="bg-slate-900 p-4 rounded-lg border border-teal-900 shadow-sm relative overflow-hidden">
                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${sugg.tipo?.toLowerCase().includes('value') ? 'bg-purple-400' : 'bg-teal-400'}`} />
                        <div className="flex justify-between items-start mb-1">
                            <h5 className="font-bold text-teal-100 pr-2">{sugg.proposta}</h5>
                            <Badge variant="outline" className={`text-[10px] uppercase tracking-wider flex-shrink-0 ${sugg.tipo?.toLowerCase().includes('value') ? 'bg-purple-950/40 text-purple-300 border-purple-900' : 'bg-teal-950/40 text-teal-300 border-teal-900'}`}>
                                {sugg.tipo}
                            </Badge>
                        </div>
                        <div className="grid md:grid-cols-2 gap-3 mt-3 text-sm">
                            <div className="text-slate-300">
                                <span className="font-medium text-teal-300 block mb-0.5">Obiettivi:</span>
                                {sugg.obiettivi}
                            </div>
                            <div className="text-slate-400">
                                <span className="font-medium text-slate-500 block mb-0.5">Limiti/Impatti:</span>
                                {sugg.limiti}
                            </div>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
};

// Need access to Lucide 'Star' which wasn't imported. I'll stick to 'Award' or 'Sparkles' if Star is missing, but let's check imports.
// Assuming 'Star' is not imported, I will use 'Sparkles' or add Star to imports.
// Checked import on line 11, 'Star' is NOT there. I will add it or use 'Award'.
// I'll add 'Star' to the imports first block if I can, but I only edited constants import.
// I will use 'Award' for 'Aspetti Rilevanti' essentially as a proxy for Star.

export function Dashboard({ data, activeSection, onAskQuestion, isGlobalLoading, userPreferences, onUpdatePreferences, loadingBatches = [] }: DashboardProps) {
    const [editingFaqIndex, setEditingFaqIndex] = React.useState<number | null>(null);
    const [editingOwnerState, setEditingOwnerState] = React.useState<{ list: 'owners_tech' | 'owners_admin' | 'owners_comm', index: number } | null>(null);

    const renderContent = () => {
        // DEBUG BANNER
        if (activeSection === '3_sintesi') { // Show only on summary or make it global
            // console.log("Semantic Keys:", Object.keys(data.semantic_analysis_data || {}));
        }

        // Check if section is disabled (except for 'configurazioni' and 'faq')
        // BLOCKER FIX: If it is disabled BUT we have data for it (e.g. archive), we MUST render it.
        // So we only show "Excluded" if it is disabled AND we do NOT have data.
        const sectionHasData = data && data[activeSection as keyof AnalysisResult];

        if (activeSection !== 'configurazioni' && activeSection !== 'faq') {
            if (userPreferences?.analysis_sections?.[activeSection] === false && !sectionHasData) {
                return (
                    <div className="flex flex-col items-center justify-center h-[50vh] text-center">
                        <Ban className="h-16 w-16 text-slate-700 mb-4" />
                        <h3 className="text-xl font-semibold text-slate-200">Sezione Esclusa dall'Analisi</h3>
                        <p className="text-slate-400 mt-2">Questa sezione è stata disabilitata nelle configurazioni.</p>
                    </div>
                );
            }
        }

        // Check if the batch for this section is loading
        const batch = SECTION_BATCH_MAP[activeSection];
        if (batch && loadingBatches.includes(batch)) {
            return (
                <div className="flex flex-col items-center justify-center h-[50vh] text-center space-y-4">
                    <div className="relative">
                        <div className="h-16 w-16 rounded-full border-4 border-slate-200 border-t-blue-600 animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Bot className="h-6 w-6 text-blue-600" />
                        </div>
                    </div>
                    <div>
                        <h3 className="text-xl font-semibold text-slate-200">Analisi in corso...</h3>
                        <p className="text-slate-400 mt-2">Stiamo analizzando questa sezione ({batch}).</p>
                        <p className="text-xs text-slate-500 mt-1">I risultati appariranno qui appena pronti.</p>
                    </div>
                </div>
            );
        }

        // Check if data exists for this section (if it's not a special section)
        if (activeSection !== 'configurazioni' && activeSection !== 'faq' && data && !data[activeSection as keyof AnalysisResult]) {
            return (
                <div className="flex flex-col items-center justify-center h-[50vh] text-center">
                    <AlertCircle className="h-16 w-16 text-amber-300 mb-4" />
                    <h3 className="text-xl font-semibold text-slate-200">Dati non disponibili</h3>
                    <p className="text-slate-400 mt-2">I dati per questa sezione non sono stati generati o l'analisi è incompleta.</p>
                </div>
            );
        }

        switch (activeSection) {
            case '1_requisiti_partecipazione':
                return (
                    <div className="space-y-8">
                        <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
                            <ShieldCheck className="h-8 w-8 text-blue-600" />
                            Requisiti di Partecipazione
                        </h2>

                        {/* Ordine Generale */}
                        <div className="space-y-4">
                            <h3 className="text-xl font-semibold text-slate-200 border-b border-slate-800 pb-2 flex items-center gap-2">
                                <Briefcase className="h-5 w-5 text-slate-400" />
                                Requisiti di Ordine Generale
                            </h3>
                            <div className="grid gap-4 md:grid-cols-2">
                                {data['1_requisiti_partecipazione'][0]?.ordine_generale?.map((req, i) => (
                                    <Card key={i} className="hover:shadow-md transition-shadow bg-slate-900 border-slate-800">
                                        <CardContent className="pt-6">
                                            <p className="text-sm text-slate-300">{req.requisito}</p>
                                            <Badge variant="outline" className="mt-2 text-xs bg-slate-800 text-slate-400 border-slate-700">{req.ref}</Badge>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>

                        {/* Ordine Speciale */}
                        <div className="space-y-4">
                            <h3 className="text-xl font-semibold text-slate-200 border-b border-slate-800 pb-2 flex items-center gap-2">
                                <Award className="h-5 w-5 text-blue-500" />
                                Requisiti di Ordine Speciale
                            </h3>
                            <div className="grid gap-4 md:grid-cols-2">
                                {data['1_requisiti_partecipazione'][0]?.ordine_speciale?.map((req, i) => (
                                    <Card key={i} className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow bg-slate-900 border-slate-800">
                                        <CardContent className="pt-6">
                                            <p className="text-sm text-slate-300">{req.requisito}</p>
                                            <Badge variant="outline" className="mt-2 text-xs bg-blue-950/30 text-blue-300 border-blue-900/50">{req.ref}</Badge>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>

                        {/* Idoneità Professionale */}
                        <div className="space-y-4">
                            <h3 className="text-xl font-semibold text-slate-200 border-b border-slate-800 pb-2 flex items-center gap-2">
                                <Users className="h-5 w-5 text-purple-500" />
                                Idoneità Professionale
                            </h3>
                            <div className="grid gap-4 md:grid-cols-2">
                                {data['1_requisiti_partecipazione'][0]?.idoneita_professionale?.map((req, i) => (
                                    <Card key={i} className="hover:shadow-md transition-shadow bg-slate-900 border-slate-800">
                                        <CardContent className="pt-6">
                                            <p className="text-sm text-slate-300">{req.requisito}</p>
                                            <Badge variant="outline" className="mt-2 text-xs bg-purple-950/30 text-purple-300 border-purple-900/50">{req.ref}</Badge>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>

                        {/* Capacità Tecnica */}
                        <div className="space-y-4">
                            <h3 className="text-xl font-semibold text-slate-200 border-b border-slate-800 pb-2 flex items-center gap-2">
                                <Settings className="h-5 w-5 text-green-500" />
                                Capacità Tecnica e Professionale
                            </h3>
                            <div className="grid gap-4 md:grid-cols-2">
                                {data['1_requisiti_partecipazione'][0]?.capacita_tecnica?.map((req, i) => (
                                    <Card key={i} className="hover:shadow-md transition-shadow bg-slate-900 border-slate-800">
                                        <CardContent className="pt-6">
                                            <p className="text-sm text-slate-300">{req.requisito}</p>
                                            <Badge variant="outline" className="mt-2 text-xs bg-green-950/30 text-green-300 border-green-900/50">{req.ref}</Badge>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>

                        <SemanticAnalysisBlock data={data['1_requisiti_partecipazione'][0]} sectionId="1_requisiti_partecipazione" />
                        <DeepDive
                            sectionId="1_requisiti_partecipazione"
                            existingQA={data.deep_dives?.['1_requisiti_partecipazione']}
                            onAskQuestion={onAskQuestion}
                            isGlobalLoading={isGlobalLoading}
                            exampleQuestion={DEEP_DIVE_EXAMPLES['1_requisiti_partecipazione']}
                        />
                    </div>
                );

            case '3_sintesi':
                return (
                    <div className="space-y-8">
                        <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
                            <FileText className="h-8 w-8 text-amber-500" />
                            Sintesi Gara
                        </h2>

                        {/* INQUADRAMENTO SETTORIALE (Available on Dashboard root or Sintesi) */}
                        <InquadramentoBlock data={data.inquadramento_settoriale} />

                        {/* STAZIONE APPALTANTE CARD */}
                        <Card className="bg-slate-900 border-slate-800">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-slate-200 flex items-center gap-2">
                                    <Building2 className="h-5 w-5 text-indigo-600" />
                                    Ente Appaltante
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-lg font-semibold text-slate-100 leading-snug">
                                    {data['3_sintesi'].stazione_appaltante || data['3_sintesi'].ente || 'Dato non disponibile'}
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="bg-amber-950/20 border-amber-900">
                            <CardHeader>
                                <CardTitle className="text-amber-500">Oggetto dell'Appalto</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-lg font-medium text-amber-100">{data['3_sintesi'].oggetto}</p>
                                <div className="flex gap-4 mt-4">
                                    <Badge variant="secondary" className="bg-slate-900 text-amber-500 border-amber-900">
                                        CIG: {data['3_sintesi'].codici.cig}
                                    </Badge>
                                    <Badge variant="secondary" className="bg-slate-900 text-amber-500 border-amber-900">
                                        CUP: {data['3_sintesi'].codici.cup}
                                    </Badge>
                                    <Badge variant="secondary" className="bg-slate-900 text-amber-500 border-amber-900">
                                        CPV: {data['3_sintesi'].codici.cpv}
                                    </Badge>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="bg-slate-900 border-slate-800">
                            <CardHeader>
                                <CardTitle className="text-slate-200">Scenario e Contesto</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-slate-200 leading-relaxed">{data['3_sintesi'].scenario}</p>
                            </CardContent>
                        </Card>
                        <SemanticAnalysisBlock data={data['3_sintesi']} sectionId="3_sintesi" />
                        <DeepDive
                            sectionId="3_sintesi"
                            existingQA={data.deep_dives?.['3_sintesi']}
                            onAskQuestion={onAskQuestion}
                            isGlobalLoading={isGlobalLoading}
                            exampleQuestion={DEEP_DIVE_EXAMPLES['3_sintesi']}
                        />
                    </div >
                );

            case '3b_checklist_amministrativa':
                const checklistData = data['3b_checklist_amministrativa']?.[0];
                if (!checklistData) {
                    return (
                        <div className="p-8 text-center text-slate-400 bg-slate-900 rounded-lg border border-dashed border-slate-700">
                            <ClipboardCheck className="h-12 w-12 mx-auto mb-4 text-slate-600" />
                            <p>Dati non disponibili per questa sezione.</p>
                            <p className="text-sm mt-2 text-slate-500">Prova a ri-analizzare il documento.</p>
                        </div>
                    );
                }

                return (
                    <div className="space-y-8">
                        <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
                            <ClipboardCheck className="h-8 w-8 text-emerald-600" />
                            Checklist Busta Amministrativa
                        </h2>

                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Garanzia Provvisoria */}
                            <Card className="bg-slate-900 border-slate-800">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-slate-200">
                                        <ShieldCheck className="h-5 w-5 text-emerald-500" />
                                        Garanzia Provvisoria
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <span className="text-sm font-medium text-slate-400">Importo</span>
                                        <p className="font-medium text-slate-100">{checklistData.garanzia_provvisoria?.importo || '-'}</p>
                                    </div>
                                    <div>
                                        <span className="text-sm font-medium text-slate-400">Beneficiario</span>
                                        <p className="text-slate-100">{checklistData.garanzia_provvisoria?.beneficiario || '-'}</p>
                                    </div>
                                    <div>
                                        <span className="text-sm font-medium text-slate-400">Validità</span>
                                        <p className="text-slate-100">{checklistData.garanzia_provvisoria?.validita || '-'}</p>
                                    </div>
                                    <div>
                                        <span className="text-sm font-medium text-slate-400">Clausole</span>
                                        <p className="text-slate-300 text-sm">{checklistData.garanzia_provvisoria?.clausole || '-'}</p>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Contributo ANAC & Bollo */}
                            <div className="space-y-6">
                                <Card className="bg-slate-900 border-slate-800">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-slate-200">
                                            <Banknote className="h-5 w-5 text-blue-500" />
                                            Contributo ANAC
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex justify-between">
                                            <div>
                                                <span className="text-sm font-medium text-slate-400">Importo</span>
                                                <p className="font-medium text-slate-100">{checklistData.contributo_anac?.importo || '-'}</p>
                                            </div>
                                            <div>
                                                <span className="text-sm font-medium text-slate-400">CIG</span>
                                                <Badge variant="outline" className="bg-blue-950/30 text-blue-300 border-blue-900/50">
                                                    {checklistData.contributo_anac?.cig || '-'}
                                                </Badge>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="bg-slate-900 border-slate-800">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-slate-200">
                                            <FileText className="h-5 w-5 text-purple-500" />
                                            Imposta di Bollo
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-medium text-slate-400">Importo</span>
                                            <p className="font-medium text-slate-100">{checklistData.imposta_bollo?.importo || '-'}</p>
                                        </div>
                                        <div>
                                            <span className="text-sm font-medium text-slate-400">Modalità</span>
                                            <p className="text-slate-300 text-sm">{checklistData.imposta_bollo?.modalita || '-'}</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Sopralluogo */}
                            <Card className="bg-slate-900 border-slate-800">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-slate-200">
                                        <MapPin className="h-5 w-5 text-amber-500" />
                                        Sopralluogo
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <span className="text-sm font-medium text-slate-400">Stato</span>
                                        <div className="mt-1">
                                            <Badge variant={checklistData.sopralluogo?.stato?.toLowerCase().includes('obbligatorio') ? 'destructive' : 'secondary'}>
                                                {checklistData.sopralluogo?.stato || '-'}
                                            </Badge>
                                        </div>
                                    </div>
                                    <div>
                                        <span className="text-sm font-medium text-slate-400">Modalità</span>
                                        <p className="text-slate-300 text-sm">{checklistData.sopralluogo?.modalita || '-'}</p>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Firma e Formato */}
                            <Card className="bg-slate-900 border-slate-800">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-slate-200">
                                        <FileCode className="h-5 w-5 text-slate-600" />
                                        Firma e Piattaforma
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <span className="text-sm font-medium text-slate-400">Formato Firma</span>
                                        <p className="font-medium text-slate-100">{checklistData.firma_formato?.formato || '-'}</p>
                                    </div>
                                    <div>
                                        <span className="text-sm font-medium text-slate-400">Piattaforma</span>
                                        <p className="text-slate-100">{checklistData.firma_formato?.piattaforma || '-'}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Elenco Documenti */}
                        <Card className="bg-slate-900 border-slate-800">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-slate-200">
                                    <CheckSquare className="h-5 w-5 text-blue-500" />
                                    Checklist Documentale
                                </CardTitle>
                                <CardDescription className="text-slate-400">Elenco delle dichiarazioni e documenti richiesti oltre al DGUE</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {(checklistData.elenco_documenti && Array.isArray(checklistData.elenco_documenti) && checklistData.elenco_documenti.length > 0) ? (
                                        checklistData.elenco_documenti.map((doc, i) => (
                                            <div key={i} className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                                                <div className="mt-0.5">
                                                    <div className="h-5 w-5 rounded border-2 border-slate-600" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-slate-200">{doc.documento}</p>
                                                    {doc.descrizione && <p className="text-sm text-slate-400 mt-1">{doc.descrizione}</p>}
                                                    {doc.ref && <p className="text-xs text-slate-500 mt-1">Ref: {doc.ref}</p>}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-slate-500 italic">Nessun documento specifico aggiuntivo rilevato.</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <SemanticAnalysisBlock data={checklistData} sectionId="3b_checklist_amministrativa" />
                        <DeepDive
                            sectionId="3b_checklist_amministrativa"
                            existingQA={data.deep_dives?.['3b_checklist_amministrativa']}
                            onAskQuestion={onAskQuestion}
                            isGlobalLoading={isGlobalLoading}
                            exampleQuestion={DEEP_DIVE_EXAMPLES['3b_checklist_amministrativa']}
                        />
                    </div>
                );

            case '4_servizi':
                return (
                    <div className="space-y-8">
                        <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
                            <Zap className="h-8 w-8 text-yellow-500" />
                            Dettaglio Servizi
                        </h2>
                        <div className="grid gap-6 md:grid-cols-2">
                            <Card className="bg-slate-900 border-slate-800">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-slate-200">
                                        <Box className="h-5 w-5 text-blue-500" />
                                        Attività Richieste
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ul className="space-y-2">
                                        {data['4_servizi'][0]?.attivita?.map((att, i) => (
                                            <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                                                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                                                {att}
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                            </Card>
                            <Card className="bg-slate-900 border-slate-800">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-slate-200">
                                        <Lightbulb className="h-5 w-5 text-yellow-500" />
                                        Innovazioni e Migliorie
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-slate-300">{data['4_servizi'][0]?.innovazioni}</p>
                                </CardContent>
                            </Card>
                        </div>
                        <Card className="bg-slate-900 border-slate-800">
                            <CardHeader>
                                <CardTitle className="text-slate-200">Fabbisogno Stimato</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-slate-300">{data['4_servizi'][0]?.fabbisogno}</p>
                            </CardContent>
                        </Card>
                        <SemanticAnalysisBlock data={data['4_servizi']} sectionId="4_servizi" />
                        <DeepDive
                            sectionId="4_servizi"
                            existingQA={data.deep_dives?.['4_servizi']}
                            onAskQuestion={onAskQuestion}
                            isGlobalLoading={isGlobalLoading}
                            exampleQuestion={DEEP_DIVE_EXAMPLES['4_servizi']}
                        />
                    </div>
                );

            case '5_scadenze':
                // Sort timeline events
                const sortedEvents = data['5_scadenze'][0]?.timeline?.map((event: any) => {
                    const parsedDate = parseItalianDate(event.data);
                    return { ...event, parsedDate, daysDiff: parsedDate ? getDaysDifference(parsedDate) : null };
                }).sort((a: any, b: any) => {
                    if (!a.parsedDate) return 1;
                    if (!b.parsedDate) return -1;
                    return a.parsedDate.getTime() - b.parsedDate.getTime();
                }) || [];

                return (
                    <div className="space-y-8">
                        <div className="flex justify-between items-center">
                            <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
                                <Calendar className="h-8 w-8 text-red-500" />
                                Timeline e Scadenze
                            </h2>
                            <div className="text-sm text-slate-400 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
                                {sortedEvents.length} Eventi Rilevati
                            </div>
                        </div>

                        <div className="space-y-4">
                            {sortedEvents.map((event: any, i: number) => {
                                // console.log(`DEBUG: Timeline Event ${i}:`, event.data, "Parsed:", event.parsedDate);
                                const isPast = event.daysDiff !== null && event.daysDiff < 0;
                                const isUrgent = event.daysDiff !== null && event.daysDiff >= 0 && event.daysDiff <= 10;
                                const isMedium = event.daysDiff !== null && event.daysDiff > 10 && event.daysDiff <= 20;
                                const isSafe = event.daysDiff !== null && event.daysDiff > 20;

                                let statusColor = "bg-slate-600"; // Default
                                let statusText = "Data Rilevata";
                                let dateColor = "text-slate-400";
                                let borderColor = "border-slate-700";

                                if (isPast) {
                                    statusColor = "bg-slate-500"; // Archived/Expired style (or could remain red if critical)
                                    statusText = "Scaduto";
                                    dateColor = "text-red-400";
                                    borderColor = "border-red-900/30";
                                } else if (isUrgent) {
                                    statusColor = "bg-red-500";
                                    statusText = "In Scadenza (< 10gg)";
                                    dateColor = "text-red-400";
                                    borderColor = "border-red-500/50";
                                } else if (isMedium) {
                                    statusColor = "bg-yellow-500";
                                    statusText = "Attenzione (10-20gg)";
                                    dateColor = "text-yellow-400";
                                    borderColor = "border-yellow-500/50";
                                } else if (isSafe) {
                                    statusColor = "bg-emerald-500";
                                    statusText = "Programmato (> 20gg)";
                                    dateColor = "text-emerald-400";
                                    borderColor = "border-emerald-500/50";
                                }

                                return (
                                    <div key={i} className={`relative flex flex-col md:flex-row gap-6 p-6 rounded-xl border bg-slate-900 transition-all hover:shadow-lg ${borderColor}`}>
                                        {/* Status Bar Indicator */}
                                        <div className={`absolute top-0 left-0 bottom-0 w-1.5 rounded-l-xl ${statusColor}`} />

                                        {/* Date Column */}
                                        <div className="flex-shrink-0 flex md:flex-col items-center justify-center gap-2 md:gap-0 min-w-[100px] border-b md:border-b-0 md:border-r border-slate-800 pb-4 md:pb-0 md:pr-6 pl-2">
                                            {event.parsedDate ? (
                                                <>
                                                    <span className={`text-4xl font-bold ${dateColor}`}>{event.parsedDate.getDate()}</span>
                                                    <span className="text-sm uppercase tracking-wider font-semibold text-slate-500">
                                                        {event.parsedDate.toLocaleString('it-IT', { month: 'short' })} '{event.parsedDate.getFullYear().toString().substr(2)}
                                                    </span>
                                                </>
                                            ) : (
                                                <Calendar className="h-10 w-10 text-slate-600 mb-1" />
                                            )}
                                        </div>

                                        {/* Content Column */}
                                        <div className="flex-1 flex flex-col justify-center">
                                            <div className="flex flex-wrap justify-between items-start gap-4 mb-2">
                                                <h3 className="text-xl font-semibold text-slate-200">{event.evento}</h3>

                                                {/* New Visual Indicator for Status */}
                                                <div className="flex items-center gap-2">
                                                    <div className={`h-2.5 w-24 rounded-full bg-slate-800 overflow-hidden border border-slate-700`}>
                                                        <div className={`h-full ${statusColor}`} style={{ width: isPast ? '100%' : '100%' }} />
                                                    </div>
                                                    <span className={`text-xs font-bold uppercase tracking-wider ${dateColor}`}>
                                                        {statusText}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 text-sm text-slate-400 mt-1">
                                                {event.daysDiff !== null && (
                                                    <Badge variant="secondary" className="bg-slate-800 text-slate-300 border-slate-700">
                                                        {event.daysDiff === 0 ? "Oggi" : (event.daysDiff > 0 ? `Mancano ${event.daysDiff} gg` : `Scaduto da ${Math.abs(event.daysDiff)} gg`)}
                                                    </Badge>
                                                )}
                                                <span className="bg-slate-800 px-2 py-0.5 rounded text-xs border border-slate-700 font-mono">
                                                    Originale: {event.data}
                                                </span>
                                                {event.ref && (
                                                    <span className="flex items-center gap-1 ml-2">
                                                        <span className="w-1 h-1 rounded-full bg-slate-600" />
                                                        Ref: {event.ref}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <SemanticAnalysisBlock data={data['5_scadenze']} sectionId="5_scadenze" />
                        <DeepDive
                            sectionId="5_scadenze"
                            existingQA={data.deep_dives?.['5_scadenze']}
                            onAskQuestion={onAskQuestion}
                            isGlobalLoading={isGlobalLoading}
                            exampleQuestion={DEEP_DIVE_EXAMPLES['5_scadenze']}
                        />
                    </div>
                );

            case '6_importi':
                return (
                    <div className="space-y-8">
                        <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
                            <DollarSign className="h-8 w-8 text-green-600" />
                            Quadro Economico
                        </h2>
                        <div className="grid gap-6 md:grid-cols-2">
                            <Card className="bg-green-950/20 border-green-900">
                                <CardContent className="pt-6 text-center">
                                    <p className="text-sm font-medium text-green-300 mb-1">Base d'Asta Totale</p>
                                    <p className="text-3xl font-bold text-green-400">
                                        {new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(data['6_importi'][0]?.base_asta_totale || 0)}
                                    </p>
                                </CardContent>
                            </Card>
                            <Card className="bg-slate-900 border-slate-800">
                                <CardContent className="pt-6 text-center">
                                    <p className="text-sm font-medium text-slate-400 mb-1">Costi della Manodopera</p>
                                    <p className="text-2xl font-semibold text-slate-200">
                                        {new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(data['6_importi'][0]?.costi_manodopera || 0)}
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                        <Card className="bg-slate-900 border-slate-800">
                            <CardHeader>
                                <CardTitle className="text-slate-200">Dettaglio Voci di Costo</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow className="border-slate-800 hover:bg-slate-800/50">
                                            <TableHead className="text-slate-400">Voce</TableHead>
                                            <TableHead className="text-right text-slate-400">Importo</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {data['6_importi'][0]?.dettaglio?.map((item, i) => (
                                            <TableRow key={i} className="border-slate-800 hover:bg-slate-800/50">
                                                <TableCell className="font-medium text-slate-300">{item.voce}</TableCell>
                                                <TableCell className="text-right font-mono text-slate-300">
                                                    {new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(item.importo)}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                        <SemanticAnalysisBlock data={data['6_importi']} sectionId="6_importi" />
                        <DeepDive
                            sectionId="6_importi"
                            existingQA={data.deep_dives?.['6_importi']}
                            onAskQuestion={onAskQuestion}
                            isGlobalLoading={isGlobalLoading}
                            exampleQuestion={DEEP_DIVE_EXAMPLES['6_importi']}
                        />
                    </div>
                );

            case '7_durata':
                return (
                    <div className="space-y-8">
                        <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
                            <Clock className="h-8 w-8 text-blue-500" />
                            Durata e Tempistiche
                        </h2>
                        <div className="grid gap-6 md:grid-cols-2">
                            <Card className="bg-slate-900 border-slate-800">
                                <CardHeader>
                                    <CardTitle className="text-slate-200">Durata Base</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-xl font-semibold text-slate-100">{data['7_durata'][0]?.durata_base}</p>
                                </CardContent>
                            </Card>
                            <Card className="bg-slate-900 border-slate-800">
                                <CardHeader>
                                    <CardTitle className="text-slate-200">Opzioni di Proroga</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-slate-300">{data['7_durata'][0]?.proroghe}</p>
                                </CardContent>
                            </Card>
                        </div>
                        <Card className="bg-slate-900 border-slate-800">
                            <CardHeader>
                                <CardTitle className="text-slate-200">Tempistiche Operative</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-slate-300">{data['7_durata'][0]?.tempistiche_operative}</p>
                            </CardContent>
                        </Card>
                        <SemanticAnalysisBlock data={data['7_durata']} sectionId="7_durata" />
                        <DeepDive
                            sectionId="7_durata"
                            existingQA={data.deep_dives?.['7_durata']}
                            onAskQuestion={onAskQuestion}
                            isGlobalLoading={isGlobalLoading}
                            exampleQuestion={DEEP_DIVE_EXAMPLES['7_durata']}
                        />
                    </div>
                );

            case '8_ccnl':
                return (
                    <div className="space-y-8">
                        <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
                            <Building className="h-8 w-8 text-orange-500" />
                            CCNL e Clausola Sociale
                        </h2>
                        <Card className="bg-slate-900 border-slate-800">
                            <CardHeader>
                                <CardTitle className="text-slate-200">Contratti Collettivi Applicabili</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-2">
                                    {data['8_ccnl'][0]?.contratti?.map((c, i) => (
                                        <Badge key={i} variant="secondary" className="text-sm py-1 px-3 bg-slate-800 text-slate-200 border-slate-700">
                                            {c}
                                        </Badge>
                                    ))}
                                </div>
                                <div className="mt-4">
                                    <h4 className="text-sm font-semibold text-slate-200 mb-1">Equivalenze</h4>
                                    <p className="text-sm text-slate-400">{data['8_ccnl'][0]?.equivalenze}</p>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="border-l-4 border-l-orange-500 bg-slate-900 border-slate-800">
                            <CardHeader>
                                <CardTitle className="text-slate-200">Clausola Sociale</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-slate-300">{data['8_ccnl'][0]?.clausola_sociale}</p>
                            </CardContent>
                        </Card>
                        <SemanticAnalysisBlock data={data['8_ccnl']} sectionId="8_ccnl" />
                        <DeepDive
                            sectionId="8_ccnl"
                            existingQA={data.deep_dives?.['8_ccnl']}
                            onAskQuestion={onAskQuestion}
                            isGlobalLoading={isGlobalLoading}
                            exampleQuestion={DEEP_DIVE_EXAMPLES['8_ccnl']}
                        />
                    </div>
                );

            case '9_oneri':
                return (
                    <div className="space-y-8">
                        <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
                            <Scale className="h-8 w-8 text-indigo-500" />
                            Ripartizione Oneri
                        </h2>
                        <div className="grid gap-6 md:grid-cols-2">
                            <Card className="bg-slate-900 border-slate-800">
                                <CardHeader>
                                    <CardTitle className="text-red-400">A Carico del Fornitore</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ul className="space-y-2">
                                        {data['9_oneri'][0]?.carico_fornitore?.map((item, i) => (
                                            <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                                                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-red-500 flex-shrink-0" />
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                            </Card>
                            <Card className="bg-slate-900 border-slate-800">
                                <CardHeader>
                                    <CardTitle className="text-green-400">A Carico della Stazione Appaltante</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ul className="space-y-2">
                                        {data['9_oneri'][0]?.carico_stazione?.map((item, i) => (
                                            <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                                                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-green-500 flex-shrink-0" />
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                            </Card>
                        </div>
                        <SemanticAnalysisBlock data={data['9_oneri']} sectionId="9_oneri" />
                        <DeepDive
                            sectionId="9_oneri"
                            existingQA={data.deep_dives?.['9_oneri']}
                            onAskQuestion={onAskQuestion}
                            isGlobalLoading={isGlobalLoading}
                            exampleQuestion={DEEP_DIVE_EXAMPLES['9_oneri']}
                        />
                    </div>
                );

            case '10_punteggi':
                return (
                    <div className="space-y-8">
                        <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
                            <Target className="h-8 w-8 text-pink-500" />
                            Criteri di Valutazione
                        </h2>

                        <div className="grid gap-6 md:grid-cols-3">
                            <Card className="bg-pink-950/20 border-pink-900">
                                <CardContent className="pt-6 text-center">
                                    <p className="text-sm font-medium text-pink-300 mb-1">Punteggio Tecnico</p>
                                    <p className="text-4xl font-bold text-pink-400">{data['10_punteggi'][0]?.tecnico}</p>
                                </CardContent>
                            </Card>
                            <Card className="bg-blue-950/20 border-blue-900">
                                <CardContent className="pt-6 text-center">
                                    <p className="text-sm font-medium text-blue-300 mb-1">Punteggio Economico</p>
                                    <p className="text-4xl font-bold text-blue-400">{data['10_punteggi'][0]?.economico}</p>
                                </CardContent>
                            </Card>
                            <Card className="bg-slate-900 border-slate-800">
                                <CardContent className="pt-6 text-center">
                                    <p className="text-sm font-medium text-slate-400 mb-1">Soglia Sbarramento</p>
                                    <p className="text-4xl font-bold text-slate-200">{data['10_punteggi'][0]?.soglia_sbarramento}</p>
                                </CardContent>
                            </Card>
                        </div>


                        <Card className="bg-slate-900 border-slate-800">
                            <CardHeader>
                                <CardTitle className="text-slate-200">Dettaglio Criteri Tecnici</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-6">
                                    {data['10_punteggi'][0]?.criteri_tecnici?.map((criterio, i) => (
                                        <div key={i} className="border-b border-slate-800 last:border-0 pb-4 last:pb-0">
                                            <div className="flex justify-between items-start mb-2">
                                                <h4 className="font-semibold text-slate-200">{criterio.criterio}</h4>
                                                <Badge className="bg-slate-800 text-slate-200">{criterio.punti_max} pt</Badge>
                                            </div>
                                            <p className="text-sm text-slate-400 mb-3">{criterio.descrizione}</p>
                                            {criterio.subcriteri && criterio.subcriteri.length > 0 && (
                                                <div className="bg-slate-800/50 p-3 rounded-md">
                                                    <p className="text-xs font-semibold text-slate-500 mb-2 uppercase">Sub-criteri</p>
                                                    <ul className="space-y-1">
                                                        {criterio.subcriteri.map((sub, j) => (
                                                            <li key={j} className="text-sm flex justify-between text-slate-300">
                                                                <span>{sub.descrizione}</span>
                                                                <span className="font-mono text-slate-500">{sub.punti_max} pt</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-l-4 border-l-blue-500 bg-slate-900 border-slate-800">
                            <CardHeader>
                                <CardTitle className="text-blue-400">Formula Economica</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {data['10_punteggi'][0]?.formula_economica_dettaglio ? (
                                    <>
                                        <div>
                                            <h4 className="font-semibold text-slate-200 mb-1">Formula</h4>
                                            <code className="block bg-slate-950 p-3 rounded text-sm text-blue-300 font-mono border border-slate-800">
                                                {data['10_punteggi'][0].formula_economica_dettaglio.formula}
                                            </code>
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-slate-200 mb-1">Parametri</h4>
                                            <p className="text-sm text-slate-400 whitespace-pre-line">
                                                {data['10_punteggi'][0].formula_economica_dettaglio.parametri_legenda}
                                            </p>
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-slate-200 mb-1">Modalità di Calcolo</h4>
                                            <p className="text-sm text-slate-400">
                                                {data['10_punteggi'][0].formula_economica_dettaglio.modalita_calcolo}
                                            </p>
                                        </div>
                                    </>
                                ) : (
                                    <p className="text-slate-500 italic">
                                        {data['10_punteggi'][0]?.formula_economica || "Dettaglio formula non disponibile."}
                                    </p>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="bg-slate-900 border-slate-800">
                            <CardHeader>
                                <CardTitle className="text-slate-200">Note Economiche</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-slate-300">{data['10_punteggi'][0]?.note_economiche}</p>
                            </CardContent>
                        </Card>
                        <SemanticAnalysisBlock data={data['10_punteggi'][0]} sectionId="10_punteggi">

                        </SemanticAnalysisBlock>
                        <DeepDive
                            sectionId="10_punteggi"
                            existingQA={data.deep_dives?.['10_punteggi']}
                            onAskQuestion={onAskQuestion}
                            isGlobalLoading={isGlobalLoading}
                            exampleQuestion={DEEP_DIVE_EXAMPLES['10_punteggi']}
                        />
                    </div>
                );



            case '11_pena_esclusione':
                return (
                    <div className="space-y-8">
                        <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
                            <AlertTriangle className="h-8 w-8 text-red-600" />
                            Prescrizioni a Pena di Esclusione
                        </h2>
                        <div className="grid gap-4">
                            {data['11_pena_esclusione'][0]?.elementi?.map((item, i) => (
                                <Card key={i} className="border-l-4 border-l-red-500 bg-slate-900 border-slate-800">
                                    <CardContent className="pt-6">
                                        <p className="text-slate-200 font-medium">{item.descrizione}</p>
                                        <Badge variant="outline" className="mt-2 bg-red-950/30 text-red-300 border-red-900/50">
                                            {item.ref}
                                        </Badge>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                        <SemanticAnalysisBlock data={data['11_pena_esclusione']} sectionId="11_pena_esclusione" />
                        <DeepDive
                            sectionId="11_pena_esclusione"
                            existingQA={data.deep_dives?.['11_pena_esclusione']}
                            onAskQuestion={onAskQuestion}
                            isGlobalLoading={isGlobalLoading}
                            exampleQuestion={DEEP_DIVE_EXAMPLES['11_pena_esclusione']}
                        />
                    </div>
                );

            case '12_offerta_tecnica':
                return (
                    <div className="space-y-8">
                        <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
                            <FileCode className="h-8 w-8 text-blue-600" />
                            Offerta Tecnica
                        </h2>
                        <Card className="bg-slate-900 border-slate-800">
                            <CardHeader>
                                <CardTitle className="text-slate-200">Documentazione Richiesta</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-3">
                                    {data['12_offerta_tecnica'][0]?.documenti?.map((doc, i) => (
                                        <li key={i} className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-md">
                                            <CheckSquare className="h-5 w-5 text-blue-500 mt-0.5" />
                                            <span className="text-sm text-slate-300">{doc}</span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                        <Card className="bg-slate-900 border-slate-800">
                            <CardHeader>
                                <CardTitle className="text-slate-200">Modalità di Presentazione</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-slate-300 whitespace-pre-line">{data['12_offerta_tecnica'][0]?.formattazione_modalita}</p>
                            </CardContent>
                        </Card>
                        <SemanticAnalysisBlock data={data['12_offerta_tecnica'][0]} sectionId="12_offerta_tecnica">

                        </SemanticAnalysisBlock>
                        <DeepDive
                            sectionId="12_offerta_tecnica"
                            existingQA={data.deep_dives?.['12_offerta_tecnica']}
                            onAskQuestion={onAskQuestion}
                            isGlobalLoading={isGlobalLoading}
                            exampleQuestion={DEEP_DIVE_EXAMPLES['12_offerta_tecnica']}
                        />
                    </div>
                );

            case '13_offerta_economica':
                return (
                    <div className="space-y-8">
                        <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
                            <Banknote className="h-8 w-8 text-green-600" />
                            Offerta Economica
                        </h2>
                        <Card className="bg-slate-900 border-slate-800">
                            <CardHeader>
                                <CardTitle className="text-slate-200">Documentazione Richiesta</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-3">
                                    {data['13_offerta_economica'][0]?.documenti?.map((doc, i) => (
                                        <li key={i} className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-md">
                                            <CheckSquare className="h-5 w-5 text-green-500 mt-0.5" />
                                            <span className="text-sm text-slate-300">{doc}</span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                        <Card className="bg-slate-900 border-slate-800">
                            <CardHeader>
                                <CardTitle className="text-slate-200">Modalità di Presentazione</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-slate-300 whitespace-pre-line">{data['13_offerta_economica'][0]?.formattazione_modalita}</p>
                            </CardContent>
                        </Card>
                        <SemanticAnalysisBlock data={data['13_offerta_economica']} sectionId="13_offerta_economica" />
                        <DeepDive
                            sectionId="13_offerta_economica"
                            existingQA={data.deep_dives?.['13_offerta_economica']}
                            onAskQuestion={onAskQuestion}
                            isGlobalLoading={isGlobalLoading}
                            exampleQuestion={DEEP_DIVE_EXAMPLES['13_offerta_economica']}
                        />
                    </div>
                );

            case '14_note_importanti':
                return (
                    <div className="space-y-8">
                        <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
                            <Info className="h-8 w-8 text-amber-500" />
                            Note Importanti AI
                        </h2>
                        <div className="grid gap-4">
                            {data['14_note_importanti'][0]?.note?.map((note, i) => (
                                <Card key={i} className="bg-amber-950/20 border-amber-900/50">
                                    <CardContent className="pt-6 flex gap-4">
                                        <AlertCircle className="h-6 w-6 text-amber-500 flex-shrink-0" />
                                        <div>
                                            <p className="text-amber-200 font-medium">{note.nota}</p>
                                            <Badge variant="outline" className="mt-2 bg-amber-950/40 text-amber-400 border-amber-800">
                                                {note.ref}
                                            </Badge>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                        <SemanticAnalysisBlock data={data['14_note_importanti']} sectionId="14_note_importanti" />
                        <DeepDive
                            sectionId="14_note_importanti"
                            existingQA={data.deep_dives?.['14_note_importanti']}
                            onAskQuestion={onAskQuestion}
                            isGlobalLoading={isGlobalLoading}
                            exampleQuestion={DEEP_DIVE_EXAMPLES['14_note_importanti']}
                        />
                    </div>
                );

            case '15_remunerazione':
                return (
                    <div className="space-y-8">
                        <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
                            <CreditCard className="h-8 w-8 text-cyan-500" />
                            Remunerazione
                        </h2>
                        <div className="grid gap-6 md:grid-cols-3">
                            <Card className="bg-slate-900 border-slate-800">
                                <CardHeader>
                                    <CardTitle className="text-slate-200">Modalità</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-slate-300">{data['15_remunerazione'][0]?.modalita}</p>
                                </CardContent>
                            </Card>
                            <Card className="bg-slate-900 border-slate-800">
                                <CardHeader>
                                    <CardTitle className="text-slate-200">Pagamenti</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-slate-300">{data['15_remunerazione'][0]?.pagamenti}</p>
                                </CardContent>
                            </Card>
                            <Card className="bg-slate-900 border-slate-800">
                                <CardHeader>
                                    <CardTitle className="text-slate-200">Clausole</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-slate-300">{data['15_remunerazione'][0]?.clausole}</p>
                                </CardContent>
                            </Card>
                        </div>
                        <SemanticAnalysisBlock data={data['15_remunerazione']} sectionId="15_remunerazione" />
                        <DeepDive
                            sectionId="15_remunerazione"
                            existingQA={data.deep_dives?.['15_remunerazione']}
                            onAskQuestion={onAskQuestion}
                            isGlobalLoading={isGlobalLoading}
                            exampleQuestion={DEEP_DIVE_EXAMPLES['15_remunerazione']}
                        />
                    </div>
                );

            case '16_sla_penali':
                return (
                    <div className="space-y-8">
                        <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
                            <Gavel className="h-8 w-8 text-red-500" />
                            SLA e Penali
                        </h2>
                        <Card className="bg-slate-900 border-slate-800">
                            <CardHeader>
                                <CardTitle className="text-slate-200">Service Level Agreement (SLA)</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {data['16_sla_penali'][0]?.sla?.length > 0 ? (
                                        data['16_sla_penali'][0].sla.map((s: any, i: number) => (
                                            <div key={i} className="p-3 bg-slate-800/50 rounded border border-slate-700 text-sm text-slate-300">
                                                {s.servizio && <p><strong className="text-slate-100">Servizio:</strong> {s.servizio}</p>}
                                                <p><strong>Indicatore:</strong> {s.indicatore || '-'}</p>
                                                <p><strong>Soglia:</strong> {s.soglia || '-'}</p>
                                                {s.priorita && <p><strong>Priorità:</strong> <Badge variant="outline" className="text-xs border-slate-600 text-slate-400">{s.priorita}</Badge></p>}
                                                {s.penale_correlata && <p className="mt-1 text-red-400 font-medium"><strong>Penale:</strong> {s.penale_correlata}</p>}
                                            </div>
                                        ))
                                    ) : (
                                        data['16_sla_penali'][0]?.elenco_testuale ? (
                                            <div className="p-4 bg-slate-800/50 rounded border border-slate-700 text-sm text-slate-300 prose prose-sm prose-invert max-w-none">
                                                <ReactMarkdown>{data['16_sla_penali'][0].elenco_testuale}</ReactMarkdown>
                                            </div>
                                        ) : (
                                            <p className="text-slate-500 italic">Nessun SLA specifico rilevato.</p>
                                        )
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="bg-slate-900 border-slate-800">
                            <CardHeader>
                                <CardTitle className="text-slate-200">Penali Applicabili</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {data['16_sla_penali'][0]?.penali?.length > 0 ? (
                                        data['16_sla_penali'][0].penali.map((p: any, i: number) => (
                                            <div key={i} className="p-3 bg-red-950/20 rounded border border-red-900/50 text-sm text-slate-300">
                                                <p><strong>Descrizione:</strong> {p.descrizione}</p>
                                                <p><strong>Calcolo:</strong> {p.calcolo}</p>
                                                {p.sla_associato && <p className="text-xs text-slate-500 mt-1">SLA: {p.sla_associato}</p>}
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-slate-500 italic">Nessuna penale specifica strutturata rilevata.</p>
                                    )}
                                </div>
                                <div className="mt-4 p-3 bg-slate-800 rounded text-sm flex items-start gap-2 text-slate-300">
                                    <Info className="h-4 w-4 text-slate-500 mt-0.5" />
                                    <div><strong>Clausole Cumulative:</strong> {data['16_sla_penali'][0]?.clausole_cumulative || "Non specificato"}</div>
                                </div>
                            </CardContent>
                        </Card>
                        <SemanticAnalysisBlock data={data['16_sla_penali']} sectionId="16_sla_penali" />
                        <DeepDive
                            sectionId="16_sla_penali"
                            existingQA={data.deep_dives?.['16_sla_penali']}
                            onAskQuestion={onAskQuestion}
                            isGlobalLoading={isGlobalLoading}
                            exampleQuestion={DEEP_DIVE_EXAMPLES['16_sla_penali']}
                        />
                    </div>
                );

            case '17_ambiguita_punti_da_chiarire':
                const sectionData = data['17_ambiguita_punti_da_chiarire']?.[0];
                if (!sectionData) {
                    return (
                        <div className="p-8 text-center text-slate-400 bg-slate-900 rounded-lg border border-dashed border-slate-700">
                            <HelpCircle className="h-12 w-12 mx-auto mb-4 text-slate-500" />
                            <p>Dati non disponibili per questa sezione.</p>
                            <p className="text-sm mt-2 text-slate-500">Prova a ri-analizzare il documento.</p>
                        </div>
                    );
                }

                return (
                    <div className="space-y-8">
                        <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
                            <HelpCircle className="h-8 w-8 text-amber-500" />
                            Ambiguità e Punti da Chiarire
                        </h2>

                        <div className="space-y-6">
                            {/* Ambiguità Rilevate */}
                            <Card className="border-l-4 border-l-amber-500 bg-slate-900 border-slate-800">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-amber-500">
                                        <AlertTriangle className="h-5 w-5" />
                                        Ambiguità Rilevate
                                    </CardTitle>
                                    <CardDescription className="text-slate-400">
                                        Punti del disciplinare che potrebbero essere soggetti a interpretazione o contraddittori.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {sectionData.ambiguita?.length > 0 ? (
                                            sectionData.ambiguita.map((item, i) => {
                                                const riskLevel = item.tipo?.toUpperCase() || 'BASSO';
                                                let icon = "🟢"; // Default BASSO
                                                let colorClass = "text-green-400 border-green-900 bg-green-950/20";

                                                if (riskLevel.includes('ALTO')) {
                                                    icon = "🔴";
                                                    colorClass = "text-red-400 border-red-900 bg-red-950/20";
                                                } else if (riskLevel.includes('MEDIO')) {
                                                    icon = "🟡";
                                                    colorClass = "text-amber-400 border-amber-900 bg-amber-950/20";
                                                }

                                                return (
                                                    <div key={i} className={`p-4 rounded-lg border ${colorClass.replace('text-', 'border-').replace('bg-', 'bg-opacity-50 ')}`}>
                                                        <div className="flex justify-between items-start mb-2">
                                                            <Badge variant="outline" className={`bg-slate-900 ${colorClass} border-current flex gap-1 items-center`}>
                                                                <span>{icon}</span>
                                                                <span>{item.tipo}</span>
                                                            </Badge>
                                                            {item.riferimento_documento && (
                                                                <span className="text-xs text-slate-500">Ref: {item.riferimento_documento}</span>
                                                            )}
                                                        </div>
                                                        <p className="text-slate-200 font-medium">{item.descrizione}</p>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <p className="text-slate-500 italic">Nessuna ambiguità critica rilevata.</p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Quesiti Suggeriti */}
                            <Card className="border-l-4 border-l-blue-500 bg-slate-900 border-slate-800">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-blue-400">
                                        <MessageSquare className="h-5 w-5" />
                                        Quesiti da Porre alla Stazione Appaltante
                                    </CardTitle>
                                    <CardDescription className="text-slate-400">
                                        Domande suggerite per chiarire i dubbi emersi durante l'analisi.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {sectionData.punti_da_chiarire?.length > 0 ? (
                                            sectionData.punti_da_chiarire.map((item, i) => (
                                                <div key={i} className="bg-blue-950/20 p-4 rounded-lg border border-blue-900/50">
                                                    <h4 className="font-semibold text-blue-300 mb-2">{item.quesito_suggerito}</h4>
                                                    <div className="space-y-2 text-sm">
                                                        <div>
                                                            <span className="font-medium text-slate-400">Contesto: </span>
                                                            <span className="text-slate-300">{item.contesto}</span>
                                                        </div>
                                                        <div>
                                                            <span className="font-medium text-slate-400">Motivazione: </span>
                                                            <span className="text-slate-300">{item.motivazione}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-slate-500 italic">Nessun quesito specifico suggerito.</p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <DeepDive
                            sectionId="17_ambiguita_punti_da_chiarire"
                            existingQA={data.deep_dives?.['17_ambiguita_punti_da_chiarire']}
                            onAskQuestion={onAskQuestion}
                            isGlobalLoading={isGlobalLoading}
                            exampleQuestion={DEEP_DIVE_EXAMPLES['17_ambiguita_punti_da_chiarire']}
                        />
                    </div>
                );

            case 'faq':
                return (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
                            <div className="bg-purple-600 text-white p-2 rounded-lg">
                                <Bot className="h-6 w-6" />
                            </div>
                            FAQ & Approfondimenti AI
                        </h2>
                        <p className="text-slate-400">
                            Seleziona una delle domande preimpostate per avviare un'analisi specifica basata sull'intero corpus documentale.
                        </p>

                        <div className="grid gap-4 md:grid-cols-2">
                            {(userPreferences?.faq_questions || [
                                "Descrivimi lo scenario dei sistemi tecnologici, infrastrutturale software, sistemi informatici",
                                "Approfondisci il fabbisogno del personale impiegato in termini di giorni e/o ore richieste",
                                "Quali sono le principali figure di responsabilità, gestione, coordinamento?",
                                "Quali sono i report e la documentazione di rendicontazione periodica da produrre nel corso del servizio a cura del fornitore?"
                            ]).map((question, i) => (
                                <Card
                                    key={i}
                                    className="hover:shadow-lg transition-all cursor-pointer border-l-4 border-l-purple-500 hover:bg-purple-900/20 group bg-slate-900 border-slate-800"
                                    onClick={() => onAskQuestion('faq', question)}
                                >
                                    <CardContent className="p-6 flex items-start gap-4">
                                        <div className="bg-purple-900/50 p-2 rounded-full group-hover:bg-purple-800 transition-colors">
                                            <MessageSquare className="h-5 w-5 text-purple-400" />
                                        </div>
                                        <div>
                                            <h3 className="font-medium text-slate-200 group-hover:text-purple-300 transition-colors">
                                                {question}
                                            </h3>
                                            <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                                                <Bot className="h-3 w-3" /> Clicca per chiedere all'AI
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        <div className="mt-8">
                            <DeepDive
                                sectionId="faq"
                                existingQA={data.deep_dives?.['faq']}
                                onAskQuestion={onAskQuestion}
                                isGlobalLoading={isGlobalLoading}
                                exampleQuestion={DEEP_DIVE_EXAMPLES['faq']}
                            />
                        </div>
                    </div>
                );

            case 'configurazioni':
                return (
                    <div className="space-y-8">
                        <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
                            <Settings className="h-8 w-8 text-slate-400" />
                            Configurazioni
                        </h2>

                        {/* Unified Section Configuration */}
                        <Card className="bg-slate-900 border-slate-800">
                            <CardHeader>
                                <CardTitle className="text-slate-200">Configurazione Sezioni</CardTitle>
                                <CardDescription className="text-slate-400">Gestisci quali sezioni includere nell'analisi AI e nell'esportazione DOCX.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="mb-6 p-4 bg-amber-950/20 border-l-4 border-amber-500 rounded-r-md flex items-start gap-3">
                                    <Info className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                                    <div className="text-sm text-amber-200">
                                        <span className="font-semibold block mb-1">Nota sull'Analisi Semantica</span>
                                        L'analisi semantica (Bid Digger - Genius Mode) permette di avere un approfondimento sulle informazioni della sezione.
                                    </div>
                                </div>

                                <Card className="mb-6 border-slate-800 bg-slate-900">
                                    <CardHeader className="pb-3 bg-slate-800/50">
                                        <CardTitle className="text-base font-semibold text-slate-200 flex items-center gap-2">
                                            <Building className="h-4 w-4 text-blue-500" />
                                            Contestualizzazione Settoriale
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="pt-4">
                                        <div className="flex flex-col gap-2">
                                            <label className="text-sm font-medium text-slate-300">Settore di Gara</label>
                                            <select
                                                className="w-full p-2 border border-slate-700 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-800 text-slate-200"
                                                value={userPreferences?.sector || "Generale"}
                                                onChange={(e) => {
                                                    if (onUpdatePreferences && userPreferences) {
                                                        onUpdatePreferences({ ...userPreferences, sector: e.target.value });
                                                    }
                                                }}
                                            >
                                                {SECTORS.map(sector => (
                                                    <option key={sector} value={sector}>{sector}</option>
                                                ))}
                                            </select>
                                            <p className="text-xs text-slate-500 mt-1">
                                                Selezionando un settore specifico, l'analisi fornirà un <strong>inquadramento dedicato</strong> e <strong>suggerimenti progettuali contestualizzati</strong>.
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>

                                <div className="rounded-md border border-slate-800">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="border-slate-800 hover:bg-slate-800/50">
                                                <TableHead className="text-slate-400">Sezione</TableHead>
                                                <TableHead className="text-center w-32 text-slate-400">
                                                    <div className="flex flex-col items-center gap-1">
                                                        <span>Analisi AI</span>
                                                        <input
                                                            type="checkbox"
                                                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                            checked={MENU_ORDER.every(id => userPreferences?.analysis_sections?.[id] !== false)}
                                                            onChange={(e) => {
                                                                if (!onUpdatePreferences || !userPreferences) return;
                                                                const checked = e.target.checked;
                                                                const newAnalysis = { ...userPreferences.analysis_sections };
                                                                const newSemantic = { ...userPreferences.semantic_analysis_sections };
                                                                const newExport = { ...userPreferences.export_sections };

                                                                MENU_ORDER.forEach(id => {
                                                                    newAnalysis[id] = checked;
                                                                    if (!checked) {
                                                                        newSemantic[id] = false;
                                                                        newExport[id] = false;
                                                                    }
                                                                });
                                                                onUpdatePreferences({ ...userPreferences, analysis_sections: newAnalysis, semantic_analysis_sections: newSemantic, export_sections: newExport });
                                                            }}
                                                        />
                                                    </div>
                                                </TableHead>
                                                <TableHead className="text-center w-32">
                                                    <div className="flex flex-col items-center gap-1">
                                                        <span>Bid Digger - Genius Mode</span>
                                                        <input
                                                            type="checkbox"
                                                            className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                                            checked={MENU_ORDER.filter(id => id !== '0_snapshot').every(id => {
                                                                const isRequired = id === '14_note_importanti' || id === '17_ambiguita_punti_da_chiarire';
                                                                // If analysis is disabled for this section, we shouldn't count it towards the "All Selected" state
                                                                // because we can't select it anyway.
                                                                const isAnalysisActive = userPreferences?.analysis_sections?.[id] !== false;

                                                                if (!isRequired && !isAnalysisActive) return true; // Ignore disabled sections

                                                                return isRequired || userPreferences?.semantic_analysis_sections?.[id] === true;
                                                            })}
                                                            onChange={(e) => {
                                                                if (!onUpdatePreferences || !userPreferences) return;
                                                                const checked = e.target.checked;
                                                                const newSemantic = { ...userPreferences.semantic_analysis_sections };

                                                                MENU_ORDER.forEach(id => {
                                                                    const isRequired = id === '14_note_importanti' || id === '17_ambiguita_punti_da_chiarire';
                                                                    const isAnalysisActive = userPreferences.analysis_sections?.[id] !== false;
                                                                    // Explicitly exclude 0_snapshot from "Select All" logic for Genius Mode
                                                                    if (!isRequired && isAnalysisActive && id !== '0_snapshot') {
                                                                        newSemantic[id] = checked;
                                                                    } else if (id === '0_snapshot') {
                                                                        newSemantic[id] = false; // Always ensure false for snapshot
                                                                    }
                                                                });
                                                                onUpdatePreferences({ ...userPreferences, semantic_analysis_sections: newSemantic });
                                                            }}
                                                        />
                                                    </div>
                                                </TableHead>
                                                <TableHead className="text-center w-32 text-slate-400">
                                                    <div className="flex flex-col items-center gap-1">
                                                        <span>Export DOCX</span>
                                                        <input
                                                            type="checkbox"
                                                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                            checked={MENU_ORDER.filter(id => id !== '0_snapshot').every(id => {
                                                                // If analysis is disabled (and not FAQ), ignore this section in the check
                                                                if (id !== 'faq' && userPreferences?.analysis_sections?.[id] === false) return true;

                                                                return userPreferences?.export_sections?.[id] !== false;
                                                            })}
                                                            onChange={(e) => {
                                                                if (!onUpdatePreferences || !userPreferences) return;
                                                                const checked = e.target.checked;
                                                                const newExport = { ...userPreferences.export_sections };

                                                                MENU_ORDER.forEach(id => {
                                                                    // Check if item is eligible for export toggling:
                                                                    // 1. It must NOT be snapshot (handled separately as always false)
                                                                    // 2. Either it is FAQ (always valid) OR it has analysis enabled.
                                                                    const canUpdate = id === 'faq' || userPreferences.analysis_sections?.[id] !== false;

                                                                    if (canUpdate) {
                                                                        if (id === '0_snapshot') {
                                                                            newExport[id] = false;
                                                                        } else {
                                                                            newExport[id] = checked;
                                                                        }
                                                                    }
                                                                });
                                                                onUpdatePreferences({ ...userPreferences, export_sections: newExport });
                                                            }}
                                                        />
                                                    </div>
                                                </TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {MENU_ORDER.map((sectionId, index) => {
                                                const section = SECTIONS_MAP[sectionId];
                                                if (!section) return null;

                                                const isAnalysisEnabled = userPreferences?.analysis_sections?.[sectionId] !== false;
                                                const isExportEnabled = userPreferences?.export_sections?.[sectionId] !== false;
                                                const isFaq = sectionId === 'faq';

                                                // Determine if we need a header
                                                let header: string | null = null;
                                                const batch = SECTION_BATCH_MAP[sectionId];
                                                const prevBatch = index > 0 ? SECTION_BATCH_MAP[MENU_ORDER[index - 1]] : null;

                                                if (batch && batch !== prevBatch) {
                                                    if (batch === 'batch_1') header = "1. Sintesi e analisi amministrativa";
                                                    else if (batch === 'batch_2') header = "2. Servizi";
                                                    else if (batch === 'batch_3') header = "3. Offerta";
                                                    else if (batch === 'batch_4') header = "4. Extra";
                                                }

                                                return (
                                                    <React.Fragment key={sectionId}>
                                                        {header && (
                                                            <TableRow className="bg-slate-800/50 hover:bg-slate-800/50 border-slate-800">
                                                                <TableCell colSpan={3} className="font-semibold text-slate-400 uppercase tracking-wider text-xs py-3">
                                                                    {header}
                                                                </TableCell>
                                                            </TableRow>
                                                        )}
                                                        <TableRow className="border-slate-800 hover:bg-slate-800/20">
                                                            <TableCell className="font-medium">
                                                                <div className="flex flex-col">
                                                                    <div className="flex items-center gap-2 text-slate-300">
                                                                        {React.createElement(section.icon, { className: "h-4 w-4 text-slate-400" })}
                                                                        {section.label}
                                                                        {sectionId === '5_scadenze' && (
                                                                            <span className="text-[10px] text-emerald-400 bg-emerald-950/30 px-1 py-0.5 rounded border border-emerald-900 ml-2">
                                                                                Sempre verificata
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    {sectionId === '0_snapshot' && (
                                                                        <p className="text-[10px] text-amber-600 mt-1 ml-6 leading-tight max-w-[250px]">
                                                                            * Se attivata, saranno avviate anche le analisi delle sezioni necessarie per il quadro sintetico.
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="text-center">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={isAnalysisEnabled}
                                                                    disabled={isFaq}
                                                                    onChange={(e) => {
                                                                        if (onUpdatePreferences && userPreferences) {
                                                                            const isChecked = e.target.checked;
                                                                            const newAnalysis = {
                                                                                ...userPreferences.analysis_sections,
                                                                                [sectionId]: isChecked
                                                                            };

                                                                            // If unchecking analysis, also uncheck semantic analysis and export
                                                                            let newSemantic = { ...userPreferences.semantic_analysis_sections };
                                                                            let newExport = { ...userPreferences.export_sections };

                                                                            if (!isChecked) {
                                                                                newSemantic = {
                                                                                    ...newSemantic,
                                                                                    [sectionId]: false
                                                                                };
                                                                                newExport = {
                                                                                    ...newExport,
                                                                                    [sectionId]: false
                                                                                };
                                                                            } else {
                                                                                // If checking analysis, default semantic to false (user must opt-in)
                                                                                // or keep previous state? User requested: "Altrimenti è deselezionata di default."
                                                                                // So if we re-enable analysis, semantic starts as false (which is safe).
                                                                            }

                                                                            onUpdatePreferences({
                                                                                ...userPreferences,
                                                                                analysis_sections: newAnalysis,
                                                                                semantic_analysis_sections: newSemantic,
                                                                                export_sections: newExport
                                                                            });
                                                                        }
                                                                    }}
                                                                    className={`h-4 w-4 rounded border-gray-600 text-blue-500 focus:ring-blue-500 bg-slate-800 ${isFaq ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                                />
                                                            </TableCell>
                                                            <TableCell className="text-center">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={
                                                                        (sectionId === '14_note_importanti' || sectionId === '17_ambiguita_punti_da_chiarire')
                                                                            ? true
                                                                            : userPreferences?.semantic_analysis_sections?.[sectionId] === true
                                                                    }
                                                                    disabled={
                                                                        !isAnalysisEnabled ||
                                                                        isFaq ||
                                                                        sectionId === '14_note_importanti' ||
                                                                        sectionId === '17_ambiguita_punti_da_chiarire' ||
                                                                        sectionId === '0_snapshot'
                                                                    }
                                                                    onChange={(e) => {
                                                                        if (sectionId === '14_note_importanti' || sectionId === '17_ambiguita_punti_da_chiarire') return;

                                                                        if (onUpdatePreferences && userPreferences) {
                                                                            onUpdatePreferences({
                                                                                ...userPreferences,
                                                                                semantic_analysis_sections: {
                                                                                    ...userPreferences.semantic_analysis_sections,
                                                                                    [sectionId]: e.target.checked
                                                                                }
                                                                            });
                                                                        }
                                                                    }}
                                                                    className={`h-4 w-4 rounded border-gray-600 text-purple-500 focus:ring-purple-500 bg-slate-800 ${(!isAnalysisEnabled || isFaq) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                                />
                                                            </TableCell>
                                                            <TableCell className="text-center">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={isExportEnabled}
                                                                    disabled={(!isAnalysisEnabled && !isFaq) || sectionId === '0_snapshot'}
                                                                    onChange={(e) => {
                                                                        if (onUpdatePreferences && userPreferences) {
                                                                            onUpdatePreferences({
                                                                                ...userPreferences,
                                                                                export_sections: {
                                                                                    ...userPreferences.export_sections,
                                                                                    [sectionId]: e.target.checked
                                                                                }
                                                                            });
                                                                        }
                                                                    }}
                                                                    className={`h-4 w-4 rounded border-gray-600 text-blue-500 focus:ring-blue-500 bg-slate-800 ${(!isAnalysisEnabled && !isFaq) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                                />
                                                            </TableCell>
                                                        </TableRow>
                                                    </React.Fragment>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>



                        {/* FAQ Configuration */}
                        < Card className="bg-slate-900 border-slate-800">
                            <CardHeader>
                                <CardTitle className="text-slate-200">Gestione FAQ</CardTitle>
                                <CardDescription className="text-slate-400">Aggiungi o rimuovi le domande preimpostate per la sezione FAQ.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        id="new-faq"
                                        placeholder="Nuova domanda..."
                                        className="flex-1 px-3 py-2 border border-slate-700 rounded-md text-sm bg-slate-800 text-slate-200"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                const input = e.currentTarget;
                                                const val = input.value.trim();
                                                if (val && onUpdatePreferences && userPreferences) {
                                                    onUpdatePreferences({
                                                        ...userPreferences,
                                                        faq_questions: [...userPreferences.faq_questions, val]
                                                    });
                                                    input.value = '';
                                                }
                                            }
                                        }}
                                    />
                                    <button
                                        className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700"
                                        onClick={() => {
                                            const input = document.getElementById('new-faq') as HTMLInputElement;
                                            const val = input.value.trim();
                                            if (val && onUpdatePreferences && userPreferences) {
                                                onUpdatePreferences({
                                                    ...userPreferences,
                                                    faq_questions: [...userPreferences.faq_questions, val]
                                                });
                                                input.value = '';
                                            }
                                        }}
                                    >
                                        Aggiungi
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    {userPreferences?.faq_questions.map((q, i) => (
                                        <div key={i} className="flex items-center justify-between bg-slate-800/50 p-3 rounded border border-slate-700">
                                            {editingFaqIndex === i ? (
                                                <input
                                                    type="text"
                                                    defaultValue={q}
                                                    className="flex-1 px-2 py-1 border border-slate-600 rounded text-sm mr-2 bg-slate-700 text-slate-100"
                                                    autoFocus
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            const val = e.currentTarget.value.trim();
                                                            if (val && onUpdatePreferences && userPreferences) {
                                                                const newQuestions = [...userPreferences.faq_questions];
                                                                newQuestions[i] = val;
                                                                onUpdatePreferences({
                                                                    ...userPreferences,
                                                                    faq_questions: newQuestions
                                                                });
                                                                setEditingFaqIndex(null);
                                                            }
                                                        } else if (e.key === 'Escape') {
                                                            setEditingFaqIndex(null);
                                                        }
                                                    }}
                                                    onBlur={() => setEditingFaqIndex(null)}
                                                />
                                            ) : (
                                                <span className="text-sm text-slate-300 flex-1">{q}</span>
                                            )}
                                            <div className="flex gap-2">
                                                <button
                                                    className="text-blue-500 hover:text-blue-700"
                                                    onClick={() => setEditingFaqIndex(i)}
                                                >
                                                    <FileCode className="h-4 w-4" />
                                                </button>
                                                <button
                                                    className="text-red-500 hover:text-red-700"
                                                    onClick={() => {
                                                        if (onUpdatePreferences && userPreferences) {
                                                            const newQuestions = [...userPreferences.faq_questions];
                                                            newQuestions.splice(i, 1);
                                                            onUpdatePreferences({
                                                                ...userPreferences,
                                                                faq_questions: newQuestions
                                                            });
                                                        }
                                                    }}
                                                >
                                                    <Ban className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card >

                        {/* Data Retention Configuration */}
                        <Card className="bg-slate-900 border-slate-800">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-slate-200">
                                    <Clock className="h-5 w-5 text-orange-500" />
                                    Data Retention (GDPR)
                                </CardTitle>
                                <CardDescription className="text-slate-400">Gestisci il periodo di conservazione dei documenti caricati.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="font-medium text-slate-300">Conservazione Documenti (giorni)</span>
                                        <span className="font-bold text-slate-100 bg-slate-800 px-2 py-1 rounded border border-slate-700">
                                            {userPreferences?.retention_days || 60} giorni
                                        </span>
                                    </div>
                                    <input
                                        type="range"
                                        min="1"
                                        max="60"
                                        step="1"
                                        value={userPreferences?.retention_days || 60}
                                        onChange={(e) => {
                                            if (onUpdatePreferences && userPreferences) {
                                                onUpdatePreferences({
                                                    ...userPreferences,
                                                    retention_days: parseInt(e.target.value)
                                                });
                                            }
                                        }}
                                        className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
                                    />
                                    <p className="text-xs text-slate-500">
                                        Nota: I documenti salvati nello storage non possono essere conservati per oltre 60 giorni.
                                        Verranno eliminati <span className="font-semibold text-orange-600">AUTOMATICAMENTE</span> dall'archivio e dal database dopo il periodo selezionato (calcolato dalla data di caricamento).
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Helper function to render Owner Management Cards */}
                        {[
                            { title: "Responsabili Tecnici", key: 'owners_tech', dbColumn: 'owner_tech', desc: "Gestisci l'elenco dei Responsabili Tecnici." },
                            { title: "Responsabili Amministrativi", key: 'owners_admin', dbColumn: 'owner_admin', desc: "Gestisci l'elenco dei Responsabili Amministrativi." },
                            { title: "Responsabili Commerciali", key: 'owners_comm', dbColumn: 'owner_comm', desc: "Gestisci l'elenco dei Responsabili Commerciali." }
                        ].map((roleConfig) => {
                            const listKey = roleConfig.key as 'owners_tech' | 'owners_admin' | 'owners_comm';
                            const dbCol = roleConfig.dbColumn;
                            const ownersList = userPreferences?.[listKey] || [];

                            return (
                                <Card key={listKey} className="bg-slate-900 border-slate-800">
                                    <CardHeader>
                                        <CardTitle className="text-slate-200">{roleConfig.title}</CardTitle>
                                        <CardDescription className="text-slate-400">{roleConfig.desc}</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                id={`new-${listKey}`}
                                                placeholder={`Nuovo ${roleConfig.title}...`}
                                                className="flex-1 px-3 py-2 border border-slate-700 rounded-md text-sm bg-slate-800 text-slate-200"
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        const input = e.currentTarget;
                                                        const val = input.value.trim();
                                                        if (val && onUpdatePreferences && userPreferences) {
                                                            const currentOwners = userPreferences[listKey] || [];
                                                            onUpdatePreferences({
                                                                ...userPreferences,
                                                                [listKey]: [...currentOwners, val]
                                                            });
                                                            input.value = '';
                                                        }
                                                    }
                                                }}
                                            />
                                            <button
                                                className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700"
                                                onClick={() => {
                                                    const input = document.getElementById(`new-${listKey}`) as HTMLInputElement;
                                                    const val = input.value.trim();
                                                    if (val && onUpdatePreferences && userPreferences) {
                                                        const currentOwners = userPreferences[listKey] || [];
                                                        onUpdatePreferences({
                                                            ...userPreferences,
                                                            [listKey]: [...currentOwners, val]
                                                        });
                                                        input.value = '';
                                                    }
                                                }}
                                            >
                                                Aggiungi
                                            </button>
                                        </div>
                                        <div className="space-y-2">
                                            {ownersList.length === 0 && (
                                                <p className="text-sm text-slate-500 italic">Nessun nominativo configurato.</p>
                                            )}
                                            {ownersList.map((owner, i) => (
                                                <div key={i} className="flex items-center justify-between bg-slate-800/50 p-3 rounded border border-slate-700">
                                                    {(editingOwnerState?.list === listKey && editingOwnerState?.index === i) ? (
                                                        <input
                                                            type="text"
                                                            defaultValue={owner}
                                                            className="flex-1 px-2 py-1 border border-slate-600 rounded text-sm mr-2 bg-slate-700 text-slate-200"
                                                            autoFocus
                                                            onKeyDown={async (e) => {
                                                                if (e.key === 'Enter') {
                                                                    const newVal = e.currentTarget.value.trim();
                                                                    if (newVal && newVal !== owner && onUpdatePreferences && userPreferences) {
                                                                        // 1. Update Preferences
                                                                        const newOwners = [...(userPreferences[listKey] || [])];
                                                                        newOwners[i] = newVal;
                                                                        onUpdatePreferences({
                                                                            ...userPreferences,
                                                                            [listKey]: newOwners
                                                                        });

                                                                        // 2. Propagate to DB (Tenders)
                                                                        try {
                                                                            const { error } = await supabase
                                                                                .from('tenders')
                                                                                .update({ [dbCol]: newVal })
                                                                                .eq(dbCol, owner);

                                                                            if (error) throw error;
                                                                            console.log(`Updated ${dbCol} from '${owner}' to '${newVal}'`);
                                                                        } catch (err) {
                                                                            console.error("Failed to propagate owner rename:", err);
                                                                            alert("Attenzione: Il nome è stato aggiornato nelle impostazioni, ma potrebbe non essere stato salvato su tutte le gare in archivio.");
                                                                        }
                                                                        setEditingOwnerState(null);
                                                                    } else if (newVal === owner) {
                                                                        setEditingOwnerState(null);
                                                                    }
                                                                } else if (e.key === 'Escape') {
                                                                    setEditingOwnerState(null);
                                                                }
                                                            }}
                                                            onBlur={() => setEditingOwnerState(null)}
                                                        />
                                                    ) : (
                                                        <span className="text-sm text-slate-300 flex-1">{owner}</span>
                                                    )}

                                                    <div className="flex gap-2">
                                                        <button
                                                            className="text-blue-500 hover:text-blue-700"
                                                            onClick={() => setEditingOwnerState({ list: listKey, index: i })}
                                                        >
                                                            <FileCode className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            className="text-red-500 hover:text-red-700"
                                                            onClick={() => {
                                                                if (onUpdatePreferences && userPreferences) {
                                                                    const newOwners = [...(userPreferences[listKey] || [])];
                                                                    newOwners.splice(i, 1);
                                                                    onUpdatePreferences({
                                                                        ...userPreferences,
                                                                        [listKey]: newOwners
                                                                    });
                                                                }
                                                            }}
                                                        >
                                                            <Ban className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}

                    </div >
                );

            default:
                return <div>Sezione non trovata</div>;
        }
    };

    return (
        <div className="animate-in fade-in duration-500">
            {renderContent()}
        </div>
    );
}
