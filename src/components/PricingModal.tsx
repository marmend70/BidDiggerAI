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
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between p-4 border-b border-slate-100">
                    <h2 className="text-lg font-bold text-slate-900">Ricarica Crediti</h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>

                <div className="p-8 flex flex-col items-center text-center">
                    <div className="h-16 w-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-6">
                        <Check className="w-8 h-8" />
                    </div>

                    <h3 className="text-xl font-bold text-slate-900 mb-2">Bid Digger è in Beta</h3>
                    <p className="text-slate-600 mb-6 leading-relaxed">
                        L'applicazione è ancora in fase di sviluppo attivo.
                        A breve sarà attivata la possibilità di acquistare nuovi crediti direttamente dalla piattaforma.
                    </p>

                    <button
                        onClick={onClose}
                        className="w-full py-2.5 px-4 bg-slate-900 text-white font-semibold rounded-lg hover:bg-slate-800 transition-colors shadow-lg"
                    >
                        Ho capito
                    </button>
                </div>
            </div>
        </div>
    );
};
