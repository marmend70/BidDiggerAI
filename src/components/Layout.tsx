import React from 'react';
import { exportToDocx } from '@/lib/exportUtils';
import type { AnalysisResult, UserPreferences } from '@/types';
import {
    Download,
    Settings,
    Archive,
    Loader2,
    CheckCircle2
} from 'lucide-react';
import { SECTIONS_MAP, MENU_ORDER, SECTION_BATCH_MAP } from '@/constants';

interface LayoutProps {
    children: React.ReactNode;
    activeSection?: string;
    onSectionClick?: (id: string) => void;
    data?: AnalysisResult | null;
    userPreferences?: UserPreferences;
    isAnalyzing?: boolean;
    loadingBatches?: string[];
}

export function Layout({ children, activeSection, onSectionClick, data, userPreferences, isAnalyzing, loadingBatches = [] }: LayoutProps) {
    const handleExport = async () => {
        if (!data) return;
        try {
            await exportToDocx(data, userPreferences?.export_sections);
        } catch (error) {
            console.error("Export failed:", error);
            alert("Errore durante l'esportazione del documento.");
        }
    };

    return (
        <div className="flex h-screen bg-slate-50">
            {/* Sidebar */}
            <aside className="w-80 bg-slate-900 text-white flex-shrink-0 overflow-y-auto flex flex-col">
                <div className="p-6">
                    <h1 className="text-2xl font-bold tracking-tight text-amber-500 flex items-center gap-2">
                        <img src="/logo.png" alt="Bid Digger Logo" className="h-8 w-8 object-contain" />
                        Bid Digger AI
                    </h1>
                    <p className="text-xs text-slate-400 mt-1">AI Tender Analysis</p>
                </div>
                <nav className="px-4 pb-6 space-y-1 flex-1">
                    {MENU_ORDER.map((sectionId, index) => {
                        const section = SECTIONS_MAP[sectionId];
                        if (!section) return null;

                        const Icon = section.icon;
                        const isActive = activeSection === sectionId;
                        const isSpecial = section.isSpecial;
                        const isEnabled = userPreferences?.analysis_sections?.[sectionId] !== false;

                        // Check if this section is currently loading
                        const batch = SECTION_BATCH_MAP[sectionId];
                        const isLoading = batch && loadingBatches.includes(batch);

                        // Check if data is available for this section
                        const hasData = data && data[sectionId as keyof AnalysisResult];

                        // Disable logic:
                        const isDisabled = isAnalyzing && (!hasData || isLoading || sectionId === 'faq');

                        // Determine if we need a header
                        let header: string | null = null;
                        const prevBatch = index > 0 ? SECTION_BATCH_MAP[MENU_ORDER[index - 1]] : null;

                        if (batch && batch !== prevBatch) {
                            if (batch === 'batch_1') header = "1. Sintesi e analisi amministrativa";
                            else if (batch === 'batch_2') header = "2. Servizi";
                            else if (batch === 'batch_3') header = "3. Offerta";
                            else if (batch === 'batch_4') header = "4. Extra";
                        }

                        return (
                            <React.Fragment key={sectionId}>
                                {header && (
                                    <div className="px-3 mt-6 mb-2">
                                        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                            {header}
                                        </h3>
                                    </div>
                                )}
                                <button
                                    onClick={() => onSectionClick?.(sectionId)}
                                    disabled={isDisabled}
                                    className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md transition-colors ${isActive
                                        ? isSpecial ? 'bg-purple-600 text-white shadow-md' : 'bg-amber-500 text-slate-900'
                                        : isSpecial ? 'text-purple-300 hover:bg-purple-900/30 hover:text-purple-100 mt-4 border border-purple-900/50' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                        } ${isSpecial && !isActive ? 'mt-6' : ''} ${!isEnabled ? 'opacity-50 grayscale' : ''} ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <Icon className={`h-4 w-4 ${isSpecial && !isActive ? 'text-purple-400' : ''}`} />
                                        {section.label}
                                    </div>
                                    {isLoading && (
                                        <Loader2 className="h-4 w-4 animate-spin text-current opacity-70" />
                                    )}
                                    {!isLoading && hasData && (
                                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                                    )}
                                </button>
                            </React.Fragment>
                        );
                    })}

                    {/* Configuration Section */}
                    <button
                        onClick={() => !isAnalyzing && onSectionClick?.('configurazioni')}
                        disabled={isAnalyzing}
                        className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors mt-6 border border-slate-700 ${isAnalyzing
                            ? 'opacity-50 cursor-not-allowed text-slate-500 border-slate-800'
                            : activeSection === 'configurazioni'
                                ? 'bg-slate-700 text-white'
                                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                            }`}
                    >
                        <Settings className="h-4 w-4" />
                        Configurazioni
                    </button>

                    {/* Archive Section */}
                    <button
                        onClick={() => !isAnalyzing && onSectionClick?.('archivio')}
                        disabled={isAnalyzing}
                        className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors mt-2 border border-slate-700 ${isAnalyzing
                            ? 'opacity-50 cursor-not-allowed text-slate-500 border-slate-800'
                            : activeSection === 'archivio'
                                ? 'bg-slate-700 text-white'
                                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                            }`}
                    >
                        <Archive className="h-4 w-4" />
                        Archivio
                    </button>
                </nav>

                {/* Footer Actions */}
                <div className="p-4 border-t border-slate-800 space-y-3">
                    <button
                        onClick={handleExport}
                        disabled={!data}
                        className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-md font-medium transition-all ${data
                            ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-blue-900/20'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                            }`}
                    >
                        <Download className="h-4 w-4" />
                        Esporta DOCX
                    </button>

                    <button
                        onClick={async () => {
                            await import('@/lib/supabase').then(m => m.supabase.auth.signOut());
                            window.location.reload();
                        }}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-md font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors text-sm"
                    >
                        Esci
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto p-8">
                <div className="max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
