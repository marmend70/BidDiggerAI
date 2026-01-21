
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Scan, MessageSquare, LayoutDashboard, Settings, ArrowRight, CheckCircle2, ChevronRight, Play, Check, AlertTriangle, Sparkles, FileText, Users, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import logo from '../assets/logo-final.png';
import { Footer } from './Footer';

interface LandingPageProps {
    onLogin: () => void;
    onRegister: () => void;
    onOpenContact?: () => void;
}

// --- ANIMATION COMPONENTS ---

const ScanDemo = () => {
    return (
        <div className="relative w-full max-w-lg mx-auto bg-slate-900 rounded-xl border border-slate-800 shadow-2xl overflow-hidden aspect-[4/3] group">
            {/* Background UI */}
            <div className="absolute top-0 left-0 right-0 h-10 bg-slate-950 border-b border-slate-800 flex items-center px-4 gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/20"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500/20"></div>
                <div className="w-3 h-3 rounded-full bg-green-500/20"></div>
                <div className="ml-4 text-xs text-slate-500 font-mono">disciplinare_gara.pdf</div>
            </div>

            {/* Document Content */}
            <div className="absolute inset-0 top-10 p-6 space-y-4 opacity-50">
                <div className="h-4 w-3/4 bg-slate-700 rounded animate-pulse"></div>
                <div className="h-4 w-1/2 bg-slate-700 rounded animate-pulse delay-75"></div>
                <div className="h-4 w-5/6 bg-slate-700 rounded animate-pulse delay-100"></div>
                <div className="space-y-2 mt-8">
                    <div className="h-2 w-full bg-slate-800 rounded"></div>
                    <div className="h-2 w-full bg-slate-800 rounded"></div>
                    <div className="h-2 w-2/3 bg-slate-800 rounded"></div>
                </div>
            </div>

            {/* Scanner Beam */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent shadow-[0_0_15px_rgba(245,158,11,0.5)] animate-[scan_3s_ease-in-out_infinite] z-20"></div>

            {/* Extracted Data Cards (Popups) */}
            <div className="absolute bottom-6 right-6 w-64 bg-slate-900/90 backdrop-blur border border-amber-500/50 rounded-lg p-4 shadow-xl z-30 transition-all duration-700 animate-in slide-in-from-bottom-10 fade-in fill-mode-forwards">
                <div className="text-xs text-amber-500 font-bold mb-2 uppercase tracking-wider flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Dati Estratti
                </div>
                <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm border-b border-slate-800 pb-1">
                        <span className="text-slate-400">Scadenza</span>
                        <span className="text-slate-100 font-mono font-bold">15 Mag 2024</span>
                    </div>
                    <div className="flex justify-between items-center text-sm border-b border-slate-800 pb-1">
                        <span className="text-slate-400">Importo</span>
                        <span className="text-slate-100 font-mono font-bold">€ 1.5M</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-400">CIG</span>
                        <span className="text-slate-100 font-mono font-bold">894723X</span>
                    </div>
                </div>
            </div>
            <style>{`
                @keyframes scan {
                    0% { top: 10%; opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { top: 90%; opacity: 0; }
                }
            `}</style>
        </div>
    );
};

const ChatDemo = () => {
    const [messages, setMessages] = useState<Array<{ role: 'user' | 'bot', content: React.ReactNode }>>([
        { role: 'bot', content: "Ciao! Ho analizzato i documenti. Sono pronto a rispondere." }
    ]);
    const [isTyping, setIsTyping] = useState(false);
    const [inputValue, setInputValue] = useState("");

    useEffect(() => {
        let mounted = true;
        let timeout: NodeJS.Timeout;

        const steps = [
            { action: 'wait', ms: 1500 },
            { action: 'type', text: "Quali sono i requisiti del Capoprogetto?" },
            { action: 'send' },
            { action: 'wait', ms: 500 },
            { action: 'bot_type', val: true },
            { action: 'wait', ms: 1500 },
            { action: 'bot_type', val: false },
            {
                action: 'bot_msg', content: (
                    <div>
                        <p className="mb-2">Secondo il <span className="text-indigo-400 font-semibold border-b border-indigo-400/30">Disciplinare (Pag. 18)</span>:</p>
                        <ul className="space-y-1 ml-4 list-disc marker:text-amber-500">
                            <li>Laurea Magistrale in Ing. Informatica</li>
                            <li>Certificazione <span className="text-amber-400 font-bold">PMP</span> o Prince2</li>
                            <li>Almeno 5 anni di esperienza</li>
                        </ul>
                    </div>
                )
            },
            { action: 'wait', ms: 3000 },
            { action: 'type', text: "Ci sono penali?" },
            { action: 'send' },
            { action: 'wait', ms: 500 },
            { action: 'bot_type', val: true },
            { action: 'wait', ms: 1500 },
            { action: 'bot_type', val: false },
            { action: 'bot_msg', content: "Sì, l'Art. 9 prevede una penale dello 0.1‰ per ogni giorno di ritardo, fino a un massimo del 10%." },
            { action: 'wait', ms: 4000 },
            { action: 'reset' }
        ];

        let stepIndex = 0;

        const executeStep = () => {
            if (!mounted) return;
            const step = steps[stepIndex];

            if (step.action === 'wait') {
                timeout = setTimeout(() => {
                    stepIndex++;
                    if (stepIndex < steps.length) executeStep();
                }, step.ms);
            } else if (step.action === 'type') {
                let text = step.text as string;
                let charIndex = 0;
                const typeInterval = setInterval(() => {
                    if (!mounted) return clearInterval(typeInterval);
                    setInputValue(text.substring(0, charIndex + 1));
                    charIndex++;
                    if (charIndex === text.length) {
                        clearInterval(typeInterval);
                        setTimeout(() => {
                            stepIndex++;
                            if (stepIndex < steps.length) executeStep();
                        }, 300);
                    }
                }, 40);
            } else if (step.action === 'send') {
                setInputValue("");
                setMessages(prev => [...prev, { role: 'user', content: steps[stepIndex - 1].text }]); // Use text from prev step
                stepIndex++;
                executeStep();
            } else if (step.action === 'bot_type') {
                setIsTyping(Boolean(step.val));
                stepIndex++;
                executeStep();
            } else if (step.action === 'bot_msg') {
                setMessages(prev => [...prev, { role: 'bot', content: step.content }]);
                stepIndex++;
                executeStep();
            } else if (step.action === 'reset') {
                setMessages([{ role: 'bot', content: "Ciao! Ho analizzato i documenti. Sono pronto a rispondere." }]);
                stepIndex = 0;
                executeStep();
            }
        };

        executeStep();

        return () => {
            mounted = false;
            clearTimeout(timeout);
        };
    }, []);

    const scrollContainerRef = React.useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTo({
                top: scrollContainerRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }
    }, [messages, isTyping]);


    return (
        <div className="relative w-full max-w-lg mx-auto bg-slate-950 rounded-xl border border-slate-800 shadow-2xl p-4 flex flex-col gap-4 h-[400px]">
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
                <div className="w-8 h-8 rounded-full bg-indigo-600/20 flex items-center justify-center">
                    <MessageSquare className="w-4 h-4 text-indigo-400" />
                </div>
                <div>
                    <div className="text-sm font-bold text-slate-200">Bid Digger Assistant</div>
                    <div className="text-[10px] text-green-500 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span> Online
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div ref={scrollContainerRef} className="flex-1 space-y-4 overflow-y-auto w-full pr-2 scrollbar-thin scrollbar-thumb-slate-800">
                {messages.map((msg, idx) => (
                    <div key={idx} className={cn("flex gap-3 w-full", msg.role === 'user' ? "justify-end" : "justify-start")}>
                        {msg.role === 'bot' && (
                            <div className="w-8 h-8 rounded-full bg-indigo-600/20 flex-shrink-0 flex items-center justify-center mt-1">
                                <MessageSquare className="w-4 h-4 text-indigo-400" />
                            </div>
                        )}
                        <div className={cn(
                            "px-4 py-3 rounded-2xl text-sm max-w-[90%] shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300",
                            msg.role === 'user'
                                ? "bg-amber-600 text-white rounded-tr-sm"
                                : "bg-slate-900 border border-slate-800 text-slate-300 rounded-tl-sm"
                        )}>
                            {msg.content}
                        </div>
                    </div>
                ))}
                {isTyping && (
                    <div className="flex gap-3 justify-start animate-in fade-in slide-in-from-bottom-2">
                        <div className="w-8 h-8 rounded-full bg-indigo-600/20 flex-shrink-0 flex items-center justify-center mt-1">
                            <MessageSquare className="w-4 h-4 text-indigo-400" />
                        </div>
                        <div className="bg-slate-900 border border-slate-800 px-4 py-3 rounded-2xl rounded-tl-sm text-sm text-slate-400 flex gap-1 items-center h-10">
                            <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                            <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                            <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce"></span>
                        </div>
                    </div>
                )}
            </div>

            {/* Input */}
            <div className="mt-auto pt-2 border-t border-slate-900">
                <div className="h-10 bg-slate-900 rounded-lg border border-slate-800 flex items-center px-3 text-slate-300 text-sm relative">
                    {inputValue}
                    {!inputValue && <span className="text-slate-600 italic">Chiedi ai tuoi documenti...</span>}
                    {inputValue && <span className="animate-pulse ml-0.5">|</span>}
                    <div className={cn("absolute right-2 top-2 p-1 rounded-md text-white transition-all duration-300", inputValue ? "bg-amber-600" : "bg-slate-800 text-slate-500")}>
                        <ArrowRight className="w-3 h-3" />
                    </div>
                </div>
            </div>
        </div>
    );
};

const GeniusDemo = () => {
    return (
        <div className="relative w-full max-w-lg mx-auto bg-slate-950 rounded-xl border border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                <div className="font-bold text-slate-200">Analisi Rischi Legali</div>
                <div className="px-2 py-1 bg-red-900/30 text-red-400 text-xs font-bold rounded uppercase border border-red-900/50">Criticità Elevata</div>
            </div>

            <div className="space-y-3">
                <div className="bg-slate-900/50 border border-red-900/30 rounded-lg p-3 relative group">
                    <div className="absolute top-2 right-2 text-red-500 animate-pulse">
                        <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div className="text-xs text-slate-500 mb-1">Art. 14 - Risoluzione</div>
                    <div className="text-sm text-slate-300">
                        "La stazione appaltante si riserva la facoltà di risolvere il contratto <span className="bg-red-900/30 text-red-200 px-1 rounded">senza preavviso</span> in caso di singolo disservizio."
                    </div>
                </div>

                <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-3 group hover:border-slate-700 transition-colors">
                    <div className="text-xs text-slate-500 mb-1">Art. 15 - Pagamenti</div>
                    <div className="text-sm text-slate-300">
                        Pagamento a 60 giorni data fattura fine mese.
                    </div>
                </div>

                <div className="bg-slate-900/50 border border-yellow-900/30 rounded-lg p-3 relative">
                    <div className="absolute top-2 right-2 text-yellow-500">
                        <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div className="text-xs text-slate-500 mb-1">Art. 7 - Sopralluogo</div>
                    <div className="text-sm text-slate-300">
                        "<span className="bg-yellow-900/20 text-yellow-200 px-1 rounded">Sopralluogo obbligatorio</span> a pena di esclusione."
                    </div>
                </div>
            </div>
        </div>
    );
};

const DashboardDemo = () => {
    return (
        <div className="relative w-full max-w-lg mx-auto bg-slate-900 rounded-xl border border-slate-800 shadow-2xl p-0 overflow-hidden">
            <div className="bg-slate-950 p-3 border-b border-slate-800 flex justify-between items-center">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Timeline Gare</div>
                <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                    <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                </div>
            </div>

            <div className="p-4 space-y-3">
                {/* Row 1 */}
                <div className="bg-slate-950/50 rounded-lg p-3 border border-slate-800 flex flex-col gap-2 relative overflow-hidden group hover:border-slate-700 transition-colors">
                    <div className="flex justify-between items-center z-10">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-500"></span>
                            <span className="text-sm font-bold text-white">Servizi Cloud PA</span>
                        </div>
                        <span className="text-xs text-slate-400">15 Mag 2024</span>
                    </div>
                    <div className="relative h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div className="absolute top-0 left-0 h-full w-[70%] bg-gradient-to-r from-green-600 to-green-400 rounded-full"></div>
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                        <span>20 giorni rimanenti</span>
                        <div className="flex -space-x-1">
                            <div className="w-4 h-4 rounded-full bg-blue-900 text-blue-200 flex items-center justify-center text-[8px] ring-1 ring-slate-900">MV</div>
                            <div className="w-4 h-4 rounded-full bg-purple-900 text-purple-200 flex items-center justify-center text-[8px] ring-1 ring-slate-900">LB</div>
                        </div>
                    </div>
                </div>

                {/* Row 2 */}
                <div className="bg-slate-950/50 rounded-lg p-3 border border-slate-800 flex flex-col gap-2 relative overflow-hidden group hover:border-slate-700 transition-colors">
                    <div className="flex justify-between items-center z-10">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                            <span className="text-sm font-bold text-white">Manutenzione Impianti</span>
                        </div>
                        <span className="text-xs text-amber-500 font-bold">3 gg Urgent</span>
                    </div>
                    <div className="relative h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div className="absolute top-0 left-0 h-full w-[90%] bg-gradient-to-r from-red-600 to-amber-500 rounded-full animate-pulse"></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- MAIN PAGE ---

export function LandingPage({ onLogin, onRegister, onOpenContact }: LandingPageProps) {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToSection = (id: string) => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <div className="min-h-screen bg-[#0B0F19] text-slate-200 selection:bg-amber-500/30">
            {/* --- NAVBAR --- */}
            <nav className={cn(
                "fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b",
                scrolled ? "bg-[#0B0F19]/80 backdrop-blur-md border-slate-800 py-3" : "bg-transparent border-transparent py-6"
            )}>
                <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <img src={logo} alt="Bid Digger Logo" className="w-10 h-10 object-contain" />
                        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">Bid Digger</span>
                    </div>

                    <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
                        <button onClick={() => scrollToSection('features')} className="hover:text-white transition-colors">Funzionalità</button>
                        <button onClick={() => scrollToSection('genius')} className="hover:text-white transition-colors">Genius Mode</button>
                        <button onClick={() => scrollToSection('assistant')} className="hover:text-white transition-colors">AI Assistant</button>
                        <button onClick={() => scrollToSection('dashboard')} className="hover:text-white transition-colors">Dashboard</button>
                        <button onClick={() => scrollToSection('collaboration')} className="hover:text-white transition-colors">Workspace & Collaboration</button>
                        <button onClick={() => scrollToSection('config')} className="hover:text-white transition-colors">Configurazioni</button>
                    </div>

                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            className="text-slate-300 hover:text-white flex"
                            onClick={onLogin}
                        >
                            Accedi
                        </Button>
                        <Button
                            className="bg-amber-600 hover:bg-amber-700 text-white rounded-full px-6 shadow-lg shadow-amber-900/20 transition-all hover:scale-105"
                            onClick={onRegister}
                        >
                            Inizia Gratis
                        </Button>
                    </div>
                </div>
            </nav>

            {/* --- HERO SECTION --- */}
            <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden px-6">
                {/* Background Gradients */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-indigo-500/10 rounded-full blur-[100px] -z-10"></div>
                <div className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-amber-500/5 rounded-full blur-[120px] -z-10"></div>

                <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
                    <div className="space-y-8 animate-in slide-in-from-bottom-10 fade-in duration-700">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-900/50 border border-slate-800 rounded-full text-xs font-semibold text-amber-500 uppercase tracking-widest mb-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                            AI per Uffici Gare
                        </div>
                        <h1 className="text-4xl md:text-6xl font-extrabold leading-tight text-white">
                            Il tuo assistente intelligente <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">
                                per l'analisi dei bandi di gara.
                            </span>
                        </h1>
                        <p className="text-lg md:text-xl text-slate-400 leading-relaxed max-w-4xl">
                            Bid Digger è una piattaforma di analisi sintattica e semantica delle gare d’appalto, progettata per trasformare documenti complessi in informazioni strutturate, condivisibili e verificabili da team di lavoro. <br className="hidden md:block" />
                            Dimentica le ore passate a leggere disciplinari. Bid Digger estrae requisiti, scadenze, criteri e tanto altro in secondi: le potrai condividere con il tuo team, modificare o integrare se necessario, per avere un completo quadro di fattibilità delle tue gare in valutazione.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 pt-4">
                            <Button
                                size="lg"
                                className="bg-white text-slate-900 hover:bg-slate-200 text-lg px-8 rounded-full h-14"
                                onClick={onRegister}
                            >
                                Prova Gratis
                                <ArrowRight className="ml-2 w-5 h-5" />
                            </Button>

                        </div>

                        <div className="pt-8 flex items-center gap-6 text-sm text-slate-500">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-green-500" /> Nessuna carta di credito
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-green-500" /> 5 Analisi Omaggio
                            </div>
                        </div>
                    </div>

                    <div className="relative animate-in slide-in-from-right-10 fade-in duration-1000 delay-200">
                        <ScanDemo />
                    </div>
                </div>
            </section>

            {/* --- FEATURES / SCANNER --- */}
            <section id="features" className="py-24 bg-slate-950/50 border-y border-slate-900 relative" >
                <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-3 gap-12">
                    <div className="bg-slate-900/50 p-8 rounded-3xl border border-slate-800 hover:border-indigo-500/50 transition-all group">
                        <div className="w-14 h-14 bg-indigo-900/30 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <Scan className="w-7 h-7 text-indigo-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-4">Scanner Intelligente</h3>
                        <p className="text-slate-400 leading-relaxed">
                            Carica PDF, Word o Scansioni. Il nostro OCR avanzato legge tutto, anche le tabelle più complesse, e normalizza i dati in un formato strutturato.
                        </p>
                    </div>
                    <div className="bg-slate-900/50 p-8 rounded-3xl border border-slate-800 hover:border-amber-500/50 transition-all group">
                        <div className="w-14 h-14 bg-amber-900/30 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <LayoutDashboard className="w-7 h-7 text-amber-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-4">Sintesi Strategica</h3>
                        <p className="text-slate-400 leading-relaxed">
                            Ottieni subito le info critiche: Requisiti di fatturato, Certificazioni, Penali, Scadenze e Criteri di valutazione tecnica.
                        </p>
                    </div>
                    <div className="bg-slate-900/50 p-8 rounded-3xl border border-slate-800 hover:border-emerald-500/50 transition-all group">
                        <div className="w-14 h-14 bg-emerald-900/30 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <CheckCircle2 className="w-7 h-7 text-emerald-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-4">Checklist Automatica</h3>
                        <p className="text-slate-400 leading-relaxed">
                            Genera automaticamente la lista dei documenti amministrativi da produrre per non dimenticare nulla in fase di offerta.
                        </p>
                    </div>
                </div>
            </section>

            {/* --- GENIUS MODE SECTION --- */}
            <section id="genius" className="py-32 px-6" >
                <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-20 items-center">
                    <div className="order-2 lg:order-2 relative">
                        {/* Decorative circle */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[400px] bg-purple-600/20 rounded-full blur-[90px] -z-10"></div>
                        <GeniusDemo />
                    </div>
                    <div className="order-1 lg:order-1 space-y-6">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-950/50 border border-purple-800/50 rounded-full text-xs font-semibold text-purple-400 uppercase tracking-widest">
                            <Sparkles className="w-3 h-3" /> Genius Mode
                        </div>
                        <h2 className="text-4xl md:text-5xl font-bold text-white">
                            Oltre la semplice lettura: <br />
                            <span className="text-purple-400">Comprensione Strategica</span>
                        </h2>
                        <p className="text-lg text-slate-400 leading-relaxed">
                            Genius Mode non si limita ad estrarre dati. Incrocia le informazioni tra disciplinare, capitolato e contratto per scovare incongruenze e rischi nascosti.
                        </p>

                        <div className="space-y-6 pt-4">
                            <div className="flex gap-4">
                                <div className="w-12 h-12 rounded-xl bg-red-900/20 flex items-center justify-center border border-red-900/50 flex-shrink-0">
                                    <AlertTriangle className="w-6 h-6 text-red-400" />
                                </div>
                                <div>
                                    <h4 className="text-lg font-bold text-white">Analisi dei Rischi</h4>
                                    <p className="text-slate-400 text-sm">Evidenzia automaticamente vincoli, penali e clausole critiche che richiedono attenzione strategica.</p>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <div className="w-12 h-12 rounded-xl bg-purple-900/20 flex items-center justify-center border border-purple-900/50 flex-shrink-0">
                                    <CheckCircle2 className="w-6 h-6 text-purple-400" />
                                </div>
                                <div>
                                    <h4 className="text-lg font-bold text-white">Mappatura Requisiti</h4>
                                    <p className="text-slate-400 text-sm">Estrae e organizza tutti i criteri di valutazione e i requisiti mandatori per l'offerta tecnica.</p>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <div className="w-12 h-12 rounded-xl bg-amber-900/20 flex items-center justify-center border border-amber-900/50 flex-shrink-0">
                                    <FileText className="w-6 h-6 text-amber-400" />
                                </div>
                                <div>
                                    <h4 className="text-lg font-bold text-white">Verifica Coerenza</h4>
                                    <p className="text-slate-400 text-sm">Confronta le informazioni tra i diversi documenti di gara per segnalare eventuali disallineamenti.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- ASSISTANT SECTION --- */}
            <section id="assistant" className="py-32 px-6 bg-gradient-to-b from-[#0B0F19] to-indigo-950/20" >
                <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-20 items-center">
                    <div className="order-2 lg:order-1 relative">
                        {/* Decorative circle */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-indigo-600/20 rounded-full blur-[80px] -z-10"></div>
                        <ChatDemo />
                    </div>
                    <div className="order-1 lg:order-2 space-y-6">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-950/50 border border-indigo-800/50 rounded-full text-xs font-semibold text-indigo-400 uppercase tracking-widest">
                            Deep Dive Analysis
                        </div>
                        <h2 className="text-4xl md:text-5xl font-bold text-white">
                            Un Assistente che <br />
                            <span className="text-indigo-400">Dialoga con i Documenti</span>
                        </h2>
                        <p className="text-lg text-slate-400 leading-relaxed">
                            Non usare più Ctrl+F. Chiedi a Bid Digger Assistant qualsiasi dettaglio:
                            "Quali sono le penali?", "Serve il sopralluogo?", "Qual è la formula del punteggio economico?".
                            Ricevi risposte precise con citazione della pagina.
                        </p>
                        <ul className="space-y-4 pt-4">
                            {[
                                'Cerca informazioni su centinaia di pagine in istanti',
                                'Confronta incongruenze tra disciplinare e capitolato',
                                'Genera sintesi per il team tecnico'
                            ].map((item, i) => (
                                <li key={i} className="flex items-center gap-3 text-slate-300">
                                    <div className="w-6 h-6 rounded-full bg-indigo-900/50 flex items-center justify-center border border-indigo-800">
                                        <Check className="w-3 h-3 text-indigo-400" />
                                    </div>
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </section>

            {/* --- DASHBOARD SECTION --- */}
            <section id="dashboard" className="py-32 px-6" >
                <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-20 items-center">
                    <div className="space-y-6">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-950/30 border border-amber-900/50 rounded-full text-xs font-semibold text-amber-500 uppercase tracking-widest">
                            Control Room
                        </div>
                        <h2 className="text-4xl md:text-5xl font-bold text-white">
                            Tutte le tue gare <br />
                            <span className="text-amber-500">Sotto Controllo</span>
                        </h2>
                        <p className="text-lg text-slate-400 leading-relaxed">
                            Una dashboard unificata per monitorare scadenze, stati di avanzamento e assegnazioni.
                            Visualizza la timeline temporale e assegna compiti al team Commerciale, Tecnico e Amministrativo.
                        </p>
                        <div className="flex gap-4 pt-4">
                            <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 w-full">
                                <div className="text-2xl font-bold text-white mb-1">Timeline</div>
                                <div className="text-sm text-slate-400">Visualizzazione Gantt delle scadenze</div>
                            </div>
                            <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 w-full">
                                <div className="text-2xl font-bold text-white mb-1">Team</div>
                                <div className="text-sm text-slate-400">Assegnazione responsabili</div>
                            </div>
                        </div>
                    </div>
                    <div className="relative">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-amber-600/10 rounded-full blur-[80px] -z-10"></div>
                        <DashboardDemo />
                    </div>
                </div>
            </section>


            {/* --- TEAM & WORKSPACE SECTION --- */}
            <section id="collaboration" className="py-32 px-6 bg-slate-950 relative overflow-hidden" >
                {/* Background Glow */}
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-900/10 rounded-full blur-[120px] -z-10" ></div>

                <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-20 items-center">
                    <div className="order-2 lg:order-1 relative">
                        <div className="relative w-full max-w-lg mx-auto bg-slate-900 rounded-xl border border-slate-800 shadow-2xl p-6 overflow-hidden transform rotate-2 hover:rotate-0 transition-transform duration-500">
                            {/* Header */}
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-blue-600/20 flex items-center justify-center border border-blue-600/30">
                                        <Users className="w-5 h-5 text-blue-400" />
                                    </div>
                                    <div>
                                        <div className="font-bold text-slate-200">Team Gare Pubbliche</div>
                                        <div className="text-xs text-slate-500">Workspace Aziendale</div>
                                    </div>
                                </div>
                                <div className="flex -space-x-2">
                                    {/* Avatars */}
                                    <div className="w-8 h-8 rounded-full bg-slate-700 border-2 border-slate-900 flex items-center justify-center text-xs font-bold text-slate-300">MV</div>
                                    <div className="w-8 h-8 rounded-full bg-indigo-900 border-2 border-slate-900 flex items-center justify-center text-xs font-bold text-indigo-200">GL</div>
                                    <div className="w-8 h-8 rounded-full bg-blue-600 border-2 border-slate-900 flex items-center justify-center text-xs text-white font-bold">+3</div>
                                </div>
                            </div>

                            {/* Content Mock */}
                            <div className="space-y-4">
                                <div className="bg-slate-950/50 rounded-lg p-4 border border-slate-800">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Activity className="w-3 h-3 text-slate-500" />
                                        <span className="text-xs font-bold text-slate-500 uppercase">Activity Log</span>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex gap-3 items-start text-sm relative pl-4 border-l border-slate-800">
                                            <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-blue-500 ring-4 ring-slate-950"></div>
                                            <div>
                                                <span className="text-slate-200 font-bold">Marco V.</span>
                                                <span className="text-slate-400"> ha modificato lo stato in </span>
                                                <span className="text-amber-400 font-medium">In Valutazione</span>
                                                <div className="text-[10px] text-slate-600 mt-0.5">2 min fa</div>
                                            </div>
                                        </div>
                                        <div className="flex gap-3 items-start text-sm relative pl-4 border-l border-slate-800">
                                            <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-purple-500 ring-4 ring-slate-950"></div>
                                            <div>
                                                <span className="text-slate-200 font-bold">Giulia L.</span>
                                                <span className="text-slate-400"> ha assegnato un responsabile tecnico alla gara </span>
                                                <span className="text-slate-200 font-medium">Cloud PA</span>
                                                <div className="text-[10px] text-slate-600 mt-0.5">15 min fa</div>
                                            </div>
                                        </div>
                                        <div className="flex gap-3 items-start text-sm relative pl-4 border-l border-slate-800">
                                            <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-green-500 ring-4 ring-slate-950"></div>
                                            <div>
                                                <span className="text-slate-200 font-bold">Luca B.</span>
                                                <span className="text-slate-400"> ha inserito una nota nella sezione </span>
                                                <span className="text-slate-200 font-medium">Criteri e Punteggi</span>
                                                <div className="text-[10px] text-slate-600 mt-0.5">32 min fa</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="order-1 lg:order-2 space-y-8">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-950/30 border border-blue-900/50 rounded-full text-xs font-semibold text-blue-400 uppercase tracking-widest">
                            <Users className="w-3 h-3" /> Collaboration
                        </div>
                        <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight">
                            Il tuo Ufficio Gare <br />
                            <span className="text-blue-500">Condiviso e Sincronizzato</span>
                        </h2>
                        <p className="text-lg text-slate-400 leading-relaxed">
                            Crea un workspace dedicato per il tuo team.
                            Invita colleghi a condividere e collaborare e tieni traccia di chi fa cosa con un registro attività aggiornato.
                        </p>

                        <div className="space-y-6 pt-2">
                            <div className="flex gap-4">
                                <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center border border-slate-700 flex-shrink-0">
                                    <LayoutDashboard className="w-6 h-6 text-slate-300" />
                                </div>
                                <div>
                                    <h4 className="text-lg font-bold text-white">Multi-Workspace</h4>
                                    <p className="text-slate-400 text-sm">Passa da un ambiente all'altro con un click. Ideale per gruppi di lavoro o singoli consulenti.</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center border border-slate-700 flex-shrink-0">
                                    <Activity className="w-6 h-6 text-slate-300" />
                                </div>
                                <div>
                                    <h4 className="text-lg font-bold text-white">Tracciamento Azioni</h4>
                                    <p className="text-slate-400 text-sm">Saprai sempre chi ha cambiato uno stato, caricato un doc o modificato una nota.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- SETTINGS SECTION --- */}
            <section id="config" className="py-24 bg-slate-950 border-t border-slate-900 px-6" >
                <div className="max-w-4xl mx-auto text-center space-y-6 mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold text-white">Tutto Configurabile</h2>
                    <p className="text-lg text-slate-400">
                        Adatta l'analisi alle tue esigenze. Scegli quali sezioni analizzare per risparmiare tempo e focus.
                    </p>
                </div>

                <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-6">
                    {/* Config Cards */}
                    {[
                        {
                            title: 'Modello AI', desc: "Modelli AI di ultima generazione, al servizio dell'analisi strutturale e semantica.", icon: Settings
                        },
                        { title: 'Sezioni Export', desc: 'Seleziona quali capitoli includere nel report Word finale.', icon: LayoutDashboard },
                        { title: 'Personalizzazioni', desc: 'Definisci i nomi dei responsabili e le tue preferenze di analisi.', icon: CheckCircle2 },
                    ].map((item, i) => (
                        <div key={i} className="bg-slate-900 p-6 rounded-2xl border border-slate-800 hover:bg-slate-800 transition-colors text-left">
                            <item.icon className="w-8 h-8 text-slate-500 mb-4" />
                            <h4 className="text-xl font-bold text-slate-200 mb-2">{item.title}</h4>
                            <p className="text-slate-400 text-sm">{item.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* --- CTA FOOTER --- */}
            <section className="py-20 px-6 border-t border-slate-800 text-center" >
                <div className="max-w-3xl mx-auto space-y-8">
                    <h2 className="text-4xl font-bold text-white">Pronto a imparare un nuovo modo per gareggiare?</h2>
                    <p className="text-xl text-slate-400">Inizia ora la tua prova gratuita. Nessun impegno.</p>
                    <Button
                        size="lg"
                        className="bg-amber-600 hover:bg-amber-700 text-white text-lg px-12 py-8 rounded-full shadow-2xl shadow-amber-900/50 transition-all hover:scale-105"
                        onClick={onRegister}
                    >
                        Inizia Ora
                    </Button>
                </div>
            </section>

            <Footer onOpenContact={onOpenContact} />
        </div>
    );
}

