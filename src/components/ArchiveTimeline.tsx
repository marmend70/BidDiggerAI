import React, { useRef, useEffect } from 'react';
import { Calendar, User, Clock, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TimelineItem {
    id: string;
    numericId: number;
    title: string;
    deadline: string | null;
    owner: string | null;
    daysRemaining: number | null;
    status: string;
}

interface ArchiveTimelineProps {
    items: TimelineItem[];
}

export function ArchiveTimeline({ items }: ArchiveTimelineProps) {
    // Filter items with valid deadlines and sort by days remaining (ascending)
    // We only want future or recent deadlines usually, or just all? 
    // User said "matte in ordine di scadenza".

    const sortedItems = [...items]
        .filter(item => item.deadline !== null && item.daysRemaining !== null)
        .sort((a, b) => (a.daysRemaining || 0) - (b.daysRemaining || 0));

    if (sortedItems.length === 0) return null;

    const today = new Date();

    return (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-6">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-500" />
                Timeline Scadenze
            </h2>

            <div className="relative pt-8 pb-4 overflow-x-auto">
                {/* Main Timeline Line */}
                <div className="absolute top-8 left-0 w-full h-1 bg-slate-100 rounded-full" />

                {/* Today Marker */}
                <div className="absolute top-6 left-0 z-10 flex flex-col items-center">
                    <div className="w-4 h-4 rounded-full bg-emerald-500 ring-4 ring-white shadow-sm" />
                    <span className="mt-2 text-xs font-bold text-emerald-600 uppercase tracking-wider">Oggi</span>
                    <span className="text-[10px] text-slate-400">{today.toLocaleDateString('it-IT')}</span>
                </div>

                {/* Timeline Items Container */}
                <div className="flex gap-4 ml-12 min-w-max pb-4">
                    {sortedItems.map((item, index) => {
                        const isUrgent = (item.daysRemaining || 0) < 5;
                        const isPast = (item.daysRemaining || 0) < 0;

                        return (
                            <div
                                key={item.id}
                                className="relative flex flex-col items-start min-w-[200px] group"
                            >
                                {/* Node on Line */}
                                <div className={cn(
                                    "absolute -top-[1.6rem] left-4 w-3 h-3 rounded-full ring-2 ring-white transition-colors",
                                    isPast ? "bg-slate-300" : (isUrgent ? "bg-red-500" : "bg-blue-500")
                                )} />

                                {/* Card */}
                                <div className={cn(
                                    "mt-2 p-3 rounded-lg border w-full transition-all hover:shadow-md",
                                    isPast ? "bg-slate-50 border-slate-200 opacity-70" :
                                        item.status === 'Decisa: Go' ? "bg-green-50 border-green-200" :
                                            item.status === 'Decisa: No Go' ? "bg-red-50 border-red-200" :
                                                item.status === 'Assegnata' ? "bg-emerald-100 border-emerald-300" :
                                                    item.status === 'Presentata' ? "bg-slate-100 border-slate-300" :
                                                        "bg-white border-slate-200 hover:border-amber-200"
                                )}>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className={cn(
                                            "text-xs font-bold px-2 py-0.5 rounded-full",
                                            isPast ? "bg-slate-200 text-slate-600" : "bg-blue-100 text-blue-700"
                                        )}>
                                            #{item.numericId}
                                        </span>
                                        <span className={cn(
                                            "text-xs font-bold",
                                            isUrgent && !isPast ? "text-red-600" : "text-slate-500"
                                        )}>
                                            {isPast ? 'Scaduta' : `${item.daysRemaining} gg`}
                                        </span>
                                    </div>

                                    <h4 className="text-sm font-medium text-slate-800 line-clamp-2 mb-2" title={item.title}>
                                        {item.title}
                                    </h4>

                                    <div className="flex flex-col gap-1 text-xs text-slate-500">
                                        <div className="flex items-center gap-1.5">
                                            <Calendar className="w-3 h-3" />
                                            <span>{item.deadline}</span>
                                        </div>
                                        {item.owner && (
                                            <div className="flex items-center gap-1.5 text-slate-700">
                                                <User className="w-3 h-3" />
                                                <span className="font-medium">{item.owner}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div >
    );
}
