import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle, Lock, User, X } from 'lucide-react';
import { DeleteAccountButton } from './DeleteAccountButton';

interface ProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    userEmail?: string;
}

export function ProfileModal({ isOpen, onClose, userEmail }: ProfileModalProps) {
    if (!isOpen) return null;

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
            setPassword('');
            setTimeout(() => setSuccess(false), 3000); // Reset success msg
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-[#1e1e2d] w-full max-w-lg rounded-xl shadow-2xl border border-slate-800 animate-in zoom-in-95 duration-200 relative overflow-hidden">

                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-amber-500/10 rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-amber-500" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-slate-200">Profilo Utente</h2>
                            <p className="text-xs text-slate-500">{userEmail}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <div className="p-6 space-y-8 max-h-[80vh] overflow-y-auto">

                    {/* Password Section */}
                    <div>
                        <h3 className="text-sm font-medium text-slate-300 mb-4 flex items-center gap-2">
                            <Lock className="h-4 w-4 text-blue-400" />
                            Modifica Password
                        </h3>

                        <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-800">
                            {success ? (
                                <div className="text-center py-2 flex flex-col items-center">
                                    <CheckCircle className="h-8 w-8 text-emerald-500 mb-2" />
                                    <p className="text-emerald-400 font-medium">Password aggiornata con successo!</p>
                                </div>
                            ) : (
                                <form onSubmit={handleUpdatePassword} className="space-y-3">
                                    <Input
                                        type="password"
                                        placeholder="Nuova Password (min. 6 caratteri)"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        minLength={6}
                                        className="bg-slate-800 border-slate-700 text-slate-200 focus:border-blue-500"
                                    />
                                    {error && <div className="text-xs text-red-400 bg-red-400/10 p-2 rounded">{error}</div>}
                                    <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading}>
                                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Aggiorna Password'}
                                    </Button>
                                </form>
                            )}
                        </div>
                    </div>

                    {/* Danger Zone */}
                    <div>
                        <h3 className="text-sm font-medium text-red-400 mb-4 flex items-center gap-2">
                            Zona Pericolo
                        </h3>
                        <div className="bg-red-950/20 p-4 rounded-lg border border-red-900/30">
                            <p className="text-xs text-slate-400 mb-4">
                                L'eliminazione dell'account è un'azione irreversibile. Perderai tutti i tuoi dati, analisi e accesso ai workspace.
                            </p>
                            <DeleteAccountButton />
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
