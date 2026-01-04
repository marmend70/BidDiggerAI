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
    X,
    Bot,
    Zap,
    BookOpen,
    Building
} from 'lucide-react';
import { Footer } from './Footer';
import { GuideModal } from './GuideModal';
import { WorkspaceSwitcher, type Organization } from './WorkspaceSwitcher';
import logo from '../assets/logo-final.png';
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
    onOpenContact?: () => void;
    onOpenChatAssistant?: () => void;
    userRole?: string;
    orgRole?: string | null;
    // Switcher Props
    myOrganizations?: Organization[];
    currentOrgId?: string | null;
    onWorkspaceSwitch?: (id: string | null) => void;
    onAcceptInvite?: (orgId: string, e: React.MouseEvent) => void; // Added
    onRejectInvite?: (orgId: string, e: React.MouseEvent) => void; // Added
    userPlan?: string;
    onStopAnalysis?: () => void;
    isStopRequested?: boolean;
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
    onOpenChatAssistant?: () => void;
    userRole?: string;
    orgRole?: string | null;
    onOpenGuide: () => void;
    // Switcher Props
    myOrganizations?: Organization[];
    currentOrgId?: string | null;
    onWorkspaceSwitch?: (id: string | null) => void;
    onAcceptInvite?: (orgId: string, e: React.MouseEvent) => void; // Added
    onRejectInvite?: (orgId: string, e: React.MouseEvent) => void; // Added
    userPlan?: string;
    onStopAnalysis?: () => void;
    isStopRequested?: boolean;
}

function SidebarContent({ activeSection, onSectionClick, data, userPreferences, isAnalyzing, loadingBatches = [], onExport, onNewAnalysis, onOpenChatAssistant, userRole, orgRole, onOpenGuide, myOrganizations, currentOrgId, onWorkspaceSwitch, onAcceptInvite, onRejectInvite, userPlan, onStopAnalysis, isStopRequested }: SidebarContentProps) {
    return (
        <div className="flex flex-col h-full text-white">
            <div className="p-6 bg-slate-950 shadow-sm z-10 space-y-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-amber-500 flex items-center gap-2">
                        <img src={logo} alt="Bid Digger Logo" className="h-8 w-8 object-contain" />
                        Bid Digger AI
                    </h1>
                    <p className="text-xs text-slate-400 mt-1">AI Tender Analysis</p>
                </div>

                {/* WORKSPACE SWITCHER */}
                {myOrganizations && onWorkspaceSwitch && (
                    <WorkspaceSwitcher
                        organizations={myOrganizations}
                        currentOrgId={currentOrgId || null}
                        onSwitch={onWorkspaceSwitch}
                        onAcceptInvite={onAcceptInvite} // Passed
                        onRejectInvite={onRejectInvite} // Passed
                    />
                )}
            </div>
            <nav className="px-4 pb-6 space-y-1 flex-1 overflow-y-auto bg-slate-900 pt-4">
                {MENU_ORDER.map((sectionId, index) => {
                    const section = SECTIONS_MAP[sectionId];
                    if (!section) return null;

                    const Icon = section.icon;
                    const isActive = activeSection === sectionId;
                    const isSpecial = section.isSpecial;
                    const isSnapshot = section.isSnapshot;
                    const isEnabled = userPreferences?.analysis_sections?.[sectionId] !== false;

                    // Check if this section is currently loading
                    const batch = SECTION_BATCH_MAP[sectionId];
                    const isLoading = batch && loadingBatches.includes(batch);

                    // Check if data is available for this section
                    // Special case for Snapshot: it explicitly depends on other data but doesn't have its own key, 
                    // so we consider it "hasData" if we have at least partial data (e.g. 3_sintesi) 
                    // OR simply enable it if overall data is present.
                    const hasData = isSnapshot
                        ? (data && (data['3_sintesi'] || data['6_importi']))
                        : (sectionId === 'faq'
                            ? (data && data['3_sintesi']) // FAQ: Enabled if core data (Sintesi) is present
                            : (data && data[sectionId as keyof AnalysisResult])
                        );

                    // Disable logic:
                    // For Snapshot (isSnapshot), we explicitly force disabled if isAnalyzing is true (user request: active ONLY at end of analysis).
                    const isDisabled = isSnapshot
                        ? (isAnalyzing || !hasData) // Snapshot: Disabled if analyzing OR no data
                        : (isAnalyzing
                            ? (!hasData || (isLoading && isEnabled) || sectionId === 'faq') // Analyzing: standard restrict logic
                            : !hasData // Not analyzing: Enabled ONLY if hasData (ignores userPreferences for view mode)
                        );

                    // Determine if we need a header
                    let header: string | null = null;
                    const prevBatch = index > 0 ? SECTION_BATCH_MAP[MENU_ORDER[index - 1]] : null;

                    if (batch && batch !== prevBatch) {
                        if (batch === 'batch_1') header = "1. Sintesi e analisi amministrativa";
                        else if (batch === 'batch_2') header = "2. Servizi";
                        else if (batch === 'batch_3') header = "3. Offerta";
                        else if (batch === 'batch_4') header = "4. Extra";
                    }

                    // Style logic
                    let buttonClass = `w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md transition-colors `;

                    if (isSnapshot) {
                        buttonClass += isActive
                            ? 'bg-gradient-to-r from-yellow-500 to-amber-600 text-white shadow-lg shadow-amber-900/20 '
                            : 'text-yellow-400 bg-yellow-500/10 hover:bg-yellow-500/20 hover:text-yellow-300 border border-yellow-500/20 mb-6 ';
                    } else if (isSpecial) {
                        buttonClass += isActive
                            ? 'bg-purple-600 text-white shadow-md '
                            : 'text-purple-300 hover:bg-purple-900/30 hover:text-purple-100 mt-4 border border-purple-900/50 ';
                    } else {
                        buttonClass += isActive
                            ? 'bg-amber-500 text-slate-900 '
                            : 'text-white hover:bg-slate-800 ';
                    }

                    // Visual Grayout: Always apply if disabled in prefs, regardless of data presence.
                    // This satisfies "evidenzi sul menu le sezioni selezionate... e lasci in grigino quelle non selezionate"
                    if (!isEnabled) {
                        buttonClass += 'opacity-50 grayscale ';
                    }

                    // If it is disabled (e.g. no data), we DO NOT add opacity if it is enabled.
                    // We only add cursor-not-allowed.
                    // This ensures "white" text for selected sections even if analysis isn't ready.
                    buttonClass += (isDisabled ? 'cursor-not-allowed ' : '');


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
                                className={buttonClass}
                            >
                                <div className="flex items-center gap-3">
                                    <Icon className={`h-4 w-4 ${!isActive && isSnapshot ? 'text-yellow-500' : (!isActive && isSpecial ? 'text-purple-400' : '')}`} />
                                    {section.label}
                                </div>
                                {isLoading && isEnabled && (
                                    <Loader2 className="h-4 w-4 animate-spin text-current opacity-70" />
                                )}
                                {!isLoading && hasData && !isSnapshot && (
                                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                                )}
                                {!isLoading && hasData && isSnapshot && (
                                    <Zap className={`h-3.5 w-3.5 ${isActive ? 'text-white' : 'text-yellow-500'}`} />
                                )}
                            </button>
                        </React.Fragment>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-slate-800 space-y-2 bg-slate-950 z-10">
                <button
                    onClick={onOpenGuide}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-amber-500 rounded-md hover:bg-slate-800 hover:text-amber-400 border border-amber-500/20 bg-amber-500/5 mb-2"
                >
                    <BookOpen className="h-4 w-4" />
                    Guida & FAQ
                </button>

                <button
                    onClick={() => !isAnalyzing && onSectionClick?.('configurazioni')}
                    disabled={isAnalyzing}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors border ${isAnalyzing
                        ? 'opacity-50 cursor-not-allowed text-slate-500 border-slate-800'
                        : activeSection === 'configurazioni'
                            ? 'bg-amber-500 text-slate-900 border-amber-500' // Active state
                            : 'text-amber-500 hover:bg-slate-800 hover:text-amber-400 border-amber-500/20 bg-amber-500/5' // Default state (Assistant style)
                        }`}
                >
                    <Settings className="h-4 w-4" />
                    Configurazioni
                </button>

                <button
                    onClick={() => !isAnalyzing && onSectionClick?.('archivio')}
                    disabled={isAnalyzing}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors border ${isAnalyzing
                        ? 'opacity-50 cursor-not-allowed text-slate-500 border-slate-800'
                        : activeSection === 'archivio'
                            ? 'bg-amber-500 text-slate-900 border-amber-500' // Active state
                            : 'text-amber-500 hover:bg-slate-800 hover:text-amber-400 border-amber-500/20 bg-amber-500/5' // Default state (Assistant style)
                        }`}
                >
                    <Archive className="h-4 w-4" />
                    Bid Digger Dashboard
                </button>


                <button
                    onClick={onOpenChatAssistant}
                    disabled={!data || isAnalyzing}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-amber-500 rounded-md hover:bg-slate-800 hover:text-amber-400 disabled:opacity-50 disabled:cursor-not-allowed border border-amber-500/20 bg-amber-500/5"
                >
                    <Bot className="h-4 w-4" />
                    Bid Digger Assistant
                </button>

                <button
                    onClick={onExport}
                    disabled={!data}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-amber-500 rounded-md hover:bg-slate-800 hover:text-amber-400 disabled:opacity-50 disabled:cursor-not-allowed border border-amber-500/20 bg-amber-500/5"
                >
                    <Download className="h-4 w-4" />
                    Esporta report DOCX
                </button>

                <button
                    onClick={onNewAnalysis}
                    disabled={isAnalyzing}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-amber-500 rounded-md hover:bg-slate-800 hover:text-amber-400 disabled:opacity-50 disabled:cursor-not-allowed border border-amber-500/20 bg-amber-500/5"
                >
                    <FilePlus className="h-4 w-4" />
                    Nuova Analisi
                </button>

                {/* STOP ANALYSIS BUTTON */}
                {isAnalyzing && (
                    <button
                        onClick={onStopAnalysis}
                        disabled={isStopRequested}
                        className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors mt-2 mb-2 border ${isStopRequested
                            ? 'bg-red-500/10 text-red-500/50 border-red-500/20 cursor-not-allowed'
                            : 'bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30 hover:text-red-300'
                            }`}
                    >
                        {isStopRequested ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <div className="h-4 w-4 rounded-sm bg-current flex items-center justify-center p-[2px]">
                                {/* Square Icon */}
                            </div>
                        )}
                        {isStopRequested ? 'Interruzione...' : 'Ferma Analisi'}
                    </button>
                )}

                {/* Workspace Button - Visible to Team Members, Owners, Admins, System Admins OR Premium Plans */}
                {((orgRole === 'owner' || orgRole === 'admin' || orgRole === 'member') ||
                    userRole?.toLowerCase() === 'admin' ||
                    (userPlan?.includes('agency') || userPlan?.includes('pro') || userPlan?.includes('trial'))) && (
                        <button
                            onClick={() => !isAnalyzing && onSectionClick?.('team')}
                            disabled={isAnalyzing}
                            className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors my-2 ${activeSection === 'team'
                                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.15)]'
                                : 'text-blue-400/80 hover:text-blue-300 hover:bg-blue-500/10 border border-transparent'
                                }`}
                        >
                            <Building className={`h-4 w-4 transition-transform duration-300 group-hover:scale-110 ${activeSection === 'team' ? 'text-blue-400' : 'text-blue-400/80 group-hover:text-blue-300'}`} />
                            <span className="font-medium">Bid Digger Workspace</span>
                        </button>
                    )}

                <button
                    onClick={async () => {
                        try {
                            const { supabase } = await import('@/lib/supabase');
                            await supabase.auth.signOut();
                        } catch (e) {
                            console.error("Logout error:", e);
                        } finally {
                            localStorage.clear(); // Ensure clean state
                            window.location.href = '/'; // Force navigation to root
                        }
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-300 rounded-md hover:bg-slate-800 hover:text-white border border-transparent"
                >
                    Esci
                </button>

                {/* DEBUG: Role is {userRole} */}
                {userRole?.toLowerCase() === 'admin' && (
                    <button
                        onClick={() => { console.log("Navigating to admin"); window.location.href = '/admin'; }}
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-red-400 rounded-md hover:bg-slate-800 hover:text-red-300 border border-transparent mt-4"
                    >
                        <Settings className="h-4 w-4" />
                        Amministrazione
                    </button>
                )}
            </div>
        </div>
    );
}

export function Layout(props: LayoutProps) {
    const { children, activeSection, onSectionClick, data, userPreferences, isAnalyzing, loadingBatches = [], onOpenContact, onOpenChatAssistant, userRole, userPlan, onStopAnalysis, isStopRequested } = props;
    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
    const [isGuideOpen, setIsGuideOpen] = React.useState(false); // NEW STATE

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
        <div className="flex h-[100dvh] bg-slate-950 overflow-hidden flex-col md:flex-row">
            {/* GUIDE MODAL */}
            <GuideModal isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />

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
                    onOpenChatAssistant={onOpenChatAssistant}
                    userRole={userRole}
                    orgRole={props.orgRole}
                    onOpenGuide={() => setIsGuideOpen(true)} // PASS HANDLER
                    myOrganizations={props.myOrganizations}
                    currentOrgId={props.currentOrgId}
                    onWorkspaceSwitch={props.onWorkspaceSwitch}
                    onAcceptInvite={props.onAcceptInvite} // Passed
                    onRejectInvite={props.onRejectInvite} // Passed
                    userPlan={userPlan}
                    onStopAnalysis={onStopAnalysis}
                    isStopRequested={isStopRequested}
                />
            </aside>

            {/* Mobile Header */}
            <div className="md:hidden h-16 bg-slate-900 flex items-center justify-between px-4 flex-shrink-0 z-20">
                <div className="flex items-center gap-2">
                    <img src={logo} alt="Bid Digger Logo" className="h-8 w-8 object-contain" />
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
                            onOpenChatAssistant={() => {
                                onOpenChatAssistant?.();
                                setIsMobileMenuOpen(false);
                            }}
                            userRole={userRole}
                            orgRole={props.orgRole}
                            onOpenGuide={() => {
                                setIsGuideOpen(true);
                                setIsMobileMenuOpen(false);
                            }}
                            myOrganizations={props.myOrganizations}
                            currentOrgId={props.currentOrgId}
                            onWorkspaceSwitch={props.onWorkspaceSwitch}
                            onAcceptInvite={props.onAcceptInvite} // Passed
                            onRejectInvite={props.onRejectInvite} // Passed
                            userPlan={userPlan}
                            onStopAnalysis={onStopAnalysis}
                            isStopRequested={isStopRequested}
                        />
                    </div>
                </div>
            )}

            {/* Main Content */}
            <main className="flex-1 overflow-auto min-w-0 relative z-10 flex flex-col">
                <div className="flex-1 p-4 md:p-6">
                    {children}
                </div>
                <Footer onOpenContact={onOpenContact} />
            </main>
        </div>
    );
}
