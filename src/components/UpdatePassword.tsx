import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle, Lock, Eye, EyeOff } from 'lucide-react';

export function UpdatePassword() {
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.updateUser({
                password: password
            });

            if (error) throw error;
            setSuccess(true);

            // Optional: Redirect after delay
            setTimeout(() => {
                window.location.hash = ''; // Clear hash to return to main app view
                window.location.reload();
            }, 3000);

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <Card className="w-full max-w-md shadow-xl">
                <CardHeader>
                    <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                        <Lock className="h-6 w-6 text-blue-600" />
                    </div>
                    <CardTitle className="text-center text-xl">Imposta Nuova Password</CardTitle>
                    <CardDescription className="text-center">
                        Inserisci la tua nuova password per accedere a Bid Digger.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {success ? (
                        <div className="text-center space-y-4 py-4">
                            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                                <CheckCircle className="h-8 w-8 text-green-600" />
                            </div>
                            <h3 className="text-lg font-medium text-green-800">Password Aggiornata!</h3>
                            <p className="text-slate-600">
                                La tua password è stata modificata con successo. <br />
                                Verrai reindirizzato alla dashboard...
                            </p>
                        </div>
                    ) : (
                        <form onSubmit={handleUpdatePassword} className="space-y-4">
                            <div className="space-y-2 relative">
                                <Input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Nuova Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    minLength={6}
                                    className="bg-white pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </button>
                            </div>
                            {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-md border border-red-100">{error}</div>}
                            <Button type="submit" className="w-full bg-slate-900 hover:bg-slate-800" disabled={loading}>
                                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Aggiorna Password'}
                            </Button>
                        </form>
                    )}
                </CardContent>
            </Card>

            <Card className="w-full max-w-md shadow-xl mt-8 border-red-200 bg-red-50/50">
                <CardHeader>
                    <CardTitle className="text-red-700 text-lg">Zona Pericolo</CardTitle>
                    <CardDescription className="text-red-600/80">
                        Azioni irreversibili per il tuo account.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <DeleteAccountButton />
                </CardContent>
            </Card>
        </div>
    );
}

function DeleteAccountButton() {
    const [isOpen, setIsOpen] = useState(false);
    const [confirmText, setConfirmText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        if (confirmText !== 'ELIMINA') return;
        setIsDeleting(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const { error } = await supabase.functions.invoke('delete-account', {
                headers: {
                    Authorization: `Bearer ${session.access_token}`
                }
            });

            if (error) throw error;

            // Force cleanup and redirect
            await supabase.auth.signOut();
            window.location.href = '/';

        } catch (err: any) {
            alert(`Errore eliminazione account: ${err.message || 'Riprova più tardi'}`);
            setIsDeleting(false);
        }
    };

    return (
        <>
            <Button
                variant="destructive"
                className="w-full bg-red-600 hover:bg-red-700"
                onClick={() => setIsOpen(true)}
            >
                Elimina Account
            </Button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-lg shadow-2xl max-w-sm w-full p-6 animate-in zoom-in-95 duration-200">
                        <h3 className="text-lg font-bold text-slate-900 mb-2">Sei assolutamente sicuro?</h3>
                        <p className="text-sm text-slate-500 mb-4">
                            Questa azione è <strong>irreversibile</strong>. Cancellerà permanentemente il tuo account, i tuoi dati personali e tutte le analisi effettuate.
                        </p>

                        <label className="block text-xs font-semibold text-slate-700 mb-2">
                            Digita <span className="font-mono text-red-600">ELIMINA</span> per confermare
                        </label>
                        <Input
                            value={confirmText}
                            onChange={(e) => setConfirmText(e.target.value)}
                            className="mb-4 text-center tracking-widest font-bold"
                            placeholder="ELIMINA"
                        />

                        <div className="flex flex-col gap-2">
                            <Button
                                variant="destructive"
                                disabled={confirmText !== 'ELIMINA' || isDeleting}
                                onClick={handleDelete}
                                className="w-full"
                            >
                                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Conferma Eliminazione'}
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => { setIsOpen(false); setConfirmText(''); }}
                                disabled={isDeleting}
                                className="w-full"
                            >
                                Annulla
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
