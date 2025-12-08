import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, UploadCloud, Sliders, FileText, MessageSquare, AlertTriangle, Sparkles } from 'lucide-react';
import { TERMS_AND_CONDITIONS, PRIVACY_POLICY } from '@/constants/legalText';
import { LegalModal } from './LegalModal';

export function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [role, setRole] = useState('');
    const [sector, setSector] = useState('');
    const [tenderVolume, setTenderVolume] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [showConfirmation, setShowConfirmation] = useState(false);

    // Consents State
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [acceptedPublicNature, setAcceptedPublicNature] = useState(false);
    const [acceptedAiLimits, setAcceptedAiLimits] = useState(false);

    // Modal State
    const [modalOpen, setModalOpen] = useState<'APP_TERMS' | 'PRIVACY' | null>(null);

    const isConsentsValid = acceptedTerms && acceptedPublicNature && acceptedAiLimits;

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (error) throw error;
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (!isConsentsValid) {
                throw new Error("Devi accettare tutti i termini e le condizioni per procedere.");
            }

            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo: window.location.origin,
                    data: {
                        accepted_terms: acceptedTerms,
                        accepted_public_nature: acceptedPublicNature,
                        accepted_ai_limits: acceptedAiLimits,
                        consents_timestamp: new Date().toISOString(),
                        role,
                        sector,
                        tender_volume: tenderVolume
                    }
                },
            });
            if (error) throw error;
            setShowConfirmation(true);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };



    return (
        <div className="min-h-screen w-full flex">
            {/* Left Side - Branding & Intro */}
            <div className="hidden lg:flex w-1/2 bg-slate-900 relative overflow-hidden flex-col justify-between p-12 text-white">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-10"></div>
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-900/95 to-blue-900/90"></div>

                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-12">
                        <img src="/logo.png" alt="Bid Digger Logo" className="h-12 w-12 object-contain" />
                        <span className="text-3xl font-bold tracking-tight">Bid Digger AI</span>
                    </div>

                    <h1 className="text-5xl font-extrabold leading-tight mb-10">
                        L'essenziale della gara, <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">
                            a colpo d'occhio.
                        </span>
                    </h1>

                    <div className="space-y-8 mt-4">
                        <div className="flex gap-5 items-start">
                            <div className="h-12 w-12 rounded-xl bg-slate-800/80 flex items-center justify-center border border-slate-700 flex-shrink-0 shadow-lg backdrop-blur-sm">
                                <UploadCloud className="h-6 w-6 text-amber-500" />
                            </div>
                            <div>
                                <h3 className="font-bold text-xl text-white mb-1">Carica i documenti</h3>
                                <p className="text-slate-300 text-base leading-relaxed">Trascina i PDF del bando, del disciplinare e del capitolato direttamente nell'area di upload.</p>
                            </div>
                        </div>

                        <div className="flex gap-5 items-start">
                            <div className="h-12 w-12 rounded-xl bg-slate-800/80 flex items-center justify-center border border-slate-700 flex-shrink-0 shadow-lg backdrop-blur-sm">
                                <Sliders className="h-6 w-6 text-blue-400" />
                            </div>
                            <div>
                                <h3 className="font-bold text-xl text-white mb-1">Seleziona i parametri</h3>
                                <p className="text-slate-300 text-base leading-relaxed">Scegli quali informazioni estrarre: requisiti tecnici, scadenze, costi o vincoli amministrativi.</p>
                            </div>
                        </div>

                        <div className="flex gap-5 items-start">
                            <div className="h-12 w-12 rounded-xl bg-slate-800/80 flex items-center justify-center border border-slate-700 flex-shrink-0 shadow-lg backdrop-blur-sm">
                                <FileText className="h-6 w-6 text-emerald-400" />
                            </div>
                            <div>
                                <h3 className="font-bold text-xl text-white mb-1">Ottieni la sintesi</h3>
                                <p className="text-slate-300 text-base leading-relaxed">Consulta la dashboard con i dati chiave strutturati ed esporta il report decisionale.</p>
                            </div>
                        </div>

                        <div className="flex gap-5 items-start">
                            <div className="h-12 w-12 rounded-xl bg-slate-800/80 flex items-center justify-center border border-slate-700 flex-shrink-0 shadow-lg backdrop-blur-sm">
                                <MessageSquare className="h-6 w-6 text-purple-400" />
                            </div>
                            <div>
                                <h3 className="font-bold text-xl text-white mb-1">Interroga i documenti</h3>
                                <p className="text-slate-300 text-base leading-relaxed">Hai bisogno di più dettagli? Aggiungi domande specifiche all'AI e approfondisci qualsiasi punto del bando.</p>
                            </div>
                        </div>

                        <div className="flex gap-5 items-start">
                            <div className="h-12 w-12 rounded-xl bg-slate-800/80 flex items-center justify-center border border-slate-700 flex-shrink-0 shadow-lg backdrop-blur-sm">
                                <Sparkles className="h-6 w-6 text-yellow-400" />
                            </div>
                            <div>
                                <h3 className="font-bold text-xl text-white mb-1">Prova Gratuita</h3>
                                <p className="text-slate-300 text-base leading-relaxed">
                                    Registrazione libera con <strong>2 Analisi Complete</strong> in omaggio. <br />
                                    Nessuna carta di credito richiesta per iniziare.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="relative z-10 text-sm text-slate-400 mt-12">
                    © 2025 Bid Digger AI. All rights reserved.
                </div>
            </div>

            {/* Right Side - Auth Form */}
            <div className="w-full lg:w-1/2 bg-slate-50 flex items-center justify-center p-8">
                <Card className="w-full max-w-md border-none shadow-xl bg-white/80 backdrop-blur-sm">
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-2xl font-bold text-center text-slate-900">Benvenuto</CardTitle>
                        <CardDescription className="text-center">
                            Accedi alla tua dashboard per gestire le gare
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {showConfirmation ? (
                            <div className="text-center space-y-6 py-4">
                                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                                    <MessageSquare className="h-8 w-8 text-green-600" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-xl font-semibold text-slate-900">Controlla la tua email</h3>
                                    <p className="text-slate-600">
                                        Abbiamo inviato un link di conferma a <strong>{email}</strong>.
                                        Clicca sul link per attivare il tuo account e accedere.
                                    </p>
                                </div>
                                <Button
                                    variant="outline"
                                    className="w-full"
                                    onClick={() => {
                                        setShowConfirmation(false);
                                        setEmail('');
                                        setPassword('');
                                    }}
                                >
                                    Torna al Login
                                </Button>
                            </div>
                        ) : (
                            <>
                                <Tabs defaultValue="login" className="w-full">
                                    <TabsList className="grid w-full grid-cols-2 mb-8">
                                        <TabsTrigger value="login">Accedi</TabsTrigger>
                                        <TabsTrigger value="register">Registrati</TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="login">
                                        <form onSubmit={handleLogin} className="space-y-4">
                                            <div className="space-y-2">
                                                <Input
                                                    type="email"
                                                    placeholder="nome@azienda.com"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    required
                                                    className="bg-white"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Input
                                                    type="password"
                                                    placeholder="Password"
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                    required
                                                    className="bg-white"
                                                />
                                            </div>
                                            {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-md border border-red-100">{error}</div>}
                                            <Button type="submit" className="w-full bg-slate-900 hover:bg-slate-800" disabled={loading}>
                                                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Accedi'}
                                            </Button>
                                        </form>
                                    </TabsContent>

                                    <TabsContent value="register">
                                        <form onSubmit={handleSignUp} className="space-y-4">
                                            {/* Trial Info Banner */}
                                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-3 mb-4">
                                                <Sparkles className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                                                <div className="text-sm text-amber-900">
                                                    <span className="font-semibold block text-amber-950">Prova Gratuita Attiva</span>
                                                    Registrati ora per ottenere <strong>2 Analisi Complete</strong> in omaggio. Nessun pagamento richiesto.
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Input
                                                    type="email"
                                                    placeholder="nome@azienda.com"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    required
                                                    className="bg-white"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Input
                                                    type="password"
                                                    placeholder="Crea una password"
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                    required
                                                    className="bg-white"
                                                />
                                            </div>

                                            <div className="space-y-4 pt-2">
                                                <div className="space-y-2">
                                                    <select
                                                        value={role}
                                                        onChange={(e) => setRole(e.target.value)}
                                                        className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-slate-600"
                                                    >
                                                        <option value="">Seleziona Ruolo / Funzione (Opzionale)</option>
                                                        <option value="Bid / Proposal Manager">Bid / Proposal Manager</option>
                                                        <option value="Responsabile Ufficio Gare">Responsabile Ufficio Gare</option>
                                                        <option value="Imprenditore / CEO">Imprenditore / CEO</option>
                                                        <option value="Area Commerciale / Sales">Area Commerciale / Sales</option>
                                                        <option value="Tecnico / Progettista">Tecnico / Progettista</option>
                                                        <option value="Consulente Gare / Libero Professionista">Consulente Gare / Libero Professionista</option>
                                                        <option value="Addetto Ufficio Gare">Addetto Ufficio Gare</option>
                                                        <option value="Avvocato / Legal">Avvocato / Legal</option>
                                                        <option value="Altro">Altro</option>
                                                    </select>
                                                </div>

                                                <div className="space-y-2">
                                                    <select
                                                        value={sector}
                                                        onChange={(e) => setSector(e.target.value)}
                                                        className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-slate-600"
                                                    >
                                                        <option value="">Settore / Ambito Principale (Opzionale)</option>
                                                        <option value="ICT & Software">ICT & Software (Servizi Digitali)</option>
                                                        <option value="Facility Management">Facility Management (Pulizie, Vigilanza, Manutenzione)</option>
                                                        <option value="Sanità">Servizi attinenti alla Sanità</option>
                                                        <option value="Socio-Sanitario">Servizi Socio-Sanitari e Assistenza</option>
                                                        <option value="Consulenza e formazione">Consulenza e formazione</option>
                                                        <option value="Altro">Altra tipologia di servizi</option>
                                                    </select>
                                                </div>

                                                <div className="space-y-2">
                                                    <select
                                                        value={tenderVolume}
                                                        onChange={(e) => setTenderVolume(e.target.value)}
                                                        className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-slate-600"
                                                    >
                                                        <option value="">Volume Annuo Gare gestite (Opzionale)</option>
                                                        <option value="Meno di 10 all'anno">Meno di 10 all'anno</option>
                                                        <option value="1-2 al mese">1-2 al mese</option>
                                                        <option value="3-10 al mese">3-10 al mese</option>
                                                        <option value="Oltre 10 al mese">Oltre 10 al mese</option>
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="space-y-4 mt-6">
                                                <div className="flex items-start space-x-3">
                                                    <Checkbox
                                                        id="terms"
                                                        checked={acceptedTerms}
                                                        onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
                                                    />
                                                    <div className="grid gap-1.5 leading-none">
                                                        <label
                                                            htmlFor="terms"
                                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-slate-700"
                                                        >
                                                            Termini di Servizio
                                                        </label>
                                                        <p className="text-sm text-slate-500 text-muted-foreground">
                                                            Ho letto, compreso e accetto integralmente i <button type="button" onClick={() => setModalOpen('APP_TERMS')} className="text-blue-600 hover:underline">Termini e Condizioni del Servizio</button> e la <button type="button" onClick={() => setModalOpen('PRIVACY')} className="text-blue-600 hover:underline">Privacy Policy</button>.
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex items-start space-x-3">
                                                    <Checkbox
                                                        id="public_nature"
                                                        checked={acceptedPublicNature}
                                                        onCheckedChange={(checked) => setAcceptedPublicNature(checked as boolean)}
                                                    />
                                                    <div className="grid gap-1.5 leading-none">
                                                        <label
                                                            htmlFor="public_nature"
                                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-slate-700"
                                                        >
                                                            Natura Pubblica dei Documenti
                                                        </label>
                                                        <p className="text-sm text-slate-500 text-muted-foreground">
                                                            Dichiaro sotto la mia esclusiva responsabilità di caricare sulla piattaforma esclusivamente documenti di natura pubblica (es. Bandi, Disciplinari, Capitolati di dominio pubblico). Confermo che i file non contengono dati personali sensibili, informazioni riservate o segreti industriali, manlevando Bid Digger AI da ogni responsabilità civile e penale in materia di trattamento dati.
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex items-start space-x-3">
                                                    <Checkbox
                                                        id="ai_limits"
                                                        checked={acceptedAiLimits}
                                                        onCheckedChange={(checked) => setAcceptedAiLimits(checked as boolean)}
                                                    />
                                                    <div className="grid gap-1.5 leading-none">
                                                        <label
                                                            htmlFor="ai_limits"
                                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-slate-700"
                                                        >
                                                            Limiti dell'AI
                                                        </label>
                                                        <p className="text-sm text-slate-500 text-muted-foreground">
                                                            Sono consapevole e accetto che il servizio è basato su sistemi di Intelligenza Artificiale sperimentali. Comprendo che le analisi generate possono contenere errori, omissioni o imprecisioni ('allucinazioni') e mi impegno a verificare personalmente la correttezza di ogni dato sui documenti originali prima di qualsiasi utilizzo, esonerando il fornitore da ogni responsabilità per eventuali danni, esclusioni o mancati guadagni.
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-md border border-red-100">{error}</div>}
                                            <Button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-50" disabled={loading || !isConsentsValid}>
                                                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Crea Account'}
                                            </Button>
                                        </form>
                                    </TabsContent>
                                </Tabs>


                            </>
                        )}
                    </CardContent>
                    <CardFooter className="flex justify-center">
                        <p className="text-xs text-slate-400 text-center max-w-xs">
                            Continuando, accetti i nostri Termini di Servizio e la Privacy Policy.
                        </p>
                    </CardFooter>
                </Card>
            </div>

            <LegalModal
                isOpen={!!modalOpen}
                onClose={() => setModalOpen(null)}
                title={modalOpen === 'APP_TERMS' ? 'Termini e Condizioni' : 'Privacy Policy'}
                content={modalOpen === 'APP_TERMS' ? TERMS_AND_CONDITIONS : PRIVACY_POLICY}
            />
        </div>
    );
}
