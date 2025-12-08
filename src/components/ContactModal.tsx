
import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { X, Mail, CheckCircle2, Loader2, Send } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';

// Actually, I didn't see label.tsx in the list, so I'll use standard HTML <label> with Tailwind classes.

interface ContactModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function ContactModal({ isOpen, onClose }: ContactModalProps) {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        message: ''
    });
    const [status, setStatus] = useState<'IDLE' | 'SENDING' | 'SUCCESS'>('IDLE');

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Basic validation
        if (!formData.firstName || !formData.lastName || !formData.email || !formData.message) {
            return; // Browser should handle 'required' attribute, but just in case
        }

        setStatus('SENDING');

        try {
            const { error } = await supabase.functions.invoke('send-email', {
                body: {
                    type: 'CONTACT',
                    payload: formData
                }
            });

            if (error) {
                console.error("Function error:", error);
                throw new Error("Errore durante l'invio");
            }

            setStatus('SUCCESS');
        } catch (error) {
            console.error("Error sending message:", error);
            alert("Si è verificato un errore durante l'invio del messaggio. Assicurati che il servizio sia attivo.");
            setStatus('IDLE');
        }
    };

    const handleClose = () => {
        setStatus('IDLE');
        setFormData({ firstName: '', lastName: '', email: '', message: '' });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50">
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <Mail className="h-5 w-5 text-slate-500" />
                        Contatti
                    </h2>
                    <button
                        onClick={handleClose}
                        className="text-slate-400 hover:text-slate-600 transition-colors p-1 hover:bg-slate-200 rounded-full"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {status === 'SUCCESS' ? (
                        <div className="flex flex-col items-center justify-center text-center py-8 space-y-4">
                            <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
                                <CheckCircle2 className="h-8 w-8 text-green-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-slate-900">Richiesta Inviata!</h3>
                                <p className="text-slate-500 mt-2 max-w-xs mx-auto">
                                    Grazie <strong>{formData.firstName}</strong>. La tua richiesta di informazioni è stata inviata a <span className="text-slate-700 font-medium">mm.infoapps@gmail.com</span>.
                                </p>
                            </div>
                            <Button onClick={handleClose} className="mt-4 min-w-[120px]">
                                Chiudi
                            </Button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label htmlFor="firstName" className="text-sm font-medium text-slate-700">
                                            Nome <span className="text-red-500">*</span>
                                        </label>
                                        <Input
                                            id="firstName"
                                            placeholder="Mario"
                                            value={formData.firstName}
                                            onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                                            required
                                            disabled={status === 'SENDING'}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="lastName" className="text-sm font-medium text-slate-700">
                                            Cognome <span className="text-red-500">*</span>
                                        </label>
                                        <Input
                                            id="lastName"
                                            placeholder="Rossi"
                                            value={formData.lastName}
                                            onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                                            required
                                            disabled={status === 'SENDING'}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="email" className="text-sm font-medium text-slate-700">
                                        Indirizzo mail <span className="text-red-500">*</span>
                                    </label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="mario.rossi@example.com"
                                        value={formData.email}
                                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                        required
                                        disabled={status === 'SENDING'}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="message" className="text-sm font-medium text-slate-700">
                                        Richiesta <span className="text-red-500">*</span>
                                    </label>
                                    <Textarea
                                        id="message"
                                        placeholder="Scrivi qui la tua richiesta..."
                                        value={formData.message}
                                        onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                                        required
                                        disabled={status === 'SENDING'}
                                        className="resize-none min-h-[100px]"
                                    />
                                </div>
                            </div>

                            <div className="pt-4">
                                <Button
                                    type="submit"
                                    className="w-full bg-slate-900 hover:bg-slate-800 text-white"
                                    disabled={status === 'SENDING'}
                                >
                                    {status === 'SENDING' ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Invio in corso...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="mr-2 h-4 w-4" />
                                            Invia Richiesta
                                        </>
                                    )}
                                </Button>
                                <p className="text-xs text-slate-400 text-center mt-3">
                                    Compilando questo form accetti di essere contattato per fornire le informazioni richieste.
                                </p>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
