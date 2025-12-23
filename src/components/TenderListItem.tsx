import React from 'react';
import { Calendar, User, MoreVertical, FileText, Trash2, Download, AlertCircle, Plus, Clock, Activity, ChevronRight, Loader2, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AnalysisResult, TenderActivity } from '@/types';
import { supabase } from '@/lib/supabase';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";

interface TenderListItemProps {
    item: {
        id: string; // analysis id (might be same as tender_id depending on view) or unique
        tender_id: string; // The Actual Tender UUID
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
    onOpen: (data: AnalysisResult, tenderId: string) => void;
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
    // --- 0. LOCAL STATE FOR CONFIRMATION & ACTIVITIES ---
    const [isAlertOpen, setIsAlertOpen] = React.useState(false);
    const [pendingStatus, setPendingStatus] = React.useState<string | null>(null);

    // Activity Tracking State
    const [latestActivity, setLatestActivity] = React.useState<TenderActivity | null>(null);
    const [activities, setActivities] = React.useState<TenderActivity[]>([]);
    const [isLoadingActivities, setIsLoadingActivities] = React.useState(false);
    const [isActivitySheetOpen, setIsActivitySheetOpen] = React.useState(false);

    // --- 0.1 FETCH LATEST ACTIVITY ON MOUNT ---
    React.useEffect(() => {
        let isMounted = true;
        const fetchLatest = async () => {
            try {
                const { data, error } = await supabase
                    .from('tender_activities')
                    .select('*')
                    .eq('tender_id', item.tender_id)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .single();

                if (data && isMounted) {
                    setLatestActivity(data as TenderActivity);
                }
            } catch (error) {
                // Silent catch for latest activity to avoid spam
                // console.warn('Error fetching latest activity:', error);
            }
        };

        if (item.tender_id) {
            // fetchLatest - Enhanced to fetch profile email
            const fetchLatestEnhanced = async () => {
                try {
                    const { data, error } = await supabase
                        .from('tender_activities')
                        .select('*')
                        .eq('tender_id', item.tender_id)
                        .order('created_at', { ascending: false })
                        .limit(1)
                        .single();

                    if (data && isMounted) {
                        // Fetch email
                        let email = '';
                        const { data: profile } = await supabase.from('profiles').select('email').eq('id', data.user_id).single();
                        if (profile) email = profile.email;

                        setLatestActivity({ ...data, user_email: email } as TenderActivity);
                    }
                } catch (error) {
                    console.error("DEBUG: Activity Fetch Error:", error);
                }
            };
            fetchLatestEnhanced();
        }

        return () => { isMounted = false; };
    }, [item.tender_id, item.status, item.status_updated_at]); // Refresh when status update happens locally

    // --- 0.2 FETCH ALL ACTIVITIES ON SHEET OPEN ---
    const fetchActivities = async () => {
        setIsLoadingActivities(true);
        try {
            const { data: activitiesData, error } = await supabase
                .from('tender_activities')
                .select('*')
                .eq('tender_id', item.tender_id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Fetch Profiles for emails
            const userIds = Array.from(new Set((activitiesData || []).map(a => a.user_id)));
            let profileMap: Record<string, string> = {};

            if (userIds.length > 0) {
                const { data: profilesData } = await supabase
                    .from('profiles')
                    .select('id, email')
                    .in('id', userIds);

                if (profilesData) {
                    profilesData.forEach(p => {
                        profileMap[p.id] = p.email;
                    });
                }
            }

            // Map activities with email
            const mappedActivities = (activitiesData || []).map(a => ({
                ...a,
                user_email: profileMap[a.user_id] || 'Utente'
            }));

            setActivities(mappedActivities as TenderActivity[]);
        } catch (error) {
            console.error('Error fetching activities:', error);
        } finally {
            setIsLoadingActivities(false);
        }
    };

    React.useEffect(() => {
        if (isActivitySheetOpen) {
            fetchActivities();
        }
    }, [isActivitySheetOpen]);

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

    // --- 5. ALERT HANDLERS ---
    const handleStatusChangeRequest = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newStatus = e.target.value;
        if (newStatus !== item.status) {
            setPendingStatus(newStatus);
            setIsAlertOpen(true);
        }
    };

    const confirmStatusChange = () => {
        if (pendingStatus) {
            onUpdateStatus(item.tender_id, pendingStatus);
            setPendingStatus(null);
            setIsAlertOpen(false);
        }
    };

    const cancelStatusChange = () => {
        setPendingStatus(null);
        setIsAlertOpen(false);
    };

    // --- 6. ACTIVITY FORMATTING ---
    const formatActivity = (activity: TenderActivity) => {
        const date = new Date(activity.created_at).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
        // Use full email if available, otherwise fallback to "Utente" -> NO, use email part as requested
        const user = activity.user_email || 'Utente';

        switch (activity.action_type) {
            case 'status_change':
                return (
                    <span>
                        <span className="font-semibold text-slate-300">{user}</span> ha cambiato stato da <span className="text-slate-500 line-through">{activity.details.old_status}</span> a <span className="font-bold text-white">{activity.details.new_status}</span>
                    </span>
                );
            case 'analysis_run':
                return (
                    <span>
                        <span className="font-semibold text-slate-300">{user}</span> ha avviato una nuova analisi
                    </span>
                );
            case 'dashboard_note':
                return (
                    <span>
                        <span className="font-semibold text-slate-300">{user}</span> ha aggiornato le note della dashboard
                    </span>
                );
            case 'section_update':
                return (
                    <span>
                        <span className="font-semibold text-slate-300">{user}</span> ha modificato la sezione <span className="italic text-slate-400">{activity.details.section}</span>
                    </span>
                );
            case 'created':
                return (
                    <span>
                        <span className="font-semibold text-slate-300">{user}</span> ha creato la gara
                    </span>
                );
            default:
                return (
                    <span>
                        <span className="font-semibold text-slate-300">{user}</span>: Attività generica
                    </span>
                );
        }
    };

    return (
        <>
            <div
                onClick={(e) => {
                    // Prevent opening if clicking on interactive elements
                    const target = e.target as HTMLElement;
                    if (target.tagName === 'TEXTAREA' || target.closest('.interactive-area')) return;
                    onOpen(item.result_json, item.tender_id);
                }}
                /* GRID UPDATED layout */
                className="group flex flex-col md:grid md:grid-cols-[1.1fr,1.3fr,1.8fr,1.5fr,1.3fr,1.3fr] gap-3 p-4 border-b border-slate-800/50 hover:bg-slate-800/30 transition-all items-start last:border-0 relative"
            >
                {/* COLUMN 1: STATO */}
                <div onClick={(e) => e.stopPropagation()} className="flex flex-col items-center gap-2 interactive-area pt-1 w-full md:w-auto order-1 md:order-none mb-2 md:mb-0">
                    {/* Tender ID */}
                    <span className="text-xs font-mono font-bold text-slate-500 bg-slate-900/50 px-2 py-0.5 rounded border border-slate-800">
                        #{item.numericId}
                    </span>

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
                            onChange={handleStatusChangeRequest}
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        >
                            <option value="In valutazione">In valutazione</option>
                            <option value="Decisa: Go">Decisa: Go</option>
                            <option value="Decisa: No Go">Decisa: No Go</option>
                            <option value="Assegnata">Assegnata</option>
                            <option value="Presentata">Presentata</option>
                        </select>
                    </div>

                    {/* Last Update & Activity Snippet */}
                    <div className="flex flex-col items-center gap-1 w-full">
                        {item.status_updated_at && (
                            <span className="text-[10px] text-slate-500 whitespace-nowrap">
                                {new Date(item.status_updated_at).toLocaleDateString('it-IT', { month: '2-digit', day: '2-digit' })}
                            </span>
                        )}

                        {/* Latest Activity Snippet */}
                        {latestActivity && (
                            <div
                                className="flex items-center gap-1 mt-1 px-2 py-1 bg-slate-900/50 rounded-full border border-slate-800 cursor-pointer hover:border-slate-600 transition-colors w-full justify-center"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsActivitySheetOpen(true);
                                }}
                                title="Clicca per vedere il log attività"
                            >
                                <Activity className="w-3 h-3 text-slate-500" />
                                <span className="text-[9px] text-slate-400 truncate max-w-[80px]">
                                    {latestActivity.action_type === 'status_change' ? 'Status' :
                                        latestActivity.action_type === 'dashboard_note' ? 'Note' :
                                            latestActivity.action_type === 'analysis_run' ? 'Analisi' : 'Update'}
                                </span>
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                            </div>
                        )}
                    </div>
                </div>

                {/* COLUMN 2: ENTE / CIG */}
                <div className="flex flex-col gap-1 pt-1 w-full md:w-auto order-2 md:order-none">
                    <h3 className="text-slate-200 font-bold text-xs line-clamp-2 md:line-clamp-2" title={item.ente}>
                        {item.ente || "N/D"}
                    </h3>
                    {item.cig && (
                        <span className="text-[10px] text-slate-500 font-mono bg-slate-900/50 px-1.5 py-0.5 rounded w-fit">
                            CIG: {item.cig}
                        </span>
                    )}
                </div>

                {/* COLUMN 3: OGGETTO */}
                <div className="pr-2 pt-1 w-full md:w-auto order-3 md:order-none mb-2 md:mb-0">
                    <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed" title={item.object}>
                        {item.object || item.title}
                    </p>
                </div>

                {/* COLUMN 4: NOTE */}
                <div className="interactive-area relative w-full md:w-auto order-6 md:order-none mt-2 md:mt-0">
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
                <div className="pr-2 flex flex-row md:flex-col gap-3 pt-1 w-full md:w-auto order-4 md:order-none justify-between md:justify-start items-center md:items-stretch border-t border-slate-800/50 md:border-none pt-2 md:pt-1 mt-1 md:mt-0">
                    {/* 1. SCADENZA OFFERTA */}
                    <div className="flex-1 md:flex-none">
                        <div className="flex items-center gap-2 md:justify-between mb-1">
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
                        <div className="flex-1 md:flex-none">
                            <div className="flex items-center gap-2 md:justify-between mb-0.5">
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
                <div className="flex items-center justify-between interactive-area pt-1 w-full md:w-auto order-5 md:order-none border-t border-slate-800/50 md:border-none pt-2 md:pt-1 mt-1 md:mt-0">
                    <div className="flex items-center gap-2">
                        {renderOwnerCircle('owner_comm', 'COMM', 'bg-blue-600')}
                        {renderOwnerCircle('owner_tech', 'TEC', 'bg-purple-600')}
                        {renderOwnerCircle('owner_admin', 'AMM', 'bg-orange-600')}
                    </div>

                    <div className="flex flex-row md:flex-col gap-2 md:gap-1 items-end ml-2 opacity-100 md:opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                            onClick={(e) => onExport(e, item.result_json)}
                            className="p-1.5 md:p-1 text-slate-500 hover:text-emerald-400 hover:bg-emerald-950/30 rounded transition-colors"
                            title="Esporta Report"
                        >
                            <Download className="w-4 h-4 md:w-3.5 md:h-3.5" />
                        </button>
                        <button
                            onClick={(e) => onDelete(e, item.tender_id)}
                            className="p-1.5 md:p-1 text-slate-500 hover:text-red-400 hover:bg-red-950/30 rounded transition-colors"
                            title="Elimina"
                        >
                            <Trash2 className="w-4 h-4 md:w-3.5 md:h-3.5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* CONFIRMATION DIALOG */}
            <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
                <AlertDialogContent className="bg-slate-900 border-slate-700">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-slate-100">Conferma Modifica Stato</AlertDialogTitle>
                        <AlertDialogDescription className="text-slate-400">
                            Stai per modificare lo stato della gara in <span className="text-white font-bold">"{pendingStatus}"</span>.
                            <br />Vuoi procedere?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={cancelStatusChange} className="bg-transparent border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white">
                            Annulla
                        </AlertDialogCancel>
                        <AlertDialogAction onClick={confirmStatusChange} className="bg-blue-600 text-white hover:bg-blue-500">
                            Conferma
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* ACTIVITY LOG SHEET */}
            <Sheet open={isActivitySheetOpen} onOpenChange={setIsActivitySheetOpen}>
                <SheetContent side="right" className="bg-slate-900 border-l border-slate-700 text-slate-100 sm:max-w-md w-full p-0">
                    <SheetHeader className="p-6 border-b border-slate-800">
                        <SheetTitle className="text-slate-100 flex items-center gap-2">
                            <Activity className="h-5 w-5 text-blue-500" />
                            Log Attività
                        </SheetTitle>
                        <SheetDescription className="text-slate-400">
                            Cronologia delle attività per {item.object || "questa gara"}.
                        </SheetDescription>
                    </SheetHeader>

                    <div className="p-6 overflow-y-auto h-[calc(100vh-120px)] space-y-6">
                        {isLoadingActivities ? (
                            <div className="flex justify-center py-10">
                                <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
                            </div>
                        ) : activities.length === 0 ? (
                            <div className="text-center py-10 text-slate-500">
                                <Clock className="h-10 w-10 mx-auto mb-3 opacity-20" />
                                <p>Nessuna attività registrata.</p>
                            </div>
                        ) : (
                            <div className="relative border-l border-slate-700 ml-3 space-y-8">
                                {activities.map((activity) => (
                                    <div key={activity.id} className="relative pl-6">
                                        {/* Timeline Dot */}
                                        <div className="absolute -left-[5px] top-1 h-2.5 w-2.5 rounded-full bg-slate-600 border border-slate-900" />

                                        <div className="flex flex-col gap-1">
                                            <span className="text-[10px] font-mono text-slate-500">
                                                {new Date(activity.created_at).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </span>

                                            <div className="text-sm text-slate-300 leading-relaxed">
                                                {formatActivity(activity)}
                                            </div>

                                            {/* Details if any relevant extra info */}
                                            {activity.details?.note_snippet && (
                                                <div className="mt-2 text-xs text-slate-400 bg-slate-800/50 p-2 rounded border-l-2 border-slate-600 italic">
                                                    "{activity.details.note_snippet}"
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </SheetContent>
            </Sheet>
        </>
    );
}
