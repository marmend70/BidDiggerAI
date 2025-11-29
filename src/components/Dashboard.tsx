import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { AnalysisResult } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import {
    AlertTriangle, Info, DollarSign, FileText, CheckSquare, ShieldCheck, Briefcase,
    Award, Users, MapPin, Target, Settings, Zap, Box, Calendar, Clock, AlertCircle,
    TrendingUp, Hourglass, RefreshCw, PlayCircle, BookOpen, Scale, Wallet, Building,
    Calculator, Percent, Ban, FileCode, Banknote, Lightbulb, CreditCard, Activity, Gavel
} from 'lucide-react';

interface DashboardProps {
    data: AnalysisResult;
    activeSection: string;
}

export function Dashboard({ data, activeSection }: DashboardProps) {
    const renderContent = () => {
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
                                {data['1_requisiti_partecipazione'].ordine_generale.map((req, i) => (
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
                                {data['1_requisiti_partecipazione'].ordine_speciale.map((req, i) => (
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
                                {data['1_requisiti_partecipazione'].idoneita_professionale.map((req, i) => (
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
                                {data['1_requisiti_partecipazione'].capacita_tecnica.map((req, i) => (
                                    <Card key={i} className="border-l-4 border-l-green-500 hover:shadow-md transition-shadow">
                                        <CardContent className="pt-6">
                                            <p className="text-sm text-slate-700">{req.requisito}</p>
                                            <Badge variant="outline" className="mt-2 text-xs bg-green-50">{req.ref}</Badge>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>

                        {/* Altre Indicazioni */}
                        <div className="space-y-6 mt-8">
                            <h3 className="text-xl font-semibold text-slate-800 border-b pb-2 flex items-center gap-2">
                                <Info className="h-5 w-5 text-amber-500" />
                                Altre Indicazioni
                            </h3>
                            <div className="grid gap-6 md:grid-cols-2">
                                <Card>
                                    <CardHeader><CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4" /> RTI e Consorzi</CardTitle></CardHeader>
                                    <CardContent><p className="text-sm text-slate-600">{data['1_requisiti_partecipazione'].rti_consorzi}</p></CardContent>
                                </Card>
                                <Card>
                                    <CardHeader><CardTitle className="text-base flex items-center gap-2"><Building className="h-4 w-4" /> Consorzi Stabili</CardTitle></CardHeader>
                                    <CardContent><p className="text-sm text-slate-600">{data['1_requisiti_partecipazione'].consorzi_stabili}</p></CardContent>
                                </Card>
                                <Card>
                                    <CardHeader><CardTitle className="text-base flex items-center gap-2"><RefreshCw className="h-4 w-4" /> Avvalimento</CardTitle></CardHeader>
                                    <CardContent><p className="text-sm text-slate-600">{data['1_requisiti_partecipazione'].avvalimento}</p></CardContent>
                                </Card>
                                <Card>
                                    <CardHeader><CardTitle className="text-base flex items-center gap-2"><Box className="h-4 w-4" /> Subappalto</CardTitle></CardHeader>
                                    <CardContent><p className="text-sm text-slate-600">{data['1_requisiti_partecipazione'].subappalto}</p></CardContent>
                                </Card>
                            </div>
                        </div>
                    </div>
                );

            case '3_sintesi':
                return (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                            <FileText className="h-8 w-8 text-blue-600" />
                            Sintesi Gara
                        </h2>
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><Target className="h-5 w-5 text-blue-500" /> Oggetto dell'Appalto</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-lg text-slate-800">{data['3_sintesi'].oggetto}</p>
                                <div className="flex gap-4 mt-4">
                                    <Badge className="text-md py-1 px-3 bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-200">CIG: {data['3_sintesi'].codici.cig}</Badge>
                                    <Badge variant="secondary" className="text-md py-1 px-3 bg-slate-100 text-slate-800">CUP: {data['3_sintesi'].codici.cup}</Badge>
                                    <Badge variant="outline" className="text-md py-1 px-3">CPV: {data['3_sintesi'].codici.cpv}</Badge>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5 text-red-500" /> Scenario e Contesto</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-slate-600">{data['3_sintesi'].scenario}</p>
                                <div className="mt-2 text-xs text-slate-400 flex items-center gap-1"><Info className="h-3 w-3" /> Rif: {data['3_sintesi'].ref}</div>
                            </CardContent>
                        </Card>
                    </div>
                );

            case '4_servizi':
                return (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                            <Settings className="h-8 w-8 text-slate-700" />
                            Dettaglio Servizi
                        </h2>
                        <div className="grid gap-6 md:grid-cols-2">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2"><Box className="h-5 w-5 text-amber-500" /> Attività Richieste</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ul className="list-disc pl-5 space-y-2">
                                        {data['4_servizi'].attivita.map((item, i) => (
                                            <li key={i} className="text-slate-700">{item}</li>
                                        ))}
                                    </ul>
                                </CardContent>
                            </Card>
                            <div className="space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2"><Zap className="h-5 w-5 text-yellow-500" /> Innovazioni</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-slate-700">{data['4_servizi'].innovazioni}</p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2"><Target className="h-5 w-5 text-green-500" /> Fabbisogno</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-slate-700">{data['4_servizi'].fabbisogno}</p>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </div>
                );

            case '5_scadenze': {
                const scadenzeData = data['5_scadenze'];
                const timeline = Array.isArray(scadenzeData) ? scadenzeData : scadenzeData?.timeline || [];
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const sopralluogo = Array.isArray(scadenzeData) ? null : (scadenzeData as any)?.sopralluogo;

                return (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                            <Calendar className="h-8 w-8 text-amber-600" />
                            Timeline Scadenze
                        </h2>
                        <div className="grid gap-6 md:grid-cols-3">
                            {/* Timeline */}
                            <div className="md:col-span-2 relative border-l-2 border-slate-200 ml-4 space-y-8 py-4">
                                {timeline.map((event, i) => (
                                    <div key={i} className="relative pl-8">
                                        <div className="absolute -left-[9px] top-1 h-4 w-4 rounded-full bg-amber-500 border-2 border-white shadow-sm" />
                                        <div className="text-sm text-amber-600 font-semibold flex items-center gap-2">
                                            <Clock className="h-3 w-3" /> {event.data}
                                        </div>
                                        <div className="text-lg font-medium text-slate-900">{event.evento}</div>
                                        <div className="text-xs text-slate-400 mt-1">Rif: {event.ref}</div>
                                    </div>
                                ))}
                            </div>

                            {/* Sopralluogo Card */}
                            {sopralluogo && (
                                <Card className="h-fit border-l-4 border-l-purple-500 shadow-md">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <MapPin className="h-5 w-5 text-purple-600" />
                                            Sopralluogo
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div>
                                            <span className="text-sm font-semibold text-slate-500 uppercase flex items-center gap-1"><Info className="h-3 w-3" /> Previsto</span>
                                            <p className="text-lg font-medium text-slate-900 capitalize">{sopralluogo.previsto || '-'}</p>
                                        </div>
                                        <div>
                                            <span className="text-sm font-semibold text-slate-500 uppercase flex items-center gap-1"><AlertCircle className="h-3 w-3" /> Obbligatorio</span>
                                            <p className={`text-lg font-medium capitalize ${sopralluogo.obbligatorio?.toLowerCase().includes('si') ? 'text-red-600' : 'text-slate-900'}`}>
                                                {sopralluogo.obbligatorio || '-'}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="text-sm font-semibold text-slate-500 uppercase flex items-center gap-1"><Calendar className="h-3 w-3" /> Scadenze</span>
                                            <p className="text-slate-700 text-sm">{sopralluogo.scadenze || '-'}</p>
                                        </div>
                                        <div>
                                            <span className="text-sm font-semibold text-slate-500 uppercase flex items-center gap-1"><Settings className="h-3 w-3" /> Modalità</span>
                                            <p className="text-slate-700 text-sm">{sopralluogo.modalita || '-'}</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </div>
                );
            }

            case '6_importi':
                return (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                            <DollarSign className="h-8 w-8 text-emerald-600" />
                            Quadro Economico
                        </h2>
                        <div className="grid gap-6 md:grid-cols-2">
                            <Card className="md:col-span-2 bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200 shadow-sm">
                                <CardHeader>
                                    <CardTitle className="text-slate-600 uppercase text-sm tracking-wide flex items-center gap-2">
                                        <TrendingUp className="h-4 w-4" /> Base d'Asta Totale
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center gap-3">
                                        <DollarSign className="h-10 w-10 text-emerald-600" />
                                        <span className="text-4xl font-bold text-emerald-700">
                                            {new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(data['6_importi'].base_asta_totale)}
                                        </span>
                                    </div>
                                    {data['6_importi'].costi_manodopera > 0 && (
                                        <div className="mt-4 flex items-center gap-2 text-slate-600 bg-white/50 p-2 rounded-md inline-block border border-emerald-100">
                                            <Users className="h-4 w-4 text-emerald-600" />
                                            <span className="font-medium">Di cui costi manodopera:</span>
                                            <span className="font-mono text-lg">
                                                {new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(data['6_importi'].costi_manodopera)}
                                            </span>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            <Card className="md:col-span-2">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-slate-500" /> Dettaglio Voci di Costo</CardTitle>
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
                                            {data['6_importi'].dettaglio.map((item, i) => (
                                                <TableRow key={i}>
                                                    <TableCell className="font-medium">{item.voce}</TableCell>
                                                    <TableCell className="text-right font-mono text-slate-700">
                                                        {new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(item.importo)}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                );

            case '7_durata':
                return (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                            <Hourglass className="h-8 w-8 text-cyan-600" />
                            Durata e Tempistiche
                        </h2>
                        <div className="grid gap-4 md:grid-cols-3">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-sm text-slate-500 uppercase flex items-center gap-2"><Clock className="h-4 w-4" /> Durata Base</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold text-slate-900">{data['7_durata'].durata_base}</div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-sm text-slate-500 uppercase flex items-center gap-2"><RefreshCw className="h-4 w-4" /> Proroghe</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-lg font-medium text-slate-900">{data['7_durata'].proroghe}</div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-sm text-slate-500 uppercase flex items-center gap-2"><PlayCircle className="h-4 w-4" /> Avvio</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-lg font-medium text-slate-900">{data['7_durata'].tempistiche_operative}</div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                );

            case '8_ccnl':
                return (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                            <BookOpen className="h-8 w-8 text-indigo-600" />
                            CCNL
                        </h2>
                        <Card>
                            <CardContent className="pt-6">
                                <h3 className="font-semibold mb-2 flex items-center gap-2"><FileText className="h-4 w-4 text-indigo-500" /> Contratti Applicabili</h3>
                                <ul className="list-disc pl-5 mb-4">
                                    {data['8_ccnl'].contratti.map((c, i) => <li key={i}>{c}</li>)}
                                </ul>
                                <h3 className="font-semibold mb-2 flex items-center gap-2"><Scale className="h-4 w-4 text-indigo-500" /> Equivalenze</h3>
                                <p>{data['8_ccnl'].equivalenze}</p>
                            </CardContent>
                        </Card>
                    </div>
                );

            case '9_oneri':
                return (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                            <Wallet className="h-8 w-8 text-rose-600" />
                            Ripartizione Oneri
                        </h2>
                        <div className="grid gap-6 md:grid-cols-2">
                            <Card>
                                <CardHeader><CardTitle className="flex items-center gap-2"><Briefcase className="h-5 w-5 text-rose-500" /> A Carico Fornitore</CardTitle></CardHeader>
                                <CardContent>
                                    <ul className="list-disc pl-5">{data['9_oneri'].carico_fornitore.map((c, i) => <li key={i}>{c}</li>)}</ul>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader><CardTitle className="flex items-center gap-2"><Building className="h-5 w-5 text-slate-500" /> A Carico Stazione Appaltante</CardTitle></CardHeader>
                                <CardContent>
                                    <ul className="list-disc pl-5">{data['9_oneri'].carico_stazione.map((c, i) => <li key={i}>{c}</li>)}</ul>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                );

            case '10_punteggi': {
                const pieData = [
                    { name: 'Tecnico', value: data['10_punteggi'].tecnico },
                    { name: 'Economico', value: data['10_punteggi'].economico },
                ];
                return (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                            <Calculator className="h-8 w-8 text-blue-600" />
                            Criteri di Valutazione
                        </h2>
                        <div className="grid gap-6 md:grid-cols-2">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2"><Percent className="h-5 w-5 text-blue-500" /> Ripartizione Punteggio</CardTitle>
                                </CardHeader>
                                <CardContent className="h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={pieData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={80}
                                                fill="#8884d8"
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {pieData.map((_, index) => (
                                                    <Cell key={`cell-${index}`} fill={index === 0 ? '#3b82f6' : '#22c55e'} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="text-center mt-4 text-sm text-slate-500">
                                        Soglia di sbarramento: {data['10_punteggi'].soglia_sbarramento} punti
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2"><Calculator className="h-5 w-5 text-green-500" /> Formula Economica</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <code className="bg-slate-100 p-4 rounded-lg block text-center font-mono text-lg text-slate-800 border border-slate-200">
                                        {data['10_punteggi'].formula_economica}
                                    </code>
                                    <p className="mt-4 text-sm text-slate-600 italic flex items-start gap-2"><Info className="h-4 w-4 mt-0.5" /> {data['10_punteggi'].note_economiche}</p>
                                </CardContent>
                            </Card>

                            <Card className="md:col-span-2">
                                <CardHeader>
                                    <CardTitle className="text-xl text-blue-700 flex items-center gap-2"><Settings className="h-5 w-5" /> Dettaglio Criteri Tecnici</CardTitle>
                                    <CardDescription>Analisi dettagliata dei criteri e sottocriteri di valutazione tecnica</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-6">
                                        {data['10_punteggi'].criteri_tecnici.map((crit, i) => (
                                            <div key={i} className="bg-white border rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow">
                                                <div className="flex justify-between items-start mb-3">
                                                    <h4 className="text-lg font-semibold text-slate-800 flex items-center gap-2"><Target className="h-4 w-4 text-blue-500" /> {crit.criterio}</h4>
                                                    <Badge className="text-lg px-3 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200">
                                                        {crit.punti_max} pt
                                                    </Badge>
                                                </div>
                                                <p className="text-slate-600 mb-3 leading-relaxed">{crit.descrizione}</p>
                                                <div className="flex items-center gap-2 text-sm text-slate-500 bg-slate-50 p-2 rounded w-fit mb-4">
                                                    <Info className="h-4 w-4" />
                                                    <span>Modalità: {crit.modalita}</span>
                                                </div>

                                                {crit.subcriteri && crit.subcriteri.length > 0 && (
                                                    <div className="mt-4 pl-4 border-l-4 border-blue-100 space-y-3">
                                                        <h5 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Sottocriteri</h5>
                                                        {crit.subcriteri.map((sub, j) => (
                                                            <div key={j} className="flex justify-between items-center bg-slate-50 p-3 rounded border border-slate-100">
                                                                <span className="text-slate-700 font-medium">{sub.descrizione}</span>
                                                                <span className="font-mono font-bold text-blue-600 bg-white px-2 py-1 rounded border border-blue-100">
                                                                    {sub.punti_max} pt
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                );
            }

            case '11_pena_esclusione':
                return (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                            <Ban className="text-red-600 h-8 w-8" />
                            Prescrizioni a Pena di Esclusione
                        </h2>
                        <div className="grid gap-4">
                            {data['11_pena_esclusione'].map((item, i) => (
                                <Card key={i} className="border-l-4 border-l-red-500 bg-red-50 hover:shadow-md transition-shadow">
                                    <CardContent className="pt-6">
                                        <div className="flex items-start gap-3">
                                            <AlertTriangle className="text-red-500 h-5 w-5 mt-1 flex-shrink-0" />
                                            <div>
                                                <p className="font-medium text-red-900">{item.descrizione}</p>
                                                <div className="mt-2 text-xs text-red-700 flex items-center gap-1"><Info className="h-3 w-3" /> Rif: {item.ref}</div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                );

            case '12_offerta_tecnica':
                return (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                            <FileCode className="h-8 w-8 text-blue-600" />
                            Offerta Tecnica
                        </h2>
                        <div className="grid gap-6 md:grid-cols-2">
                            <Card className="md:col-span-2 border-l-4 border-l-blue-500">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <FileText className="h-5 w-5 text-blue-600" />
                                        Documenti e Allegati Richiesti
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ul className="space-y-3">
                                        {data['12_offerta_tecnica'].documenti.map((doc, i) => (
                                            <li key={i} className="flex items-start gap-3 bg-slate-50 p-3 rounded-md">
                                                <CheckSquare className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                                                <span className="text-slate-700">{doc}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                            </Card>

                            <Card className="md:col-span-2">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Settings className="h-5 w-5 text-slate-600" />
                                        Modalità e Formattazione
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="prose prose-slate max-w-none text-slate-600">
                                        <p className="whitespace-pre-wrap">{data['12_offerta_tecnica'].formattazione_modalita}</p>
                                    </div>
                                    <Badge variant="outline" className="mt-4 bg-slate-50">{data['12_offerta_tecnica'].ref}</Badge>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                );

            case '13_offerta_economica':
                return (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                            <Banknote className="h-8 w-8 text-green-600" />
                            Offerta Economica
                        </h2>
                        <div className="grid gap-6 md:grid-cols-2">
                            <Card className="md:col-span-2 border-l-4 border-l-green-500">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <DollarSign className="h-5 w-5 text-green-600" />
                                        Documenti e Allegati Richiesti
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ul className="space-y-3">
                                        {data['13_offerta_economica'].documenti.map((doc, i) => (
                                            <li key={i} className="flex items-start gap-3 bg-slate-50 p-3 rounded-md">
                                                <CheckSquare className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                                                <span className="text-slate-700">{doc}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                            </Card>

                            <Card className="md:col-span-2">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Settings className="h-5 w-5 text-slate-600" />
                                        Modalità e Formattazione
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="prose prose-slate max-w-none text-slate-600">
                                        <p className="whitespace-pre-wrap">{data['13_offerta_economica'].formattazione_modalita}</p>
                                    </div>
                                    <Badge variant="outline" className="mt-4 bg-slate-50">{data['13_offerta_economica'].ref}</Badge>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                );

            case '14_note_importanti':
                return (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                            <Lightbulb className="h-8 w-8 text-yellow-500" />
                            Note Importanti AI
                        </h2>
                        <div className="space-y-4">
                            {data['14_note_importanti'].map((note, i) => (
                                <div key={i} className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded shadow-sm">
                                    <div className="flex items-start gap-3">
                                        <Info className="text-yellow-600 mt-1 flex-shrink-0" />
                                        <div>
                                            <p className="text-yellow-900 font-medium">{note.nota}</p>
                                            <p className="text-xs text-yellow-700 mt-1">Rif: {note.ref}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );

            case '15_remunerazione':
                return (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                            <CreditCard className="h-8 w-8 text-indigo-600" />
                            Remunerazione
                        </h2>
                        <Card>
                            <CardContent className="pt-6 grid gap-4">
                                <div className="flex items-start gap-2">
                                    <Settings className="h-5 w-5 text-indigo-500 mt-0.5" />
                                    <div><strong>Modalità:</strong> {data['15_remunerazione'].modalita}</div>
                                </div>
                                <div className="flex items-start gap-2">
                                    <DollarSign className="h-5 w-5 text-indigo-500 mt-0.5" />
                                    <div><strong>Pagamenti:</strong> {data['15_remunerazione'].pagamenti}</div>
                                </div>
                                <div className="flex items-start gap-2">
                                    <FileText className="h-5 w-5 text-indigo-500 mt-0.5" />
                                    <div><strong>Clausole:</strong> {data['15_remunerazione'].clausole}</div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                );

            case '16_sla_penali':
                return (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                            <Activity className="h-8 w-8 text-rose-600" />
                            SLA e Penali
                        </h2>
                        <Card>
                            <CardHeader><CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5 text-rose-500" /> Service Level Agreements</CardTitle></CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow><TableHead>Indicatore</TableHead><TableHead>Soglia</TableHead></TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {data['16_sla_penali'].sla.map((s, i) => (
                                            <TableRow key={i}>
                                                <TableCell>{s.indicatore}</TableCell>
                                                <TableCell>{s.soglia}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader><CardTitle className="flex items-center gap-2"><Gavel className="h-5 w-5 text-rose-500" /> Penali</CardTitle></CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow><TableHead>Descrizione</TableHead><TableHead>Calcolo</TableHead><TableHead>SLA Associato</TableHead></TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {data['16_sla_penali'].penali.map((p, i) => (
                                            <TableRow key={i}>
                                                <TableCell>{p.descrizione}</TableCell>
                                                <TableCell>{p.calcolo}</TableCell>
                                                <TableCell>{p.sla_associato}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                                <div className="mt-4 p-3 bg-slate-100 rounded text-sm flex items-start gap-2">
                                    <Info className="h-4 w-4 text-slate-500 mt-0.5" />
                                    <div><strong>Clausole Cumulative:</strong> {data['16_sla_penali'].clausole_cumulative}</div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
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
