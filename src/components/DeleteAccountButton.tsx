import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';

export function DeleteAccountButton() {
    const [isOpen, setIsOpen] = useState(false);
    const [confirmText, setConfirmText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        if (confirmText !== 'ELIMINA') return;
        setIsDeleting(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const { error } = await supabase.functions.invoke('delete-account');

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
                className="w-full bg-red-600 hover:bg-red-700 text-white"
                onClick={() => setIsOpen(true)}
            >
                Elimina Account
            </Button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-lg shadow-2xl max-w-sm w-full p-6 animate-in zoom-in-95 duration-200 border border-red-200">
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
                            className="mb-4 text-center tracking-widest font-bold border-slate-300"
                            placeholder="ELIMINA"
                        />

                        <div className="flex flex-col gap-2">
                            <Button
                                variant="destructive"
                                disabled={confirmText !== 'ELIMINA' || isDeleting}
                                onClick={handleDelete}
                                className="w-full bg-red-600 hover:bg-red-700"
                            >
                                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Conferma Eliminazione'}
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => { setIsOpen(false); setConfirmText(''); }}
                                disabled={isDeleting}
                                className="w-full border-slate-300 text-slate-700 hover:bg-slate-100"
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
