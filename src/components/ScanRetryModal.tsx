import React from 'react';
import { Eye, X, RefreshCw, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ScanRetryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

export function ScanRetryModal({ isOpen, onClose, onConfirm }: ScanRetryModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden relative animate-in zoom-in-95 duration-200 border border-slate-100">

                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-full transition-colors"
                >
                    <X className="h-5 w-5" />
                </button>

                <div className="p-8">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="h-14 w-14 bg-indigo-50 rounded-full flex items-center justify-center border border-indigo-100 flex-shrink-0">
                            <Eye className="h-7 w-7 text-indigo-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">Riprovare con Lettura Visiva?</h2>
                            <p className="text-slate-500 text-sm">Rilevata difficoltà di lettura del testo.</p>
                        </div>
                    </div>

                    <div className="space-y-4 text-slate-600 mb-8">
                        <div className="bg-amber-50 p-4 rounded-lg border border-amber-100 text-sm flex gap-3">
                            <FileText className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="font-semibold text-amber-800 mb-1">Problema Rilevato</p>
                                <p className="text-amber-700">
                                    Sembra che il documento sia una <strong>scansione</strong> (immagine).
                                    L'AI non è riuscita a estrarre il testo con il metodo rapido standard.
                                </p>
                            </div>
                        </div>

                        <p className="text-sm">
                            Puoi riprovare usando la <strong>Modalità Visiva Avanzata</strong>.
                            L'AI "guarderà" le pagine come un essere umano.
                        </p>

                        <p className="text-xs text-slate-500 italic">
                            Nota: Questa modalità è più lenta (richiede circa 10-15 secondi in più).
                        </p>
                    </div>

                    <div className="flex gap-3 justify-end">
                        <Button variant="outline" onClick={onClose} className="border-slate-200">
                            No, annulla
                        </Button>
                        <Button
                            onClick={onConfirm}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 pl-3 pr-4"
                        >
                            <RefreshCw className="h-4 w-4" />
                            Riprova in Modalità Visiva
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
