import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle, Lock } from 'lucide-react';

export function UpdatePassword() {
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

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
                            <div className="space-y-2">
                                <Input
                                    type="password"
                                    placeholder="Nuova Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    minLength={6}
                                    className="bg-white"
                                />
                            </div>
                            {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-md border border-red-100">{error}</div>}
                            <Button type="submit" className="w-full bg-slate-900 hover:bg-slate-800" disabled={loading}>
                                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Aggiorna Password'}
                            </Button>
                        </form>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
