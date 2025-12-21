import React from 'react';
import { Calendar, User, MoreVertical, FileText, Trash2, Download, AlertCircle, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AnalysisResult } from '@/types';

interface TenderListItemProps {
    item: {
        id: string;
        tender_id: string;
        created_at: string;
        numericId: number;
        title: string;
        cig?: string;
        ente?: string;
        object?: string; // NEW PROP
        deadline: string | null;
        deadlineQuesiti?: string | null; // NEW PROP
        status: string;
        status_updated_at?: string;
        owners: {
            tech?: string;
            admin?: string;
            comm?: string;
        };
        notes?: string;
        result_json: AnalysisResult;
    };
    onOpen: (data: AnalysisResult) => void;
    onDelete: (e: React.MouseEvent, id: string) => void;
    onExport: (e: React.MouseEvent, data: AnalysisResult) => void;
    onUpdateStatus: (id: string, status: string) => void;
    onUpdateOwner: (id: string, type: 'owner_tech' | 'owner_admin' | 'owner_comm', value: string) => void;
    onUpdateNotes: (id: string, notes: string) => void;
    userPreferences?: any;
    isAssigning?: boolean;
}

export function TenderListItem({
    item,
    onOpen,
    onDelete,
    onExport,
    onUpdateStatus,
    onUpdateOwner,
    onUpdateNotes,
    userPreferences
}: TenderListItemProps) {
    // --- 1. STATUS LOGIC ---
    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'Decisa: Go': return 'bg-green-950/30 text-green-400 border-green-900/50';
            case 'Decisa: No Go': return 'bg-red-950/30 text-red-400 border-red-900/50';
            case 'Assegnata': return 'bg-blue-950/30 text-blue-400 border-blue-900/50';
            case 'Presentata': return 'bg-slate-800 text-slate-400 border-slate-700';
            case 'In valutazione': default: return 'bg-amber-950/30 text-amber-500 border-amber-900/50';
        }
    };

    const getStatusDot = (status: string) => {
        switch (status) {
            case 'Decisa: Go': return 'bg-green-500';
            case 'Decisa: No Go': return 'bg-red-500';
            case 'Assegnata': return 'bg-blue-500';
            case 'Presentata': return 'bg-slate-400';
            case 'In valutazione': default: return 'bg-amber-500';
        }
    };

    // --- 2. TIMELINE LOGIC ---
    let progress = 0;
    let daysRemaining: number | null = null;
    let daysRemainingQuesiti: number | null = null;
    let deadlineDate: Date | null = null;
    let deadlineQuesitiDate: Date | null = null;

    const parseDate = (d: string) => {
        const parts = d.split(/[\/\-]/);
        if (parts.length === 3) {
            if (parts[2].length === 4) return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
            return new Date(d);
        }
        return new Date(d);
    };

    if (item.deadline) {
        deadlineDate = parseDate(item.deadline);
        if (deadlineDate && !isNaN(deadlineDate.getTime())) {
            const now = new Date();
            const created = new Date(item.created_at);
            const totalDuration = deadlineDate.getTime() - created.getTime();
            const elapsed = now.getTime() - created.getTime();
            const diffTime = deadlineDate.getTime() - now.getTime();
            daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (totalDuration > 0) progress = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
            else progress = 100;
        }
    }

    if (item.deadlineQuesiti) {
        deadlineQuesitiDate = parseDate(item.deadlineQuesiti);
        if (deadlineQuesitiDate && !isNaN(deadlineQuesitiDate.getTime())) {
            const now = new Date();
            const diffTime = deadlineQuesitiDate.getTime() - now.getTime();
            daysRemainingQuesiti = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }
    }

    const getProgressColor = () => {
        if (daysRemaining === null) return 'bg-slate-500';
        if (daysRemaining < 10) return 'bg-red-500'; // Includes expired
        if (daysRemaining <= 20) return 'bg-yellow-500'; // 10 to 20
        return 'bg-green-500'; // > 20
    };

    // --- 3. HELPER FOR OWNERS ---
    const getInitials = (name: string) => {
        const parts = name.trim().split(/\s+/);
        if (parts.length === 1) {
            return parts[0].substring(0, 3).toUpperCase();
        }
        return parts.map(p => p[0]).join('').substring(0, 3).toUpperCase();
    };

    const renderOwnerCircle = (type: 'owner_comm' | 'owner_tech' | 'owner_admin', label: string, colorClass: string) => {
        const mapKey = type === 'owner_comm' ? 'comm' : type === 'owner_tech' ? 'tech' : 'admin';
        const ownerName = item.owners[mapKey as keyof typeof item.owners];
        const initials = ownerName ? getInitials(ownerName) : null;

        // Disable assignment if status is NOT 'Assegnata'
        const isLocked = item.status !== 'Assegnata';

        return (
            <div className={cn("flex flex-col items-center gap-1", isLocked && "opacity-40 grayscale")}>
                <div
                    className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all relative group",
                        ownerName ? `${colorClass} text-white` : "border-2 border-dashed border-slate-700 text-slate-600 bg-transparent",
                        !isLocked && !ownerName && "hover:border-slate-500 hover:text-slate-400 cursor-pointer",
                        !isLocked && ownerName && "cursor-pointer"
                    )}
                    title={isLocked ? "Stato non 'Assegnata' - Modifica stato per assegnare" : (ownerName || `Assegna ${label}`)}
                    onClick={(e) => e.stopPropagation()}
                >
                    {initials || <Plus className="w-4 h-4" />}

                    {!isLocked && (
                        <select
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                            value={ownerName || ''}
                            onChange={(e) => onUpdateOwner(item.tender_id, type, e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <option value="">-- Assegna --</option>
                            {
                                type === 'owner_tech' ? userPreferences?.owners_tech?.map((o: string) => <option key={o} value={o}>{o}</option>) :
                                    type === 'owner_admin' ? userPreferences?.owners_admin?.map((o: string) => <option key={o} value={o}>{o}</option>) :
                                        userPreferences?.owners_comm?.map((o: string) => <option key={o} value={o}>{o}</option>)
                            }
                        </select>
                    )}
                </div>
                <span className="text-[10px] font-bold text-slate-500 uppercase">{label}</span>
            </div>
        );
    };

    // History Logic
    const history = (item.result_json as any).status_history as Array<{ status: string; date: string }>;

    // --- 4. NOTES LOGIC ---
    const [localNotes, setLocalNotes] = React.useState(item.notes || '');

    // Sync if item prop updates externally
    React.useEffect(() => {
        setLocalNotes(item.notes || '');
    }, [item.notes]);

    const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value;
        if (val.length <= 300) {
            setLocalNotes(val);
        }
    };

    const handleNotesBlur = () => {
        // Only trigger update if changed
        if (localNotes !== (item.notes || '')) {
            onUpdateNotes(item.tender_id, localNotes);
        }
    };

    return (
        <div
            onClick={(e) => {
                // Prevent opening if clicking on interactive elements
                const target = e.target as HTMLElement;
                if (target.tagName === 'TEXTAREA' || target.closest('.interactive-area')) return;
                onOpen(item.result_json);
            }}
            /* UPDATED GRID COLS to include NOTES */
            className="group grid grid-cols-[1.1fr,1.3fr,1.8fr,1.5fr,1.3fr,1.3fr] gap-3 p-4 border-b border-slate-800/50 hover:bg-slate-800/30 transition-all items-start last:border-0 relative"
        >
            {/* COLUMN 1: STATO */}
            <div onClick={(e) => e.stopPropagation()} className="flex flex-col items-center gap-2 interactive-area pt-1">
                <div className="relative inline-block w-full group/status">
                    <div className={cn(
                        "flex items-center justify-center gap-2 px-3 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-wide transition-colors cursor-pointer hover:opacity-80 w-full",
                        getStatusStyle(item.status)
                    )} title="Clicca per modificare lo stato">
                        <div className={cn("w-2 h-2 rounded-full hidden sm:block", getStatusDot(item.status))} />
                        <span className="truncate">{item.status}</span>
                        {/* Edit Icon visual cue on hover */}
                        <div className="w-3 h-3 opacity-0 group-hover/status:opacity-50 ml-1">✎</div>
                    </div>

                    {/* TOOLTIP HISTORY */}
                    <div className="absolute left-0 top-full mt-2 w-48 bg-slate-900 border border-slate-700 rounded-lg shadow-xl p-3 z-50 opacity-0 invisible group-hover/status:opacity-100 group-hover/status:visible transition-all">
                        <h4 className="text-[10px] font-bold text-slate-500 uppercase mb-2">Cronologia Stato</h4>
                        {history && history.length > 0 ? (
                            <div className="space-y-2">
                                {history.map((h, i) => (
                                    <div key={i} className="flex flex-col">
                                        <span className="text-xs font-bold text-slate-300">{h.status}</span>
                                        <span className="text-[10px] text-slate-500">{new Date(h.date).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <span className="text-xs text-slate-600 italic">Nessuna modifica recente</span>
                        )}
                    </div>

                    <select
                        value={item.status}
                        onChange={(e) => onUpdateStatus(item.tender_id, e.target.value)}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    >
                        <option value="In valutazione">In valutazione</option>
                        <option value="Decisa: Go">Decisa: Go</option>
                        <option value="Decisa: No Go">Decisa: No Go</option>
                        <option value="Assegnata">Assegnata</option>
                        <option value="Presentata">Presentata</option>
                    </select>
                </div>

                {/* Last Update Timestamp */}
                {item.status_updated_at && (
                    <span className="text-[10px] text-slate-500 whitespace-nowrap">
                        {new Date(item.status_updated_at).toLocaleDateString('it-IT', { month: '2-digit', day: '2-digit' })}
                    </span>
                )}
            </div>

            {/* COLUMN 2: ENTE / CIG */}
            <div className="flex flex-col gap-1 pt-1">
                <h3 className="text-slate-200 font-bold text-xs line-clamp-2" title={item.ente}>
                    {item.ente || "N/D"}
                </h3>
                {item.cig && (
                    <span className="text-[10px] text-slate-500 font-mono bg-slate-900/50 px-1.5 py-0.5 rounded w-fit">
                        CIG: {item.cig}
                    </span>
                )}
            </div>

            {/* COLUMN 3: OGGETTO */}
            <div className="pr-2 pt-1">
                <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed" title={item.object}>
                    {item.object || item.title}
                </p>
            </div>

            {/* COLUMN 4: NOTE (NEW) */}
            <div className="interactive-area relative">
                <textarea
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-md text-xs text-slate-300 p-2 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none transition-all placeholder:text-slate-600"
                    placeholder="Note..."
                    rows={3}
                    value={localNotes}
                    onChange={handleNotesChange}
                    onBlur={handleNotesBlur}
                    onClick={(e) => e.stopPropagation()}
                />
                <div className="absolute bottom-1 right-2 text-[9px] text-slate-600 pointer-events-none">
                    {localNotes.length}/300
                </div>
            </div>

            {/* COLUMN 5: TIMELINE */}
            <div className="pr-2 flex flex-col gap-3 pt-1">
                {/* 1. SCADENZA OFFERTA */}
                <div>
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Offerta</span>
                        <span className={cn(
                            "text-[10px] font-bold",
                            daysRemaining !== null && daysRemaining < 0 ? "text-red-400" : "text-slate-300"
                        )}>
                            {deadlineDate ? deadlineDate.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' }) : '-'}
                        </span>
                    </div>
                    {deadlineDate && (
                        <div className="w-full bg-slate-800 rounded-full h-1 mt-0.5">
                            <div
                                className={cn("h-1 rounded-full transition-all", getProgressColor())}
                                style={{ width: `${daysRemaining === null ? 100 : Math.min(100, Math.max(10, (Math.max(0, daysRemaining) / 60) * 100))}%` }}
                            />
                        </div>
                    )}
                </div>

                {/* 2. SCADENZA QUESITI */}
                {deadlineQuesitiDate && (
                    <div>
                        <div className="flex items-center justify-between mb-0.5">
                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Quesiti</span>
                            <span className={cn(
                                "text-[10px] font-medium",
                                daysRemainingQuesiti !== null && daysRemainingQuesiti < 3 ? "text-amber-500" : "text-slate-400"
                            )}>
                                {deadlineQuesitiDate.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' })}
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* COLUMN 6: RESPONSABILI & ACTIONS */}
            <div className="flex items-center justify-between interactive-area pt-1">
                <div className="flex items-center gap-2">
                    {renderOwnerCircle('owner_comm', 'COMM', 'bg-blue-600')}
                    {renderOwnerCircle('owner_tech', 'TEC', 'bg-purple-600')}
                    {renderOwnerCircle('owner_admin', 'AMM', 'bg-orange-600')}
                </div>

                <div className="flex flex-col gap-1 items-end ml-2 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={(e) => onExport(e, item.result_json)}
                        className="p-1 text-slate-500 hover:text-emerald-400 hover:bg-emerald-950/30 rounded transition-colors"
                        title="Esporta Report"
                    >
                        <Download className="w-3.5 h-3.5" />
                    </button>
                    <button
                        onClick={(e) => onDelete(e, item.tender_id)}
                        className="p-1 text-slate-500 hover:text-red-400 hover:bg-red-950/30 rounded transition-colors"
                        title="Elimina"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>
        </div>
    );
}
