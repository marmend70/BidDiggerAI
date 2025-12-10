import React from 'react';
import { X, Check } from 'lucide-react';
import { LEMON_SQUEEZY_URLS } from '../constants';

interface PricingModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string | undefined;
}

export const PricingModal: React.FC<PricingModalProps> = ({ isOpen, onClose, userId }) => {
    if (!isOpen) return null;

    const handleBuy = (url: string) => {
        if (!userId) {
            alert("Devi effettuare il login per acquistare.");
            return;
        }

        // Check if URL is placeholder
        if (url.includes("INSERT_")) {
            alert("Configurazione mancante: URL del checkout non valido.");
            return;
        }

        // Append user_id to checkout URL for webhook tracking
        const separator = url.includes('?') ? '&' : '?';
        const checkoutUrl = `${url}${separator}checkout[custom][user_id]=${userId}`;
        window.open(checkoutUrl, '_blank');
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b border-slate-100">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">Ricarica Crediti</h2>
                        <p className="text-sm text-slate-500">Un credito = Un'analisi completa</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>

                <div className="p-8 grid md:grid-cols-3 gap-6">
                    {/* Starter */}
                    <div className="border border-slate-200 rounded-lg p-6 hover:shadow-lg transition-shadow bg-slate-50 flex flex-col">
                        <h3 className="text-lg font-bold text-slate-800 mb-2">Starter</h3>
                        <div className="text-3xl font-bold text-indigo-600 mb-4">5 Crediti</div>
                        <div className="flex-grow">
                            <ul className="space-y-3 mb-8 text-sm text-slate-600">
                                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Fino a 3 documenti/gara</li>
                                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Analisi completa (tutti i lotti)</li>
                                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> 10 Deep Dive inclusi</li>
                            </ul>
                        </div>
                        <button
                            onClick={() => handleBuy(LEMON_SQUEEZY_URLS.STARTER)}
                            className="w-full py-2 px-4 bg-white border-2 border-indigo-600 text-indigo-600 font-semibold rounded-lg hover:bg-indigo-50 transition-colors"
                        >
                            Acquista Starter
                        </button>
                    </div>

                    {/* Pro */}
                    <div className="border-2 border-indigo-600 rounded-lg p-6 shadow-md relative bg-white transform md:-translate-y-2 flex flex-col">
                        <div className="absolute top-0 right-0 bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-sm">POPOLARE</div>
                        <h3 className="text-lg font-bold text-slate-800 mb-2">Pro</h3>
                        <div className="text-3xl font-bold text-indigo-600 mb-4">10 Crediti</div>
                        <div className="flex-grow">
                            <ul className="space-y-3 mb-8 text-sm text-slate-600">
                                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Tutti i vantaggi Starter</li>
                                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Supporto Prioritario</li>
                                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Ideale per professionisti</li>
                            </ul>
                        </div>
                        <button
                            onClick={() => handleBuy(LEMON_SQUEEZY_URLS.PRO)}
                            className="w-full py-2 px-4 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors shadow-lg"
                        >
                            Acquista Pro
                        </button>
                    </div>

                    {/* Agency */}
                    <div className="border border-slate-200 rounded-lg p-6 hover:shadow-lg transition-shadow bg-slate-50 flex flex-col">
                        <h3 className="text-lg font-bold text-slate-800 mb-2">Agency</h3>
                        <div className="text-3xl font-bold text-indigo-600 mb-4">20 Crediti</div>
                        <div className="flex-grow">
                            <ul className="space-y-3 mb-8 text-sm text-slate-600">
                                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Max valore per credito</li>
                                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Per team e aziende</li>
                                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Archivio illimitato</li>
                            </ul>
                        </div>
                        <button
                            onClick={() => handleBuy(LEMON_SQUEEZY_URLS.AGENCY)}
                            className="w-full py-2 px-4 bg-white border-2 border-indigo-600 text-indigo-600 font-semibold rounded-lg hover:bg-indigo-50 transition-colors"
                        >
                            Acquista Agency
                        </button>
                    </div>
                </div>
                <div className="p-6 text-center text-sm text-slate-500 border-t border-slate-100 bg-slate-50 rounded-b-xl">
                    Acquisto sicuro (SSL). I crediti vengono aggiunti immediatamente al tuo account.
                </div>
            </div>
        </div>
    );
};
