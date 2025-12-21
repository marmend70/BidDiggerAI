
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Loader2, ArrowLeft, ShieldAlert, ToggleLeft, ToggleRight, Clock } from 'lucide-react';

export function AdminPage() {
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [registrationActive, setRegistrationActive] = useState<boolean | null>(null);
    const [updating, setUpdating] = useState(false);

    // Configure Timeout State
    const [timeoutSeconds, setTimeoutSeconds] = useState<number>(240);
    const [updatingTimeout, setUpdatingTimeout] = useState(false);

    useEffect(() => {
        checkAdminStatus();
    }, []);

    const checkAdminStatus = async () => {
        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                window.location.href = '/';
                return;
            }

            const { data: profile } = await supabase
                .from('profiles')
                .select('role, app_role')
                .eq('id', session.user.id)
                .single();

            // Check app_role first, then role
            const userRole = profile?.app_role || profile?.role;

            if (userRole?.toLowerCase() !== 'admin') {
                console.warn("User is not admin. Role:", userRole);
                window.location.href = '/'; // Redirect non-admins
                return;
            }

            setIsAdmin(true);
            fetchSettings();
        } catch (error) {
            console.error('Error checking admin status:', error);
            window.location.href = '/';
        } finally {
            setLoading(false);
        }
    };

    const fetchSettings = async () => {
        try {
            // Fetch Registration Setting
            const { data: regData, error: regError } = await supabase
                .from('app_settings')
                .select('value')
                .eq('key', 'registrazione_attiva')
                .single();

            if (regData) {
                setRegistrationActive(regData.value);
            } else {
                setRegistrationActive(true);
            }

            // Fetch Timeout Setting
            const { data: timeData, error: timeError } = await supabase
                .from('app_settings')
                .select('value')
                .eq('key', 'analysis_timeout_seconds')
                .single();

            if (timeData) {
                setTimeoutSeconds(Number(timeData.value));
            } else {
                setTimeoutSeconds(240); // Default
            }

        } catch (error) {
            console.error('Error fetching settings:', error);
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
            alert(`Errore aggiornamento: ${error.message || JSON.stringify(error)}`);
        } finally {
            setUpdating(false);
        }
    };

    const saveTimeoutSettings = async () => {
        setUpdatingTimeout(true);
        try {
            const { error } = await supabase
                .from('app_settings')
                .upsert({ key: 'analysis_timeout_seconds', value: timeoutSeconds });

            if (error) throw error;
            alert("Timeout aggiornato con successo!");
        } catch (error: any) {
            console.error('Error updating timeout:', error);
            alert(`Errore aggiornamento: ${error.message}`);
        } finally {
            setUpdatingTimeout(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-slate-50">
                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
        );
    }

    if (!isAdmin) return null; // Should have redirected

    return (
        <div className="min-h-screen bg-slate-50 p-8">
            <div className="max-w-4xl mx-auto space-y-8">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" className="gap-2" onClick={() => window.location.href = '/'}>
                        <ArrowLeft className="h-4 w-4" />
                        Torna alla Home
                    </Button>
                    <h1 className="text-3xl font-bold text-slate-900">Pannello Amministrazione</h1>
                </div>

                <div className="grid gap-6">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <ShieldAlert className="h-5 w-5 text-indigo-600" />
                                <CardTitle>Controllo Accessi</CardTitle>
                            </div>
                            <CardDescription>
                                Gestisci le impostazioni globali di accesso e registrazione alla piattaforma.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                                <div className="space-y-1">
                                    <h3 className="font-medium text-slate-900">Registrazione Nuovi Utenti</h3>
                                    <p className="text-sm text-slate-500">
                                        {registrationActive
                                            ? "Le registrazioni sono APERTE. Chiunque può creare un account."
                                            : "Le registrazioni sono CHIUSE. Viene mostrato il modale 'Beta Test'."}
                                    </p>
                                </div>
                                <Button
                                    onClick={toggleRegistration}
                                    disabled={updating}
                                    variant={registrationActive ? "default" : "secondary"}
                                    className={`w-32 gap-2 ${registrationActive ? "bg-green-600 hover:bg-green-700" : "bg-slate-200 text-slate-600 hover:bg-slate-300"}`}
                                >
                                    {updating ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <>
                                            {registrationActive ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                                            {registrationActive ? "ON" : "OFF"}
                                        </>
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-6">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Clock className="h-5 w-5 text-indigo-600" />
                                <CardTitle>Impostazioni Sistema</CardTitle>
                            </div>
                            <CardDescription>
                                Parametri tecnici globali del sistema.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Timeout Analisi (secondi)
                                </label>
                                <div className="flex gap-4 items-center">
                                    <input
                                        type="number"
                                        value={timeoutSeconds}
                                        onChange={(e) => setTimeoutSeconds(parseInt(e.target.value) || 0)}
                                        className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 max-w-[200px]"
                                    />
                                    <Button
                                        onClick={saveTimeoutSettings}
                                        disabled={updatingTimeout}
                                        className="bg-indigo-600 hover:bg-indigo-700"
                                    >
                                        {updatingTimeout ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                        Salva
                                    </Button>
                                </div>
                                <p className="text-xs text-slate-500 mt-2">
                                    Tempo di attesa prima che appaia il modale di "Analisi lenta" all'utente (default: 240s).
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
