
import React, { useState } from 'react';
import { X, BookOpen, HelpCircle, ChevronDown, ChevronUp, FileText, UploadCloud, Monitor, Archive, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface GuideModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function GuideModal({ isOpen, onClose }: GuideModalProps) {
    const [openFaq, setOpenFaq] = useState<number | null>(null);

    const toggleFaq = (index: number) => {
        setOpenFaq(openFaq === index ? null : index);
    };

    const faqs = [
        {
            question: "Cos'è la \"Genius Mode\"?",
            answer: "La Genius Mode è il nostro motore di analisi semantica avanzata. Oltre a estrarre dati \"freddi\" (date, importi), l'IA agisce come un consulente esperto (Bid Manager + Legale), identificando rischi occulti, clausole vessatorie, ambiguità tra i documenti e suggerimenti strategici per massimizzare il punteggio tecnico."
        },
        {
            question: "Quanto costa un'analisi completa?",
            answer: "1 Credito = 1 Analisi Completa. Questo include l'estrazione di tutti i dati, l'analisi dei requisiti, la checklist, i punteggi tecnici e 3 approfondimenti mirati. Nessun costo nascosto."
        },
        {
            question: "Come funzionano gli approfondimenti extra?",
            answer: "Se hai bisogno di più dettagli oltre ai 3 inclusi, il sistema scala automaticamente 0,5 crediti ogni 3 nuovi approfondimenti (o domande al chatbot). Il consumo è sempre mostrato prima di procedere."
        },
        {
            question: "Quanto costa usare la Genius Mode?",
            answer: "La Genius Mode è un potenziamento opzionale. Attivarla per un'analisi profonda su una o più sezioni specifiche costa 0,5 crediti aggiuntivi. Ti verrà chiesto conferma prima di ogni spesa extra."
        },
        {
            question: "Cosa succede se ho crediti frazionari?",
            answer: "I crediti frazionari (es. 0,5) rimangono nel tuo saldo e sono perfetti per Genius Mode o approfondimenti extra. Tuttavia, per avviare una nuova analisi completa serve almeno 1 credito intero."
        },
        {
            question: "Cosa succede se la gara è molto lunga (es. 300 pagine)?",
            answer: "Il sistema è ottimizzato per documenti lunghi. Tuttavia, per performance ottimali, consigliamo di caricare solo i documenti principali (Disciplinare, Capitolato Tecnico, Schema di Contratto) ed evitare allegati tecnici pesanti o non testuali (es. planimetrie complesse). Il limite consigliato è circa 300 pagine totali per analisi."
        },
        {
            question: "Posso modificare i dati estratti?",
            answer: "Certamente. Ogni campo rilevato dall'IA può essere modificato semplicemente cliccandoci sopra. Puoi anche aggiungere Note Personali per ogni sezione. Tutte le modifiche vengono salvate automaticamente e tracciate nel Log Attività del team."
        },
        {
            question: "I miei dati sono al sicuro?",
            answer: "Assolutamente sì. I documenti vengono elaborati in un ambiente sicuro e crittografato. I dati della tua azienda e le analisi generate sono accessibili solo al tuo account (o al tuo team) e non vengono utilizzati per addestrare modelli pubblici."
        },
        {
            question: "Perché vedo una barra rossa sulla scadenza?",
            answer: "La barra rossa indica che mancano meno di 10 giorni alla scadenza. È un avviso visivo per segnalare l'urgenza dell'opportunità."
        }
    ];

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto bg-slate-950 border-slate-800 text-slate-100 p-0 gap-0">
                <DialogHeader className="p-6 border-b border-slate-800 bg-slate-900/50 sticky top-0 z-10 backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                        <div className="bg-amber-500/10 p-2 rounded-lg">
                            <BookOpen className="h-6 w-6 text-amber-500" />
                        </div>
                        <DialogTitle className="text-xl font-bold">Guida Utente e FAQ</DialogTitle>
                    </div>
                </DialogHeader>

                <div className="p-8 space-y-10">

                    {/* SECTION 1: GUIDA RAPIDA */}
                    <section>
                        <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2 mb-6">
                            <UploadCloud className="h-5 w-5 text-blue-400" />
                            Guida Rapida
                        </h2>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="bg-slate-900/50 p-5 rounded-xl border border-slate-800">
                                <h3 className="font-semibold text-slate-200 mb-3 flex items-center gap-2">
                                    <span className="bg-blue-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span>
                                    Nuova Analisi
                                </h3>
                                <ul className="space-y-2 text-sm text-slate-400">
                                    <li className="flex gap-2">
                                        <span className="text-blue-400">•</span>
                                        <span>Vai su <strong>"Nuova Analisi"</strong> dal menu.</span>
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="text-blue-400">•</span>
                                        <span><strong>Carica i PDF</strong> (Disciplinare, Capitolato, Bando).</span>
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="text-blue-400">•</span>
                                        <span>Seleziona <strong>Settore</strong> e <strong>Sezioni</strong> di interesse.</span>
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="text-blue-400">•</span>
                                        <span>Clicca <strong>"Analizza Gara"</strong> e attendi completamento (2-5 min).</span>
                                    </li>
                                </ul>
                            </div>

                            <div className="bg-slate-900/50 p-5 rounded-xl border border-slate-800">
                                <h3 className="font-semibold text-slate-200 mb-3 flex items-center gap-2">
                                    <span className="bg-purple-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">2</span>
                                    Menu Navigabile
                                </h3>
                                <ul className="space-y-2 text-sm text-slate-400">
                                    <li className="flex gap-2">
                                        <span className="text-purple-400">•</span>
                                        <span>Naviga le sezioni dal <strong>Menu Laterale</strong>.</span>
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="text-purple-400">•</span>
                                        <span>Controlla <strong>Semafori</strong> e <strong>Rischi</strong> evidenziati.</span>
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="text-purple-400">•</span>
                                        <span>Usa <strong>"Deep Dive"</strong> per chat su documenti specifici.</span>
                                    </li>
                                </ul>
                            </div>

                            <div className="bg-slate-900/50 p-5 rounded-xl border border-slate-800">
                                <h3 className="font-semibold text-slate-200 mb-3 flex items-center gap-2">
                                    <span className="bg-amber-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">3</span>
                                    Dashboard & Timeline
                                </h3>
                                <ul className="space-y-2 text-sm text-slate-400">
                                    <li className="flex gap-2">
                                        <span className="text-amber-400">•</span>
                                        <span><strong>Barra Verde</strong>: Scadenza {'>'} 20 giorni.</span>
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="text-amber-400">•</span>
                                        <span><strong>Barra Gialla</strong>: Scadenza 10-20 giorni.</span>
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="text-amber-400">•</span>
                                        <span><strong>Barra Rossa</strong>: Scadenza {'<'} 10 giorni (Urgente).</span>
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="text-amber-400">•</span>
                                        <span>La lunghezza della barra indica il <strong>tempo residuo</strong>.</span>
                                    </li>
                                </ul>
                            </div>

                            <div className="bg-slate-900/50 p-5 rounded-xl border border-slate-800">
                                <h3 className="font-semibold text-slate-200 mb-3 flex items-center gap-2">
                                    <span className="bg-emerald-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">4</span>
                                    Assegnazione & Export
                                </h3>
                                <ul className="space-y-2 text-sm text-slate-400">
                                    <li className="flex gap-2">
                                        <span className="text-emerald-400">•</span>
                                        <span>Imposta stato <strong>"Assegnata"</strong> per abilitare i team.</span>
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="text-emerald-400">•</span>
                                        <span>Clicca <strong>"+"</strong> per assegnare Responsabili.</span>
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="text-emerald-400">•</span>
                                        <span>Scarica il <strong>Report Word</strong> completo in ogni momento.</span>
                                    </li>
                                </ul>
                            </div>

                            <div className="bg-slate-900/50 p-5 rounded-xl border border-slate-800">
                                <h3 className="font-semibold text-slate-200 mb-3 flex items-center gap-2">
                                    <span className="bg-indigo-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">5</span>
                                    Workspace & Team
                                </h3>
                                <ul className="space-y-2 text-sm text-slate-400">
                                    <li className="flex gap-2">
                                        <span className="text-indigo-400">•</span>
                                        <span>Switcher rapido tra <strong>Personale</strong> e <strong>Team</strong>.</span>
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="text-indigo-400">•</span>
                                        <span>Invita colleghi e assegna ruoli (Admin, Membro).</span>
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="text-indigo-400">•</span>
                                        <span>I <strong>crediti</strong> sono condivisi nel Workspace di Team.</span>
                                    </li>
                                </ul>
                            </div>

                            <div className="bg-slate-900/50 p-5 rounded-xl border border-slate-800">
                                <h3 className="font-semibold text-slate-200 mb-3 flex items-center gap-2">
                                    <span className="bg-pink-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">6</span>
                                    Note & Modifiche
                                </h3>
                                <ul className="space-y-2 text-sm text-slate-400">
                                    <li className="flex gap-2">
                                        <span className="text-pink-400">•</span>
                                        <span>Ogni campo è <strong>modificabile</strong>: clicca e scrivi.</span>
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="text-pink-400">•</span>
                                        <span>Aggiungi <strong>Note Personali</strong> in ogni sezione.</span>
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="text-pink-400">•</span>
                                        <span>Tutte le modifiche sono <strong>tracciate</strong> nel log attività.</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    <div className="w-full h-px bg-slate-800" />

                    {/* SECTION 2: FAQ */}
                    <section>
                        <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2 mb-6">
                            <HelpCircle className="h-5 w-5 text-indigo-400" />
                            Domande Frequenti (FAQ)
                        </h2>

                        <div className="space-y-4">
                            {faqs.map((faq, idx) => (
                                <div key={idx} className="bg-slate-900 rounded-lg border border-slate-800 overflow-hidden">
                                    <button
                                        onClick={() => toggleFaq(idx)}
                                        className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-800/50 transition-colors"
                                    >
                                        <span className="font-medium text-slate-200">{faq.question}</span>
                                        {openFaq === idx ? (
                                            <ChevronUp className="h-5 w-5 text-slate-500" />
                                        ) : (
                                            <ChevronDown className="h-5 w-5 text-slate-500" />
                                        )}
                                    </button>

                                    {openFaq === idx && (
                                        <div className="p-4 pt-0 text-sm text-slate-400 leading-relaxed border-t border-slate-800/50 bg-slate-900/30">
                                            {faq.answer}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>

                </div>

                <div className="p-6 border-t border-slate-800 bg-slate-900/50 flex justify-end sticky bottom-0 backdrop-blur-sm">
                    <Button onClick={onClose} variant="ghost" className="hover:bg-slate-800 text-slate-400">
                        Chiudi Guida
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
