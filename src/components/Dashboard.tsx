import React from 'react';
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
    TrendingUp, Hourglass, RefreshCw, PlayCircle, BookOpen, Scale, Wallet, Building,
    Calculator, Percent, Ban, FileCode, Banknote, Lightbulb, CreditCard, Activity, Gavel,
    Bot, MessageSquare, HelpCircle, ClipboardCheck, Database, BrainCircuit, Sparkles
} from 'lucide-react';
import { DeepDive } from './DeepDive';
import { SECTIONS_MAP, MENU_ORDER, DEEP_DIVE_EXAMPLES, SECTION_BATCH_MAP, AVAILABLE_MODELS } from '@/constants';

interface DashboardProps {
    data: AnalysisResult;
    activeSection: string;
    onAskQuestion: (sectionId: string, question: string) => void;
    isGlobalLoading: boolean;
    userPreferences?: UserPreferences;
    onUpdatePreferences?: (newPreferences: UserPreferences) => void;
    loadingBatches?: string[];
}

const SemanticAnalysisBlock = ({ data }: { data?: { semantic_analysis: string, rischi_rilevati: string[] } }) => {
    console.log("SemanticBlock received:", data);
    if (!data) return null;
    const { semantic_analysis, rischi_rilevati } = data;
    if (!semantic_analysis && (!rischi_rilevati || rischi_rilevati.length === 0)) return null;

    return (
        <Card className="bg-purple-50 border-purple-200 mb-6">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-900">
                    <Sparkles className="h-6 w-6 text-purple-600" />
                    Bid Digger - Genius Mode
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {semantic_analysis && (
                    <div>
                        <h4 className="font-semibold text-purple-900 mb-2">Analisi Approfondita</h4>
                        <p className="text-purple-800 whitespace-pre-line leading-relaxed">{semantic_analysis}</p>
                    </div>
                )}
                {rischi_rilevati && rischi_rilevati.length > 0 && (
                    <div>
                        <h4 className="font-semibold text-purple-900 mb-2">Rischi Rilevati</h4>
                        <ul className="list-disc pl-5 space-y-1">
                            {rischi_rilevati.map((risk, i) => (
                                <li key={i} className="text-purple-800">{risk}</li>
                            ))}
                        </ul>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export function Dashboard({ data, activeSection, onAskQuestion, isGlobalLoading, userPreferences, onUpdatePreferences, loadingBatches = [] }: DashboardProps) {
    const [editingFaqIndex, setEditingFaqIndex] = React.useState<number | null>(null);

    const renderContent = () => {
        // DEBUG BANNER
        if (activeSection === '3_sintesi') { // Show only on summary or make it global
            // console.log("Semantic Keys:", Object.keys(data.semantic_analysis_data || {}));
        }

        // Check if section is disabled (except for 'configurazioni' and 'faq' which might be special)
        if (activeSection !== 'configurazioni' && userPreferences?.analysis_sections?.[activeSection] === false) {
            return (
                <div className="flex flex-col items-center justify-center h-[50vh] text-center">
                    <Ban className="h-16 w-16 text-slate-300 mb-4" />
                    <h3 className="text-xl font-semibold text-slate-700">Sezione Esclusa dall'Analisi</h3>
                    <p className="text-slate-500 mt-2">Questa sezione è stata disabilitata nelle configurazioni.</p>
                </div>
            );
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
                        <h3 className="text-xl font-semibold text-slate-700">Analisi in corso...</h3>
                        <p className="text-slate-500 mt-2">Stiamo analizzando questa sezione ({batch}).</p>
                        <p className="text-xs text-slate-400 mt-1">I risultati appariranno qui appena pronti.</p>
                    </div>
                </div>
            );
        }

        // Check if data exists for this section (if it's not a special section)
        if (activeSection !== 'configurazioni' && activeSection !== 'faq' && data && !data[activeSection as keyof AnalysisResult]) {
            return (
                <div className="flex flex-col items-center justify-center h-[50vh] text-center">
                    <AlertCircle className="h-16 w-16 text-amber-300 mb-4" />
                    <h3 className="text-xl font-semibold text-slate-700">Dati non disponibili</h3>
                    <p className="text-slate-500 mt-2">I dati per questa sezione non sono stati generati o l'analisi è incompleta.</p>
                </div>
            );
        }

        switch (activeSection) {
            case '1_requisiti_partecipazione':
                return (
                    <div className="space-y-8">
                        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                            <ShieldCheck className="h-8 w-8 text-blue-600" />
                            Requisiti di Partecipazione
                        </h2>

                        {/* Ordine Generale */}
                        <div className="space-y-4">
                            <h3 className="text-xl font-semibold text-slate-800 border-b pb-2 flex items-center gap-2">
                                <Briefcase className="h-5 w-5 text-slate-500" />
                                Requisiti di Ordine Generale
                            </h3>
                            <div className="grid gap-4 md:grid-cols-2">
                                {data['1_requisiti_partecipazione'][0]?.ordine_generale?.map((req, i) => (
                                    <Card key={i} className="hover:shadow-md transition-shadow">
                                        <CardContent className="pt-6">
                                            <p className="text-sm text-slate-700">{req.requisito}</p>
                                            <Badge variant="outline" className="mt-2 text-xs bg-slate-50">{req.ref}</Badge>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>

                        {/* Ordine Speciale */}
                        <div className="space-y-4">
                            <h3 className="text-xl font-semibold text-slate-800 border-b pb-2 flex items-center gap-2">
                                <Award className="h-5 w-5 text-blue-500" />
                                Requisiti di Ordine Speciale
                            </h3>
                            <div className="grid gap-4 md:grid-cols-2">
                                {data['1_requisiti_partecipazione'][0]?.ordine_speciale?.map((req, i) => (
                                    <Card key={i} className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
                                        <CardContent className="pt-6">
                                            <p className="text-sm text-slate-700">{req.requisito}</p>
                                            <Badge variant="outline" className="mt-2 text-xs bg-blue-50">{req.ref}</Badge>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>

                        {/* Idoneità Professionale */}
                        <div className="space-y-4">
                            <h3 className="text-xl font-semibold text-slate-800 border-b pb-2 flex items-center gap-2">
                                <Users className="h-5 w-5 text-purple-500" />
                                Idoneità Professionale
                            </h3>
                            <div className="grid gap-4 md:grid-cols-2">
                                {data['1_requisiti_partecipazione'][0]?.idoneita_professionale?.map((req, i) => (
                                    <Card key={i} className="hover:shadow-md transition-shadow">
                                        <CardContent className="pt-6">
                                            <p className="text-sm text-slate-700">{req.requisito}</p>
                                            <Badge variant="outline" className="mt-2 text-xs bg-purple-50">{req.ref}</Badge>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>

                        {/* Capacità Tecnica */}
                        <div className="space-y-4">
                            <h3 className="text-xl font-semibold text-slate-800 border-b pb-2 flex items-center gap-2">
                                <Settings className="h-5 w-5 text-green-500" />
                                Capacità Tecnica e Professionale
                            </h3>
                            <div className="grid gap-4 md:grid-cols-2">
                                {data['1_requisiti_partecipazione'][0]?.capacita_tecnica?.map((req, i) => (
                                    <Card key={i} className="hover:shadow-md transition-shadow">
                                        <CardContent className="pt-6">
                                            <p className="text-sm text-slate-700">{req.requisito}</p>
                                            <Badge variant="outline" className="mt-2 text-xs bg-green-50">{req.ref}</Badge>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>

                        <SemanticAnalysisBlock data={data.semantic_analysis_data?.['1_requisiti_partecipazione']} />
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
                        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                            <FileText className="h-8 w-8 text-amber-500" />
                            Sintesi Gara
                        </h2>
                        <Card className="bg-amber-50 border-amber-200">
                            <CardHeader>
                                <CardTitle className="text-amber-900">Oggetto dell'Appalto</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-lg font-medium text-amber-800">{data['3_sintesi'].oggetto}</p>
                                <div className="flex gap-4 mt-4">
                                    <Badge variant="secondary" className="bg-white text-amber-700 border-amber-200">
                                        CIG: {data['3_sintesi'].codici.cig}
                                    </Badge>
                                    <Badge variant="secondary" className="bg-white text-amber-700 border-amber-200">
                                        CUP: {data['3_sintesi'].codici.cup}
                                    </Badge>
                                    <Badge variant="secondary" className="bg-white text-amber-700 border-amber-200">
                                        CPV: {data['3_sintesi'].codici.cpv}
                                    </Badge>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>Scenario e Contesto</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-slate-700 leading-relaxed">{data['3_sintesi'].scenario}</p>
                            </CardContent>
                        </Card>
                        <SemanticAnalysisBlock data={data.semantic_analysis_data?.['3_sintesi']} />
                        <DeepDive
                            sectionId="3_sintesi"
                            existingQA={data.deep_dives?.['3_sintesi']}
                            onAskQuestion={onAskQuestion}
                            isGlobalLoading={isGlobalLoading}
                            exampleQuestion={DEEP_DIVE_EXAMPLES['3_sintesi']}
                        />
                    </div>
                );

            case '3b_checklist_amministrativa':
                const checklistData = data['3b_checklist_amministrativa']?.[0];
                if (!checklistData) {
                    return (
                        <div className="p-8 text-center text-slate-500 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                            <ClipboardCheck className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                            <p>Dati non disponibili per questa sezione.</p>
                            <p className="text-sm mt-2">Prova a ri-analizzare il documento.</p>
                        </div>
                    );
                }

                return (
                    <div className="space-y-8">
                        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                            <ClipboardCheck className="h-8 w-8 text-emerald-600" />
                            Checklist Busta Amministrativa
                        </h2>

                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Garanzia Provvisoria */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <ShieldCheck className="h-5 w-5 text-emerald-500" />
                                        Garanzia Provvisoria
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <span className="text-sm font-medium text-slate-500">Importo</span>
                                        <p className="font-medium text-slate-900">{checklistData.garanzia_provvisoria?.importo || '-'}</p>
                                    </div>
                                    <div>
                                        <span className="text-sm font-medium text-slate-500">Beneficiario</span>
                                        <p className="text-slate-900">{checklistData.garanzia_provvisoria?.beneficiario || '-'}</p>
                                    </div>
                                    <div>
                                        <span className="text-sm font-medium text-slate-500">Validità</span>
                                        <p className="text-slate-900">{checklistData.garanzia_provvisoria?.validita || '-'}</p>
                                    </div>
                                    <div>
                                        <span className="text-sm font-medium text-slate-500">Clausole</span>
                                        <p className="text-slate-900 text-sm">{checklistData.garanzia_provvisoria?.clausole || '-'}</p>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Contributo ANAC & Bollo */}
                            <div className="space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Banknote className="h-5 w-5 text-blue-500" />
                                            Contributo ANAC
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex justify-between">
                                            <div>
                                                <span className="text-sm font-medium text-slate-500">Importo</span>
                                                <p className="font-medium text-slate-900">{checklistData.contributo_anac?.importo || '-'}</p>
                                            </div>
                                            <div>
                                                <span className="text-sm font-medium text-slate-500">CIG</span>
                                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                                    {checklistData.contributo_anac?.cig || '-'}
                                                </Badge>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <FileText className="h-5 w-5 text-purple-500" />
                                            Imposta di Bollo
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-medium text-slate-500">Importo</span>
                                            <p className="font-medium text-slate-900">{checklistData.imposta_bollo?.importo || '-'}</p>
                                        </div>
                                        <div>
                                            <span className="text-sm font-medium text-slate-500">Modalità</span>
                                            <p className="text-slate-900 text-sm">{checklistData.imposta_bollo?.modalita || '-'}</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Sopralluogo */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <MapPin className="h-5 w-5 text-amber-500" />
                                        Sopralluogo
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <span className="text-sm font-medium text-slate-500">Stato</span>
                                        <div className="mt-1">
                                            <Badge variant={checklistData.sopralluogo?.stato?.toLowerCase().includes('obbligatorio') ? 'destructive' : 'secondary'}>
                                                {checklistData.sopralluogo?.stato || '-'}
                                            </Badge>
                                        </div>
                                    </div>
                                    <div>
                                        <span className="text-sm font-medium text-slate-500">Modalità</span>
                                        <p className="text-slate-900 text-sm">{checklistData.sopralluogo?.modalita || '-'}</p>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Firma e Formato */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <FileCode className="h-5 w-5 text-slate-600" />
                                        Firma e Piattaforma
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <span className="text-sm font-medium text-slate-500">Formato Firma</span>
                                        <p className="font-medium text-slate-900">{checklistData.firma_formato?.formato || '-'}</p>
                                    </div>
                                    <div>
                                        <span className="text-sm font-medium text-slate-500">Piattaforma</span>
                                        <p className="text-slate-900">{checklistData.firma_formato?.piattaforma || '-'}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Elenco Documenti */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <CheckSquare className="h-5 w-5 text-blue-600" />
                                    Checklist Documentale
                                </CardTitle>
                                <CardDescription>Elenco delle dichiarazioni e documenti richiesti oltre al DGUE</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {(checklistData.elenco_documenti && Array.isArray(checklistData.elenco_documenti) && checklistData.elenco_documenti.length > 0) ? (
                                        checklistData.elenco_documenti.map((doc, i) => (
                                            <div key={i} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                                                <div className="mt-0.5">
                                                    <div className="h-5 w-5 rounded border-2 border-slate-300" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-slate-900">{doc.documento}</p>
                                                    {doc.descrizione && <p className="text-sm text-slate-600 mt-1">{doc.descrizione}</p>}
                                                    {doc.ref && <p className="text-xs text-slate-400 mt-1">Ref: {doc.ref}</p>}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-slate-500 italic">Nessun documento specifico aggiuntivo rilevato.</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <SemanticAnalysisBlock data={data.semantic_analysis_data?.['3b_checklist_amministrativa']} />
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
                        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                            <Zap className="h-8 w-8 text-yellow-500" />
                            Dettaglio Servizi
                        </h2>
                        <div className="grid gap-6 md:grid-cols-2">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Box className="h-5 w-5 text-blue-500" />
                                        Attività Richieste
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ul className="space-y-2">
                                        {data['4_servizi'][0]?.attivita?.map((att, i) => (
                                            <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                                                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                                                {att}
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Lightbulb className="h-5 w-5 text-yellow-500" />
                                        Innovazioni e Migliorie
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-slate-700">{data['4_servizi'][0]?.innovazioni}</p>
                                </CardContent>
                            </Card>
                        </div>
                        <Card>
                            <CardHeader>
                                <CardTitle>Fabbisogno Stimato</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-slate-700">{data['4_servizi'][0]?.fabbisogno}</p>
                            </CardContent>
                        </Card>
                        <SemanticAnalysisBlock data={data.semantic_analysis_data?.['4_servizi']} />
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
                return (
                    <div className="space-y-8">
                        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                            <Calendar className="h-8 w-8 text-red-500" />
                            Timeline e Scadenze
                        </h2>
                        <div className="relative border-l-2 border-slate-200 ml-4 space-y-8">
                            {data['5_scadenze'][0]?.timeline?.map((event, i) => (
                                <div key={i} className="relative pl-6">
                                    <div className="absolute -left-[9px] top-1 h-4 w-4 rounded-full bg-white border-2 border-blue-500" />
                                    <div className="text-sm text-slate-500 font-mono mb-1">{event.data}</div>
                                    <div className="font-medium text-slate-900">{event.evento}</div>
                                    <Badge variant="outline" className="mt-1 text-xs">{event.ref}</Badge>
                                </div>
                            ))}
                        </div>
                        <Card className="bg-slate-50">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <MapPin className="h-5 w-5 text-red-500" />
                                    Sopralluogo
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <span className="text-sm font-medium text-slate-500">Previsto</span>
                                    <p className="font-semibold">{data['5_scadenze'][0]?.sopralluogo?.previsto}</p>
                                </div>
                                <div>
                                    <span className="text-sm font-medium text-slate-500">Obbligatorio</span>
                                    <p className="font-semibold">{data['5_scadenze'][0]?.sopralluogo?.obbligatorio}</p>
                                </div>
                                <div className="md:col-span-2">
                                    <span className="text-sm font-medium text-slate-500">Modalità</span>
                                    <p className="text-sm text-slate-700">{data['5_scadenze'][0]?.sopralluogo?.modalita}</p>
                                </div>
                            </CardContent>
                        </Card>
                        <SemanticAnalysisBlock data={data.semantic_analysis_data?.['5_scadenze']} />
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
                        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                            <DollarSign className="h-8 w-8 text-green-600" />
                            Quadro Economico
                        </h2>
                        <div className="grid gap-6 md:grid-cols-2">
                            <Card className="bg-green-50 border-green-200">
                                <CardContent className="pt-6 text-center">
                                    <p className="text-sm font-medium text-green-800 mb-1">Base d'Asta Totale</p>
                                    <p className="text-3xl font-bold text-green-700">
                                        {new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(data['6_importi'][0]?.base_asta_totale || 0)}
                                    </p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="pt-6 text-center">
                                    <p className="text-sm font-medium text-slate-500 mb-1">Costi della Manodopera</p>
                                    <p className="text-2xl font-semibold text-slate-700">
                                        {new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(data['6_importi'][0]?.costi_manodopera || 0)}
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                        <Card>
                            <CardHeader>
                                <CardTitle>Dettaglio Voci di Costo</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Voce</TableHead>
                                            <TableHead className="text-right">Importo</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {data['6_importi'][0]?.dettaglio?.map((item, i) => (
                                            <TableRow key={i}>
                                                <TableCell className="font-medium">{item.voce}</TableCell>
                                                <TableCell className="text-right font-mono">
                                                    {new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(item.importo)}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                        <SemanticAnalysisBlock data={data.semantic_analysis_data?.['6_importi']} />
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
                        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                            <Clock className="h-8 w-8 text-blue-500" />
                            Durata e Tempistiche
                        </h2>
                        <div className="grid gap-6 md:grid-cols-2">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Durata Base</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-xl font-semibold text-slate-800">{data['7_durata'][0]?.durata_base}</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader>
                                    <CardTitle>Opzioni di Proroga</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-slate-700">{data['7_durata'][0]?.proroghe}</p>
                                </CardContent>
                            </Card>
                        </div>
                        <Card>
                            <CardHeader>
                                <CardTitle>Tempistiche Operative</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-slate-700">{data['7_durata'][0]?.tempistiche_operative}</p>
                            </CardContent>
                        </Card>
                        <SemanticAnalysisBlock data={data.semantic_analysis_data?.['7_durata']} />
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
                        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                            <Building className="h-8 w-8 text-orange-500" />
                            CCNL e Clausola Sociale
                        </h2>
                        <Card>
                            <CardHeader>
                                <CardTitle>Contratti Collettivi Applicabili</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-2">
                                    {data['8_ccnl'][0]?.contratti?.map((c, i) => (
                                        <Badge key={i} variant="secondary" className="text-sm py-1 px-3">
                                            {c}
                                        </Badge>
                                    ))}
                                </div>
                                <div className="mt-4">
                                    <h4 className="text-sm font-semibold text-slate-900 mb-1">Equivalenze</h4>
                                    <p className="text-sm text-slate-600">{data['8_ccnl'][0]?.equivalenze}</p>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="border-l-4 border-l-orange-500">
                            <CardHeader>
                                <CardTitle>Clausola Sociale</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-slate-700">{data['8_ccnl'][0]?.clausola_sociale}</p>
                            </CardContent>
                        </Card>
                        <SemanticAnalysisBlock data={data.semantic_analysis_data?.['8_ccnl']} />
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
                        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                            <Scale className="h-8 w-8 text-indigo-500" />
                            Ripartizione Oneri
                        </h2>
                        <div className="grid gap-6 md:grid-cols-2">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-red-600">A Carico del Fornitore</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ul className="space-y-2">
                                        {data['9_oneri'][0]?.carico_fornitore?.map((item, i) => (
                                            <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                                                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-red-500 flex-shrink-0" />
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-green-600">A Carico della Stazione Appaltante</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ul className="space-y-2">
                                        {data['9_oneri'][0]?.carico_stazione?.map((item, i) => (
                                            <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                                                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-green-500 flex-shrink-0" />
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                            </Card>
                        </div>
                        <SemanticAnalysisBlock data={data.semantic_analysis_data?.['9_oneri']} />
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
                        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                            <Target className="h-8 w-8 text-pink-500" />
                            Criteri di Valutazione
                        </h2>

                        <div className="grid gap-6 md:grid-cols-3">
                            <Card className="bg-pink-50 border-pink-200">
                                <CardContent className="pt-6 text-center">
                                    <p className="text-sm font-medium text-pink-800 mb-1">Punteggio Tecnico</p>
                                    <p className="text-4xl font-bold text-pink-700">{data['10_punteggi'][0]?.tecnico}</p>
                                </CardContent>
                            </Card>
                            <Card className="bg-blue-50 border-blue-200">
                                <CardContent className="pt-6 text-center">
                                    <p className="text-sm font-medium text-blue-800 mb-1">Punteggio Economico</p>
                                    <p className="text-4xl font-bold text-blue-700">{data['10_punteggi'][0]?.economico}</p>
                                </CardContent>
                            </Card>
                            <Card className="bg-slate-50 border-slate-200">
                                <CardContent className="pt-6 text-center">
                                    <p className="text-sm font-medium text-slate-600 mb-1">Soglia Sbarramento</p>
                                    <p className="text-4xl font-bold text-slate-700">{data['10_punteggi'][0]?.soglia_sbarramento}</p>
                                </CardContent>
                            </Card>
                        </div>


                        <Card>
                            <CardHeader>
                                <CardTitle>Dettaglio Criteri Tecnici</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-6">
                                    {data['10_punteggi'][0]?.criteri_tecnici?.map((criterio, i) => (
                                        <div key={i} className="border-b last:border-0 pb-4 last:pb-0">
                                            <div className="flex justify-between items-start mb-2">
                                                <h4 className="font-semibold text-slate-900">{criterio.criterio}</h4>
                                                <Badge>{criterio.punti_max} pt</Badge>
                                            </div>
                                            <p className="text-sm text-slate-600 mb-3">{criterio.descrizione}</p>
                                            {criterio.subcriteri && criterio.subcriteri.length > 0 && (
                                                <div className="bg-slate-50 p-3 rounded-md">
                                                    <p className="text-xs font-semibold text-slate-500 mb-2 uppercase">Sub-criteri</p>
                                                    <ul className="space-y-1">
                                                        {criterio.subcriteri.map((sub, j) => (
                                                            <li key={j} className="text-sm flex justify-between">
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

                        <Card className="border-l-4 border-l-blue-500">
                            <CardHeader>
                                <CardTitle className="text-blue-700">Formula Economica</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {data['10_punteggi'][0]?.formula_economica_dettaglio ? (
                                    <>
                                        <div>
                                            <h4 className="font-semibold text-slate-900 mb-1">Formula</h4>
                                            <code className="block bg-slate-100 p-3 rounded text-sm text-slate-800 font-mono">
                                                {data['10_punteggi'][0].formula_economica_dettaglio.formula}
                                            </code>
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-slate-900 mb-1">Parametri</h4>
                                            <p className="text-sm text-slate-700 whitespace-pre-line">
                                                {data['10_punteggi'][0].formula_economica_dettaglio.parametri_legenda}
                                            </p>
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-slate-900 mb-1">Modalità di Calcolo</h4>
                                            <p className="text-sm text-slate-700">
                                                {data['10_punteggi'][0].formula_economica_dettaglio.modalita_calcolo}
                                            </p>
                                        </div>
                                    </>
                                ) : (
                                    <p className="text-slate-700 italic">
                                        {data['10_punteggi'][0]?.formula_economica || "Dettaglio formula non disponibile."}
                                    </p>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Note Economiche</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-slate-700">{data['10_punteggi'][0]?.note_economiche}</p>
                            </CardContent>
                        </Card>
                        <SemanticAnalysisBlock data={data.semantic_analysis_data?.['10_punteggi']} />
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
                        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                            <AlertTriangle className="h-8 w-8 text-red-600" />
                            Prescrizioni a Pena di Esclusione
                        </h2>
                        <div className="grid gap-4">
                            {data['11_pena_esclusione'][0]?.elementi?.map((item, i) => (
                                <Card key={i} className="border-l-4 border-l-red-500">
                                    <CardContent className="pt-6">
                                        <p className="text-slate-800 font-medium">{item.descrizione}</p>
                                        <Badge variant="outline" className="mt-2 bg-red-50 text-red-700 border-red-200">
                                            {item.ref}
                                        </Badge>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                        <SemanticAnalysisBlock data={data.semantic_analysis_data?.['11_pena_esclusione']} />
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
                        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                            <FileCode className="h-8 w-8 text-blue-600" />
                            Offerta Tecnica
                        </h2>
                        <Card>
                            <CardHeader>
                                <CardTitle>Documentazione Richiesta</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-3">
                                    {data['12_offerta_tecnica'][0]?.documenti?.map((doc, i) => (
                                        <li key={i} className="flex items-start gap-3 p-3 bg-slate-50 rounded-md">
                                            <CheckSquare className="h-5 w-5 text-blue-500 mt-0.5" />
                                            <span className="text-sm text-slate-700">{doc}</span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>Modalità di Presentazione</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-slate-700 whitespace-pre-line">{data['12_offerta_tecnica'][0]?.formattazione_modalita}</p>
                            </CardContent>
                        </Card>
                        <SemanticAnalysisBlock data={data.semantic_analysis_data?.['12_offerta_tecnica']} />
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
                        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                            <Banknote className="h-8 w-8 text-green-600" />
                            Offerta Economica
                        </h2>
                        <Card>
                            <CardHeader>
                                <CardTitle>Documentazione Richiesta</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-3">
                                    {data['13_offerta_economica'][0]?.documenti?.map((doc, i) => (
                                        <li key={i} className="flex items-start gap-3 p-3 bg-slate-50 rounded-md">
                                            <CheckSquare className="h-5 w-5 text-green-500 mt-0.5" />
                                            <span className="text-sm text-slate-700">{doc}</span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>Modalità di Presentazione</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-slate-700 whitespace-pre-line">{data['13_offerta_economica'][0]?.formattazione_modalita}</p>
                            </CardContent>
                        </Card>
                        <SemanticAnalysisBlock data={data.semantic_analysis_data?.['13_offerta_economica']} />
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
                        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                            <Info className="h-8 w-8 text-amber-500" />
                            Note Importanti AI
                        </h2>
                        <div className="grid gap-4">
                            {data['14_note_importanti'][0]?.note?.map((note, i) => (
                                <Card key={i} className="bg-amber-50 border-amber-200">
                                    <CardContent className="pt-6 flex gap-4">
                                        <AlertCircle className="h-6 w-6 text-amber-600 flex-shrink-0" />
                                        <div>
                                            <p className="text-amber-900 font-medium">{note.nota}</p>
                                            <Badge variant="outline" className="mt-2 bg-white text-amber-700 border-amber-300">
                                                {note.ref}
                                            </Badge>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                        <SemanticAnalysisBlock data={data.semantic_analysis_data?.['14_note_importanti']} />
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
                        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                            <CreditCard className="h-8 w-8 text-cyan-600" />
                            Remunerazione
                        </h2>
                        <div className="grid gap-6 md:grid-cols-3">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Modalità</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-slate-700">{data['15_remunerazione'][0]?.modalita}</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader>
                                    <CardTitle>Pagamenti</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-slate-700">{data['15_remunerazione'][0]?.pagamenti}</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader>
                                    <CardTitle>Clausole</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-slate-700">{data['15_remunerazione'][0]?.clausole}</p>
                                </CardContent>
                            </Card>
                        </div>
                        <SemanticAnalysisBlock data={data.semantic_analysis_data?.['15_remunerazione']} />
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
                        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                            <Gavel className="h-8 w-8 text-red-700" />
                            SLA e Penali
                        </h2>
                        <Card>
                            <CardHeader>
                                <CardTitle>Service Level Agreement (SLA)</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {data['16_sla_penali'][0]?.sla?.map((s: any, i: number) => (
                                        <div key={i} className="p-3 bg-slate-50 rounded border border-slate-100 text-sm text-slate-700">
                                            <p><strong>Indicatore:</strong> {s.indicatore}</p>
                                            <p><strong>Soglia:</strong> {s.soglia}</p>
                                        </div>
                                    ))}
                                    {(!data['16_sla_penali'][0]?.sla || data['16_sla_penali'][0]?.sla.length === 0) && (
                                        <p className="text-slate-500 italic">Nessun SLA specifico rilevato.</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>Penali Applicabili</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {data['16_sla_penali'][0]?.penali?.map((p: any, i: number) => (
                                        <div key={i} className="p-3 bg-red-50 rounded border border-red-100 text-sm text-slate-700">
                                            <p><strong>Descrizione:</strong> {p.descrizione}</p>
                                            <p><strong>Calcolo:</strong> {p.calcolo}</p>
                                        </div>
                                    ))}
                                    {(!data['16_sla_penali'][0]?.penali || data['16_sla_penali'][0]?.penali.length === 0) && (
                                        <p className="text-slate-500 italic">Nessuna penale specifica rilevata.</p>
                                    )}
                                </div>
                                <div className="mt-4 p-3 bg-slate-100 rounded text-sm flex items-start gap-2">
                                    <Info className="h-4 w-4 text-slate-500 mt-0.5" />
                                    <div><strong>Clausole Cumulative:</strong> {data['16_sla_penali'][0]?.clausole_cumulative}</div>
                                </div>
                            </CardContent>
                        </Card>
                        <SemanticAnalysisBlock data={data.semantic_analysis_data?.['16_sla_penali']} />
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
                        <div className="p-8 text-center text-slate-500 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                            <HelpCircle className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                            <p>Dati non disponibili per questa sezione.</p>
                            <p className="text-sm mt-2">Prova a ri-analizzare il documento.</p>
                        </div>
                    );
                }

                return (
                    <div className="space-y-8">
                        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                            <HelpCircle className="h-8 w-8 text-amber-500" />
                            Ambiguità e Punti da Chiarire
                        </h2>

                        <div className="space-y-6">
                            {/* Ambiguità Rilevate */}
                            <Card className="border-l-4 border-l-amber-500">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-amber-700">
                                        <AlertTriangle className="h-5 w-5" />
                                        Ambiguità Rilevate
                                    </CardTitle>
                                    <CardDescription>
                                        Punti del disciplinare che potrebbero essere soggetti a interpretazione o contraddittori.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {sectionData.ambiguita?.length > 0 ? (
                                            sectionData.ambiguita.map((item, i) => (
                                                <div key={i} className="bg-amber-50 p-4 rounded-lg border border-amber-100">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <Badge variant="outline" className="bg-white text-amber-700 border-amber-200">
                                                            {item.tipo}
                                                        </Badge>
                                                        {item.riferimento_documento && (
                                                            <span className="text-xs text-slate-500">Ref: {item.riferimento_documento}</span>
                                                        )}
                                                    </div>
                                                    <p className="text-slate-800 font-medium">{item.descrizione}</p>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-slate-500 italic">Nessuna ambiguità critica rilevata.</p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Quesiti Suggeriti */}
                            <Card className="border-l-4 border-l-blue-500">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-blue-700">
                                        <MessageSquare className="h-5 w-5" />
                                        Quesiti da Porre alla Stazione Appaltante
                                    </CardTitle>
                                    <CardDescription>
                                        Domande suggerite per chiarire i dubbi emersi durante l'analisi.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {sectionData.punti_da_chiarire?.length > 0 ? (
                                            sectionData.punti_da_chiarire.map((item, i) => (
                                                <div key={i} className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                                                    <h4 className="font-semibold text-blue-900 mb-2">{item.quesito_suggerito}</h4>
                                                    <div className="space-y-2 text-sm">
                                                        <div>
                                                            <span className="font-medium text-slate-600">Contesto: </span>
                                                            <span className="text-slate-700">{item.contesto}</span>
                                                        </div>
                                                        <div>
                                                            <span className="font-medium text-slate-600">Motivazione: </span>
                                                            <span className="text-slate-700">{item.motivazione}</span>
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
                        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                            <div className="bg-purple-600 text-white p-2 rounded-lg">
                                <Bot className="h-6 w-6" />
                            </div>
                            FAQ & Approfondimenti AI
                        </h2>
                        <p className="text-slate-600">
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
                                    className="hover:shadow-lg transition-all cursor-pointer border-l-4 border-l-purple-500 hover:bg-purple-50 group"
                                    onClick={() => onAskQuestion('faq', question)}
                                >
                                    <CardContent className="p-6 flex items-start gap-4">
                                        <div className="bg-purple-100 p-2 rounded-full group-hover:bg-purple-200 transition-colors">
                                            <MessageSquare className="h-5 w-5 text-purple-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-medium text-slate-900 group-hover:text-purple-900 transition-colors">
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
                        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                            <Settings className="h-8 w-8 text-slate-700" />
                            Configurazioni
                        </h2>

                        {/* Unified Section Configuration */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Configurazione Sezioni</CardTitle>
                                <CardDescription>Gestisci quali sezioni includere nell'analisi AI e nell'esportazione DOCX.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="mb-6 p-4 bg-amber-50 border-l-4 border-amber-500 rounded-r-md flex items-start gap-3">
                                    <Info className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                                    <div className="text-sm text-amber-800">
                                        <span className="font-semibold block mb-1">Nota sull'Analisi Semantica</span>
                                        L'analisi semantica permette di avere un approfondimento sulle informazioni della sezione, tuttavia si evidenzia che maggiore sarà l'utilizzo dell'analisi semantica, maggiore sarà il tempo richiesto per l'analisi.
                                    </div>
                                </div>

                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Sezione</TableHead>
                                                <TableHead className="text-center w-32">Analisi AI</TableHead>
                                                <TableHead className="text-center w-32">Analisi Semantica</TableHead>
                                                <TableHead className="text-center w-32">Export DOCX</TableHead>
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
                                                            <TableRow className="bg-slate-50 hover:bg-slate-50">
                                                                <TableCell colSpan={3} className="font-semibold text-slate-500 uppercase tracking-wider text-xs py-3">
                                                                    {header}
                                                                </TableCell>
                                                            </TableRow>
                                                        )}
                                                        <TableRow>
                                                            <TableCell className="font-medium flex items-center gap-2">
                                                                {React.createElement(section.icon, { className: "h-4 w-4 text-slate-500" })}
                                                                {section.label}
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
                                                                    className={`h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 ${isFaq ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                                                                        sectionId === '17_ambiguita_punti_da_chiarire'
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
                                                                    className={`h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 ${(!isAnalysisEnabled || isFaq) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                                />
                                                            </TableCell>
                                                            <TableCell className="text-center">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={isExportEnabled}
                                                                    disabled={(!isAnalysisEnabled && !isFaq)}
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
                                                                    className={`h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 ${(!isAnalysisEnabled && !isFaq) ? 'opacity-50 cursor-not-allowed' : ''}`}
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

                        {/* Model Configuration */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Modelli di Analisi Predefiniti</CardTitle>
                                <CardDescription>Seleziona i modelli di intelligenza artificiale da utilizzare per le analisi.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-8 md:grid-cols-2">
                                    {/* Structured Models */}
                                    <div>
                                        <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                                            <div className="bg-emerald-100 p-1.5 rounded">
                                                <Database className="h-4 w-4 text-emerald-600" />
                                            </div>
                                            Estrazione Strutturata
                                        </h3>
                                        <div className="space-y-3">
                                            {AVAILABLE_MODELS.filter(m => m.type === 'structured').map((model) => (
                                                <div
                                                    key={model.id}
                                                    className={`cursor-pointer rounded-lg border p-4 transition-all hover:shadow-md relative ${userPreferences?.structured_model === model.id
                                                        ? 'border-emerald-600 bg-emerald-50 ring-2 ring-emerald-600 ring-offset-2'
                                                        : (model as any).isRecommended
                                                            ? 'border-amber-400 bg-amber-50/30'
                                                            : 'border-slate-200 bg-white'
                                                        }`}
                                                    onClick={() => {
                                                        if (onUpdatePreferences && userPreferences) {
                                                            onUpdatePreferences({
                                                                ...userPreferences,
                                                                structured_model: model.id
                                                            });
                                                        }
                                                    }}
                                                >
                                                    {(model as any).isRecommended && (
                                                        <Badge className="absolute -top-2 -right-2 bg-amber-500 hover:bg-amber-600 text-white border-none shadow-sm text-[10px]">
                                                            Consigliato
                                                        </Badge>
                                                    )}
                                                    <div className="flex items-center justify-between mb-1">
                                                        <h4 className="font-semibold text-slate-900">{model.name}</h4>
                                                        {userPreferences?.structured_model === model.id && (
                                                            <CheckSquare className="h-5 w-5 text-emerald-600" />
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-slate-500 mb-2">{model.description}</p>
                                                    <div className="flex gap-2 text-[10px]">
                                                        <Badge variant="secondary" className="bg-slate-100 text-slate-700">
                                                            {model.speed}
                                                        </Badge>
                                                        <Badge variant="secondary" className="bg-slate-100 text-slate-700">
                                                            {model.cost}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Semantic Models */}
                                    <div>
                                        <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                                            <div className="bg-purple-100 p-1.5 rounded">
                                                <BrainCircuit className="h-4 w-4 text-purple-600" />
                                            </div>
                                            Analisi Semantica
                                        </h3>
                                        <div className="space-y-3">
                                            {AVAILABLE_MODELS.filter(m => m.type === 'semantic').map((model) => (
                                                <div
                                                    key={model.id}
                                                    className={`cursor-pointer rounded-lg border p-4 transition-all hover:shadow-md relative ${userPreferences?.semantic_model === model.id
                                                        ? 'border-purple-600 bg-purple-50 ring-2 ring-purple-600 ring-offset-2'
                                                        : (model as any).isRecommended
                                                            ? 'border-amber-400 bg-amber-50/30'
                                                            : 'border-slate-200 bg-white'
                                                        }`}
                                                    onClick={() => {
                                                        if (onUpdatePreferences && userPreferences) {
                                                            onUpdatePreferences({
                                                                ...userPreferences,
                                                                semantic_model: model.id
                                                            });
                                                        }
                                                    }}
                                                >
                                                    {(model as any).isRecommended && (
                                                        <Badge className="absolute -top-2 -right-2 bg-amber-500 hover:bg-amber-600 text-white border-none shadow-sm text-[10px]">
                                                            Consigliato
                                                        </Badge>
                                                    )}
                                                    <div className="flex items-center justify-between mb-1">
                                                        <h4 className="font-semibold text-slate-900">{model.name}</h4>
                                                        {userPreferences?.semantic_model === model.id && (
                                                            <CheckSquare className="h-5 w-5 text-purple-600" />
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-slate-500 mb-2">{model.description}</p>
                                                    <div className="flex gap-2 text-[10px]">
                                                        <Badge variant="secondary" className="bg-slate-100 text-slate-700">
                                                            {model.speed}
                                                        </Badge>
                                                        <Badge variant="secondary" className="bg-slate-100 text-slate-700">
                                                            {model.cost}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* FAQ Configuration */}
                        < Card >
                            <CardHeader>
                                <CardTitle>Gestione FAQ</CardTitle>
                                <CardDescription>Aggiungi o rimuovi le domande preimpostate per la sezione FAQ.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        id="new-faq"
                                        placeholder="Nuova domanda..."
                                        className="flex-1 px-3 py-2 border rounded-md text-sm"
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
                                        <div key={i} className="flex items-center justify-between bg-slate-50 p-3 rounded border">
                                            {editingFaqIndex === i ? (
                                                <input
                                                    type="text"
                                                    defaultValue={q}
                                                    className="flex-1 px-2 py-1 border rounded text-sm mr-2"
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
                                                <span className="text-sm text-slate-700 flex-1">{q}</span>
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
