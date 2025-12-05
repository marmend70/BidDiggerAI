import React from 'react';
import { AlertTriangle, Clock, XCircle, PlayCircle } from 'lucide-react';

interface TimeoutModalProps {
    isOpen: boolean;
    onContinue: () => void;
    onTerminate: () => void;
}

export function TimeoutModal({ isOpen, onContinue, onTerminate }: TimeoutModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6 border border-slate-200 animate-in zoom-in-95 duration-200">
                <div className="flex flex-col items-center text-center">
                    <div className="h-12 w-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mb-4">
                        <Clock className="h-6 w-6" />
                    </div>

                    <h3 className="text-lg font-semibold text-slate-900 mb-2">
                        L'analisi sta richiedendo più tempo del previsto
                    </h3>

                    <p className="text-sm text-slate-600 mb-6">
                        A causa della mole di documenti caricati, l'elaborazione si sta prolungando oltre i 5 minuti.
                        Vuoi attendere ancora il completamento o terminare l'analisi recuperando i dati estratti finora?
                    </p>

                    <div className="flex gap-3 w-full">
                        <button
                            onClick={onTerminate}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 font-medium transition-colors"
                        >
                            <XCircle className="h-4 w-4" />
                            Termina
                        </button>
                        <button
                            onClick={onContinue}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-md hover:bg-amber-600 font-medium transition-colors shadow-sm"
                        >
                            <PlayCircle className="h-4 w-4" />
                            Prosegui
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
