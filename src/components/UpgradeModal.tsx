import React from 'react';
import { Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface UpgradeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onOpenContact?: () => void;
}

export function UpgradeModal({ isOpen, onClose, onOpenContact }: UpgradeModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative animate-in zoom-in-95 duration-200 border border-slate-100">

                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-full transition-colors"
                >
                    <X className="h-5 w-5" />
                </button>

                <div className="p-8 text-center space-y-6">
                    <div className="h-20 w-20 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-amber-50">
                        <Sparkles className="h-10 w-10 text-amber-500" />
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-2xl font-bold text-slate-900">Hai raggiunto il limite</h2>
                        <p className="text-slate-600">
                            Il piano Trial include un massimo di <strong>2 Analisi Gratuite</strong>.
                        </p>
                    </div>

                    <div className="text-sm text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <p>
                            Se desideri lasciare un commento, una segnalazione, un suggerimento o fare una richiesta, puoi utilizzare il <button onClick={() => { onClose(); onOpenContact?.(); }} className="text-amber-600 hover:underline font-semibold">form di contatto cliccando qui</button>.
                        </p>
                    </div>

                    <div className="pt-2">
                        <Button className="w-full bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 text-white shadow-lg py-6 text-lg" disabled>
                            Abbonamenti disponibili a breve
                        </Button>
                        <p className="text-xs text-slate-400 mt-3">
                            Stiamo ultimando la piattaforma di pagamento. <br />Riprova tra qualche giorno!
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
