
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Loader2, ArrowLeft, ShieldAlert, ToggleLeft, ToggleRight, Lock } from 'lucide-react';

export function AdminPage() {
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [registrationActive, setRegistrationActive] = useState<boolean | null>(null);
    const [updating, setUpdating] = useState(false);
    const [accessError, setAccessError] = useState<string | null>(null);

    useEffect(() => {
        checkAdminStatus();
    }, []);

    const checkAdminStatus = async () => {
        setLoading(true);
        setAccessError(null);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                setAccessError("Utente non autenticato. Effettua il login.");
                return;
            }

            // Recuperiamo il ruolo di sistema 'app_role'
            const { data: profile, error } = await supabase
                .from('profiles')
                .select('app_role')
                .eq('id', session.user.id)
                .single();

            if (error) {
                console.error('Error fetching profile:', error);
                setAccessError(`Errore nel recupero del profilo: ${error.message}.`);
                return;
            }

            const userRole = profile?.app_role;

            // Se la colonna non arriva proprio, lo segnaliamo
            if (userRole === undefined) {
                setAccessError(`PROBLEMA CACHE SUPABASE: La colonna 'app_role' non è visibile. 
                1. Vai su Supabase > Settings > API 
                2. Clicca 'Reload Schema Cache'
                3. Ricarica questa pagina.`);
                return;
            }

            if (userRole !== 'admin') {
                setAccessError(`Accesso Negato. Il tuo ruolo di sistema è: '${userRole || 'nessuno'}'. Richiesto: 'admin'.`);
                return;
            }

            // If we get here, user is admin
            setIsAdmin(true);
            await fetchSettings();
        } catch (error: any) {
            console.error('Error checking admin status:', error);
            setAccessError(`Errore imprevisto: ${error.message || JSON.stringify(error)}`);
        } finally {
            setLoading(false);
        }
    };

    const fetchSettings = async () => {
        try {
            const { data, error } = await supabase
                .from('app_settings')
                .select('value')
                .eq('key', 'registrazione_attiva')
                .single();

            if (data) {
                setRegistrationActive(data.value);
            } else {
                // Se non esiste la riga, assumiamo true come default
                setRegistrationActive(true);
                // Opzionale: Prova a crearla se manca (potrebbe fallire se non admin)
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
            // Non blocchiamo tutto per questo, ma logghiamo
        }
    };

    const toggleRegistration = async () => {
        if (registrationActive === null) return;
        setUpdating(true);
        const newValue = !registrationActive;

        try {
            const { error } = await supabase
                .from('app_settings')
                .upsert({ key: 'registrazione_attiva', value: newValue });

            if (error) throw error;
            setRegistrationActive(newValue);
        } catch (error: any) {
            console.error('Error updating settings:', error);
            alert(`Errore salvataggio: ${error.message}. Verifica i permessi SQL.`);
        } finally {
            setUpdating(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-slate-50">
                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
        );
    }

    // Se c'è errore di accesso o non è admin
    if (accessError || !isAdmin) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-slate-100 p-4">
                <Card className="max-w-md w-full">
                    <CardHeader className="text-center">
                        <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                            <Lock className="h-6 w-6 text-red-600" />
                        </div>
                        <CardTitle className="text-slate-900">Accesso Non Autorizzato</CardTitle>
                        <CardDescription>Non hai i permessi necessari per visualizzare questa pagina.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {accessError && (
                            <div className="p-3 bg-red-50 text-red-700 text-sm rounded border border-red-200 font-mono break-all">
                                {accessError}
                            </div>
                        )}
                        <Button className="w-full" onClick={() => window.location.href = '/'}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Torna alla Home
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 p-8">
            <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" className="gap-2 text-slate-600 hover:text-slate-900" onClick={() => window.location.href = '/'}>
                        <ArrowLeft className="h-4 w-4" />
                        Torna alla Home
                    </Button>
                    <h1 className="text-3xl font-bold text-slate-900">Pannello Amministrazione</h1>
                </div>

                <div className="grid gap-6">
                    <Card className="border-slate-200 shadow-sm">
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <ShieldAlert className="h-5 w-5 text-indigo-600" />
                                <CardTitle>Controllo Accessi & Private Beta</CardTitle>
                            </div>
                            <CardDescription>
                                Determina se nuovi utenti possono registrarsi liberamente o se vedranno il messaggio di "Private Beta".
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white rounded-lg border border-slate-200 shadow-sm gap-4">
                                <div className="space-y-1">
                                    <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                                        Stato Registrazioni
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${registrationActive ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                            {registrationActive ? 'ATTIVO' : 'PRIVATE BETA'}
                                        </span>
                                    </h3>
                                    <p className="text-sm text-slate-500 max-w-lg">
                                        {registrationActive
                                            ? "Il form di registrazione è visibile a tutti. Gli utenti possono creare account autonomamente."
                                            : "Il form è nascosto. Gli utenti vedono un avviso che il sistema è in test ristretto."}
                                    </p>
                                </div>

                                <Button
                                    onClick={toggleRegistration}
                                    disabled={updating}
                                    className={`w-full sm:w-auto min-w-[140px] transition-all duration-300 ${registrationActive
                                        ? "bg-green-600 hover:bg-green-700 text-white shadow-green-200 shadow-lg"
                                        : "bg-slate-800 hover:bg-slate-900 text-white shadow-slate-200 shadow-lg"
                                        }`}
                                >
                                    {updating ? (
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    ) : (
                                        registrationActive ? <ToggleRight className="h-5 w-5 mr-2" /> : <ToggleLeft className="h-5 w-5 mr-2" />
                                    )}
                                    {registrationActive ? "Disattiva" : "Attiva"}
                                </Button>
                            </div>

                            {/* Visual Feedback of what users see */}
                            <div className="mt-4 p-4 rounded-lg bg-slate-50 border border-slate-200">
                                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                                    Anteprima per l'utente
                                </h4>
                                <div className="text-sm text-slate-600 italic">
                                    {registrationActive
                                        ? "✅ Gli utenti vedono i campi: Email, Password, Ruolo..."
                                        : "🚫 Gli utenti vedono: \"Il sistema è attualmente in fase di Private Beta...\""}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
