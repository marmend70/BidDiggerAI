import { exportToDocx } from '@/lib/exportUtils';
import type { AnalysisResult } from '@/types';
import {
    LayoutDashboard,
    FileText,
    Calendar,
    DollarSign,
    Clock,
    ScrollText,
    Scale,
    PieChart,
    AlertTriangle,
    CheckSquare,
    ListTodo,
    CreditCard,
    Gavel,
    Info,
    Download
} from 'lucide-react';

const SECTIONS = [
    { id: '1_requisiti_partecipazione', label: 'Requisiti Partecipazione', icon: FileText },
    { id: '3_sintesi', label: 'Sintesi Gara', icon: LayoutDashboard },
    { id: '4_servizi', label: 'Dettaglio Servizi', icon: ListTodo },
    { id: '5_scadenze', label: 'Timeline Scadenze', icon: Calendar },
    { id: '6_importi', label: 'Quadro Economico', icon: DollarSign },
    { id: '7_durata', label: 'Durata e Tempistiche', icon: Clock },
    { id: '8_ccnl', label: 'CCNL e Contratti', icon: ScrollText },
    { id: '9_oneri', label: 'Oneri e Costi', icon: Scale },
    { id: '10_punteggi', label: 'Criteri e Punteggi', icon: PieChart },
    { id: '11_pena_esclusione', label: 'Pena Esclusione', icon: AlertTriangle },
    { id: '12_offerta_tecnica', label: 'Offerta Tecnica', icon: CheckSquare },
    { id: '13_offerta_economica', label: 'Offerta Economica', icon: CheckSquare },
    { id: '14_note_importanti', label: 'Note Importanti', icon: Info },
    { id: '15_remunerazione', label: 'Remunerazione', icon: CreditCard },
    { id: '16_sla_penali', label: 'SLA e Penali', icon: Gavel },
];

interface LayoutProps {
    children: React.ReactNode;
    activeSection?: string;
    onSectionClick?: (id: string) => void;
    data?: AnalysisResult | null;
}

export function Layout({ children, activeSection, onSectionClick, data }: LayoutProps) {
    const handleExport = async () => {
        if (!data) return;
        try {
            await exportToDocx(data);
        } catch (error) {
            console.error("Export failed:", error);
            alert("Errore durante l'esportazione del documento.");
        }
    };

    return (
        <div className="flex h-screen bg-slate-50">
            {/* Sidebar */}
            <aside className="w-64 bg-slate-900 text-white flex-shrink-0 overflow-y-auto flex flex-col">
                <div className="p-6">
                    <h1 className="text-2xl font-bold tracking-tight text-amber-500 flex items-center gap-2">
                        <img src="/logo.png" alt="Bid Digger Logo" className="h-8 w-8 object-contain" />
                        Bid Digger AI
                    </h1>
                    <p className="text-xs text-slate-400 mt-1">AI Tender Analysis</p>
                </div>
                <nav className="px-4 pb-6 space-y-1 flex-1">
                    {SECTIONS.map((section) => {
                        const Icon = section.icon;
                        const isActive = activeSection === section.id;
                        return (
                            <button
                                key={section.id}
                                onClick={() => onSectionClick?.(section.id)}
                                className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors ${isActive
                                    ? 'bg-amber-500 text-slate-900'
                                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                    }`}
                            >
                                <Icon className="h-4 w-4" />
                                {section.label}
                            </button>
                        );
                    })}
                </nav>

                {/* Export Button Footer */}
                <div className="p-4 border-t border-slate-800">
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
