import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, UploadCloud, Sliders, FileText, MessageSquare } from 'lucide-react';

export function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

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
            const { error } = await supabase.auth.signUp({
                email,
                password,
            });
            if (error) throw error;
            alert('Account creato! Controlla la tua email per confermare la registrazione.');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
            });
            if (error) throw error;
        } catch (err: any) {
            setError(err.message);
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
                    </div>
                </div>

                <div className="relative z-10 text-sm text-slate-400 mt-12">
                    © 2024 Bid Digger AI. All rights reserved.
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
                                    {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-md border border-red-100">{error}</div>}
                                    <Button type="submit" className="w-full bg-slate-900 hover:bg-slate-800" disabled={loading}>
                                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Crea Account'}
                                    </Button>
                                </form>
                            </TabsContent>
                        </Tabs>

                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-slate-200" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-white px-2 text-slate-500">Oppure continua con</span>
                            </div>
                        </div>

                        <Button variant="outline" type="button" className="w-full" onClick={handleGoogleLogin}>
                            <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                                <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
                            </svg>
                            Google
                        </Button>
                    </CardContent>
                    <CardFooter className="flex justify-center">
                        <p className="text-xs text-slate-400 text-center max-w-xs">
                            Continuando, accetti i nostri Termini di Servizio e la Privacy Policy.
                        </p>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
