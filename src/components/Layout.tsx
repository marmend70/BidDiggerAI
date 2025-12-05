import React from 'react';
import { exportToDocx } from '@/lib/exportUtils';
import type { AnalysisResult, UserPreferences } from '@/types';
import {
    Download,
    Settings,
    Archive,
    Loader2,
    CheckCircle2,
    FilePlus,
    Menu,
    X
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
    onNewAnalysis?: () => void;
}

interface SidebarContentProps {
    activeSection?: string;
    onSectionClick?: (id: string) => void;
    data?: AnalysisResult | null;
    userPreferences?: UserPreferences;
    isAnalyzing?: boolean;
    loadingBatches?: string[];
    onExport: () => void;
    onNewAnalysis?: () => void;
}

function SidebarContent({ activeSection, onSectionClick, data, userPreferences, isAnalyzing, loadingBatches = [], onExport, onNewAnalysis }: SidebarContentProps) {
    return (
        <div className="flex flex-col h-full text-white">
            <div className="p-6">
                <h1 className="text-2xl font-bold tracking-tight text-amber-500 flex items-center gap-2">
                    <img src="/logo.png" alt="Bid Digger Logo" className="h-8 w-8 object-contain" />
                    Bid Digger AI
                </h1>
                <p className="text-xs text-slate-400 mt-1">AI Tender Analysis</p>
            </div>
            <nav className="px-4 pb-6 space-y-1 flex-1 overflow-y-auto">
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
                                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                                )}
                            </button>
                        </React.Fragment>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-slate-800 space-y-2">
                <button
                    onClick={() => !isAnalyzing && onSectionClick?.('configurazioni')}
                    disabled={isAnalyzing}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors border border-slate-700 ${isAnalyzing
                        ? 'opacity-50 cursor-not-allowed text-slate-500 border-slate-800'
                        : activeSection === 'configurazioni'
                            ? 'bg-slate-700 text-white'
                            : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                        }`}
                >
                    <Settings className="h-4 w-4" />
                    Configurazioni
                </button>

                <button
                    onClick={() => !isAnalyzing && onSectionClick?.('archivio')}
                    disabled={isAnalyzing}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors border border-slate-700 ${isAnalyzing
                        ? 'opacity-50 cursor-not-allowed text-slate-500 border-slate-800'
                        : activeSection === 'archivio'
                            ? 'bg-slate-700 text-white'
                            : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                        }`}
                >
                    <Archive className="h-4 w-4" />
                    Archivio
                </button>

                <button
                    onClick={onExport}
                    disabled={!data}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-300 rounded-md hover:bg-slate-800 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed border border-transparent"
                >
                    <Download className="h-4 w-4" />
                    Esporta DOCX
                </button>

                <button
                    onClick={onNewAnalysis}
                    disabled={!data}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-300 rounded-md hover:bg-slate-800 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed border border-transparent"
                >
                    <FilePlus className="h-4 w-4" />
                    Nuova Analisi
                </button>

                <button
                    onClick={async () => {
                        await import('@/lib/supabase').then(m => m.supabase.auth.signOut());
                        window.location.reload();
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-300 rounded-md hover:bg-slate-800 hover:text-white border border-transparent"
                >
                    Esci
                </button>
            </div>
        </div>
    );
}

export function Layout(props: LayoutProps) {
    const { children, activeSection, onSectionClick, data, userPreferences, isAnalyzing, loadingBatches = [] } = props;
    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

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
        <div className="flex h-screen bg-slate-50 overflow-hidden flex-col md:flex-row">
            {/* Desktop Sidebar */}
            <aside className="hidden md:flex w-80 bg-slate-900 flex-shrink-0 flex-col h-full overflow-hidden">
                <SidebarContent
                    activeSection={activeSection}
                    onSectionClick={onSectionClick}
                    data={data}
                    userPreferences={userPreferences}
                    isAnalyzing={isAnalyzing}
                    loadingBatches={loadingBatches}
                    onExport={handleExport}
                    onNewAnalysis={props.onNewAnalysis}
                />
            </aside>

            {/* Mobile Header */}
            <div className="md:hidden h-16 bg-slate-900 flex items-center justify-between px-4 flex-shrink-0 z-20">
                <div className="flex items-center gap-2">
                    <img src="/logo.png" alt="Bid Digger Logo" className="h-8 w-8 object-contain" />
                    <span className="text-white font-bold text-lg">Bid Digger AI</span>
                </div>
                <button
                    onClick={() => setIsMobileMenuOpen(true)}
                    className="text-white p-2"
                >
                    <Menu className="h-6 w-6" />
                </button>
            </div>

            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-50 md:hidden">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={() => setIsMobileMenuOpen(false)}
                    />

                    {/* Drawer */}
                    <div className="absolute inset-y-0 left-0 w-80 bg-slate-900 shadow-xl flex flex-col">
                        <div className="absolute top-4 right-4 z-50">
                            <button
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="text-slate-400 hover:text-white p-1"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>
                        <SidebarContent
                            activeSection={activeSection}
                            onSectionClick={(id) => {
                                onSectionClick?.(id);
                                setIsMobileMenuOpen(false);
                            }}
                            data={data}
                            userPreferences={userPreferences}
                            isAnalyzing={isAnalyzing}
                            loadingBatches={loadingBatches}
                            onExport={handleExport}
                            onNewAnalysis={() => {
                                props.onNewAnalysis?.();
                                setIsMobileMenuOpen(false);
                            }}
                        />
                    </div>
                </div>
            )}

            {/* Main Content */}
            <main className="flex-1 overflow-auto min-w-0 p-4 md:p-6 relative z-10">
                <div className="h-full">
                    {children}
                </div>
            </main>
        </div>
    );
}
