
import React, { useEffect, useState } from 'react';
import { X, Check, AlertTriangle, Info, Shield, Users, BarChart3, Zap } from 'lucide-react';
import { LEMON_SQUEEZY_URLS } from '../constants';
import { supabase } from '@/lib/supabase';

interface PricingModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string | undefined;
}

export const PricingModal_Legacy_Tiers: React.FC<PricingModalProps> = ({ isOpen, onClose, userId }) => {
    const [credits, setCredits] = useState<number>(0);
    const [currentPlan, setCurrentPlan] = useState<string>('starter');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && userId) {
            setLoading(true);
            supabase.from('profiles').select('credits, plan_type').eq('id', userId).single()
                .then(({ data, error }) => {
                    if (data) {
                        setCredits(data.credits);
                        setCurrentPlan(data.plan_type || 'starter');
                    }
                    setLoading(false);
                });
        }
    }, [isOpen, userId]);

    if (!isOpen) return null;

    // Helper: Map plan to level
    const getLevel = (plan: string) => {
        const lower = plan?.toLowerCase() || 'starter';
        if (lower.includes('agency')) return 3;
        if (lower.includes('pro')) return 2;
        return 1; // Starter default
    };

    const activeLevel = getLevel(currentPlan);
    const currentCreditsInt = Math.floor(credits); // "Solo i crediti interi residui determinano il livello attivo"

    const handleBuy = (url: string, targetLevel: number, targetName: string) => {
        if (!userId) {
            alert("Devi effettuare il login per acquistare.");
            return;
        }

        // VALIDATION RULE: "Solo pacchetti di pari o superiore livello" IF credits >= 1
        if (currentCreditsInt >= 1) {
            if (targetLevel < activeLevel) {
                // BLOCK
                alert("Hai crediti attivi di un piano superiore.\nPuoi acquistare solo pacchetti di pari o superiore livello o devi prima esaurire i crediti attuali.");
                return;
            }
        }

        // Proceed
        const separator = url.includes('?') ? '&' : '?';
        const checkoutUrl = `${url}${separator}checkout[custom][user_id]=${userId}`;
        window.open(checkoutUrl, '_blank');
        onClose(); // Close modal after click? specific usage
    };

    const TierCard = ({
        name,
        price,
        creditsCount,
        features,
        level,
        url,
        popular = false,
        savings = null,
        description
    }: any) => {
        return (
            <div className={`relative flex flex-col p-6 rounded-2xl w-full border-2 transition-all duration-200
                ${popular ? 'border-indigo-500 bg-[#1e1e2d] shadow-xl shadow-indigo-500/10 scale-105 z-10' : 'border-slate-800 bg-[#151521] hover:border-slate-700'}
            `}>
                {popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-indigo-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                        Più Popolare
                    </div>
                )}

                <div className="mb-4">
                    <h3 className={`text-lg font-bold ${popular ? 'text-white' : 'text-slate-200'}`}>{name}</h3>
                    <div className="flex items-baseline gap-1 mt-2">
                        <span className="text-3xl font-bold text-white">€{price}</span>
                        <span className="text-sm text-slate-500">/ una tantum</span>
                    </div>
                    <div className="text-sm font-medium text-emerald-400 mt-2 flex items-center gap-1">
                        <Zap className="h-3 w-3" /> {creditsCount} Crediti inclusi
                    </div>
                </div>

                <div className="flex-grow space-y-3 mb-6">
                    {features.map((feat: string, i: number) => (
                        <div key={i} className="flex items-start gap-3 text-sm text-slate-300">
                            <Check className={`h-4 w-4 shrink-0 mt-0.5 ${popular ? 'text-indigo-400' : 'text-slate-500'}`} />
                            <span>{feat}</span>
                        </div>
                    ))}
                </div>

                <button
                    onClick={() => handleBuy(url, level, name)}
                    className={`w-full py-3 px-4 rounded-xl font-semibold transition-all
                        ${popular
                            ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20'
                            : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'}
                    `}
                >
                    Acquista {name}
                </button>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm">
            <div className="flex min-h-full items-center justify-center p-4">
                <div className="relative w-full max-w-5xl bg-[#0f0f16] border border-slate-800 rounded-3xl shadow-2xl p-6 md:p-8 animate-in fade-in zoom-in duration-200">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 z-50 p-2 bg-slate-900 rounded-full text-slate-400 hover:text-white transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>

                    <div className="text-center mb-10">
                        <h2 className="text-3xl font-bold text-white mb-3">Scegli il pacchetto adatto a te</h2>
                        <p className="text-slate-400 max-w-2xl mx-auto">
                            Massima flessibilità. Acquista crediti quando ne hai bisogno. <br />
                            <span className="text-indigo-400 font-medium">1 Credito = 1 Analisi Completa</span>
                        </p>

                        {/* User Status Banner */}
                        <div className="mt-6 inline-flex items-center gap-3 px-4 py-2 bg-slate-900 rounded-lg border border-slate-800">
                            <div className="flex items-center gap-2 text-sm text-slate-300">
                                <BarChart3 className="h-4 w-4 text-indigo-400" />
                                <span>Crediti attuali: <strong className="text-white">{credits}</strong></span>
                            </div>
                            <div className="h-4 w-[1px] bg-slate-700"></div>
                            <div className="flex items-center gap-2 text-sm text-slate-300">
                                <Shield className="h-4 w-4 text-emerald-400" />
                                <span>Livello attivo: <strong className="text-white uppercase">{currentPlan}</strong></span>
                            </div>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
                        <TierCard
                            name="Starter"
                            price="9,99"
                            creditsCount={5}
                            level={1}
                            url={LEMON_SQUEEZY_URLS.STARTER}
                            features={[
                                "5 Crediti (Analisi)",
                                "Uso individuale (Spazio personale)",
                                "Dashboard (senza log attività)",
                                "Accesso completo Analisi & Genius",
                                "Esportazione DOCX",
                            ]}
                        />

                        <TierCard
                            name="Pro"
                            price="24,99"
                            creditsCount={15}
                            level={2}
                            popular={true}
                            url={LEMON_SQUEEZY_URLS.PRO}
                            features={[
                                "15 Crediti",
                                "Tutto ciò che è incluso in Starter",
                                "Dashboard con log attività",
                                "Crea 1 Workspace Collaborativo",
                                "Max 3 Membri nel team",
                                "Crediti condivisi nel workspace"
                            ]}
                        />

                        <TierCard
                            name="Agency"
                            price="59,99"
                            creditsCount={40}
                            level={3}
                            url={LEMON_SQUEEZY_URLS.AGENCY}
                            features={[
                                "40 Crediti",
                                "Tutto ciò che è incluso in Pro",
                                "Crea 1 Workspace Collaborativo",
                                "Max 10 Membri nel team",
                                "Dashboard con Log Attività"
                            ]}
                        />
                    </div>

                    {/* Credit Usage Explanation */}
                    <div className="mt-8 bg-slate-900/30 p-6 rounded-2xl border border-slate-800 max-w-4xl mx-auto">
                        <h3 className="text-lg font-semibold text-white mb-6 text-center">Usa i crediti come preferisci</h3>

                        <div className="grid md:grid-cols-2 gap-x-12 gap-y-8 text-sm">
                            <div className="space-y-6">
                                <div className="flex gap-4">
                                    <div className="mt-0.5 h-6 w-6 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 border border-emerald-500/20">
                                        <span className="text-emerald-400 font-bold text-xs">1</span>
                                    </div>
                                    <div className="text-slate-400 leading-relaxed">
                                        <strong className="text-slate-200 block mb-1 text-base">1 credito = 1 analisi completa</strong>
                                        Senza sorprese. Ogni analisi include 3 approfondimenti mirati, anche tramite chatbot.
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <div className="mt-0.5 h-6 w-6 rounded-full bg-indigo-500/10 flex items-center justify-center shrink-0 border border-indigo-500/20">
                                        <Zap className="h-3.5 w-3.5 text-indigo-400" />
                                    </div>
                                    <div className="text-slate-400 leading-relaxed">
                                        <strong className="text-slate-200 block mb-1 text-base">Genius Mode</strong>
                                        Quando serve più profondità, Genius Mode potenzia l’analisi in modo intelligente con un consumo aggiuntivo di <span className="text-indigo-300">0,5 crediti</span>.
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="flex gap-4">
                                    <div className="mt-0.5 h-6 w-6 rounded-full bg-slate-700/30 flex items-center justify-center shrink-0 border border-slate-600/30">
                                        <span className="text-slate-300 font-bold text-xs">+</span>
                                    </div>
                                    <div className="text-slate-400 leading-relaxed">
                                        <strong className="text-slate-200 block mb-1 text-base">Approfondimenti extra</strong>
                                        Ulteriori approfondimenti scalano automaticamente dal saldo: <span className="text-emerald-300">0,5 crediti</span> ogni 3 approfondimenti.
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <div className="mt-0.5 h-6 w-6 rounded-full bg-slate-700/30 flex items-center justify-center shrink-0 border border-slate-600/30">
                                        <Shield className="h-3.5 w-3.5 text-slate-300" />
                                    </div>
                                    <div className="text-slate-400 leading-relaxed">
                                        <strong className="text-slate-200 block mb-1 text-base">Pieno controllo</strong>
                                        Il consumo è chiaro e visibile prima di ogni azione. Anche nelle analisi più complete, il consumo resta semplice e prevedibile.
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 text-center bg-slate-900/50 p-4 rounded-xl border border-slate-800/50 max-w-3xl mx-auto">
                        <div className="flex items-start justify-center gap-2 text-xs text-slate-500">
                            <Info className="h-4 w-4 shrink-0 mt-0.5" />
                            <p className="text-left">
                                <strong>Nota sul passaggio di livello:</strong> È possibile acquistare solo pacchetti di livello pari o superiore al proprio livello attivo (determinato dai crediti residui interi).
                                I crediti si sommano sempre. I crediti frazionari non bloccano l'acquisto.
                            </p>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};
