import React, { useState } from 'react';
import { Building, ChevronsUpDown, Check, User, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface Organization {
    id: string;
    name: string;
    role: string; // 'owner' | 'admin' | 'member'
    status?: 'active' | 'pending' | 'rejected'; // Added
    isPersonal?: boolean; // Flag to identify personal workspace
    ownerEmail?: string; // NEW: To identify who owns the workspace
}

interface WorkspaceSwitcherProps {
    organizations: Organization[];
    currentOrgId: string | null;
    onSwitch: (orgId: string | null) => void;
    onAcceptInvite?: (orgId: string, e: React.MouseEvent) => void;
    onRejectInvite?: (orgId: string, e: React.MouseEvent) => void;
    className?: string;
}

export function WorkspaceSwitcher({ organizations, currentOrgId, onSwitch, className }: WorkspaceSwitcherProps) {
    const [open, setOpen] = useState(false);

    // Find current active org
    const currentOrg = organizations.find(o => o.id === currentOrgId) || organizations.find(o => o.isPersonal);

    // Filter personal vs teams
    const personalOrg = organizations.find(o => o.isPersonal);
    const activeTeamOrgs = organizations.filter(o => !o.isPersonal && o.status !== 'pending');
    const pendingInvites = organizations.filter(o => o.status === 'pending');

    const getWorkspaceLabel = (org: Organization) => {
        if (org.isPersonal) return "Il tuo Workspace";
        if (org.role === 'owner') return "Il tuo Workspace (Team)";
        return `Workspace di ${org.ownerEmail || 'Admin'}`;
    };

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn("w-full justify-between bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800 hover:text-white", className)}
                >
                    <div className="flex items-center gap-2 truncate">
                        {/* Show pending icon if current is pending (shouldn't happen if prevented, but safe UI) */}
                        {currentOrg?.status === 'pending' ? (
                            <Building className="h-4 w-4 text-amber-500/50 shrink-0 animate-pulse" />
                        ) : currentOrg?.isPersonal ? (
                            <User className="h-4 w-4 text-slate-400 shrink-0" />
                        ) : (
                            <Building className="h-4 w-4 text-amber-500 shrink-0" />
                        )}
                        <span className="truncate">{currentOrg ? getWorkspaceLabel(currentOrg) : "Seleziona Workspace"}</span>
                    </div>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[280px] bg-slate-900 border-slate-800 text-slate-200 p-0">

                {/* PENDING INVITES SECTION */}
                {pendingInvites.length > 0 && (
                    <>
                        <DropdownMenuLabel className="text-xs font-medium text-amber-500 uppercase tracking-wider px-2 py-1.5 mt-2 flex items-center gap-2">
                            Inviti in Attesa
                            <span className="bg-amber-500 text-slate-900 text-[10px] px-1 rounded-full font-bold">{pendingInvites.length}</span>
                        </DropdownMenuLabel>
                        {pendingInvites.map(org => (
                            <div key={org.id} className="flex items-center justify-between p-2 m-1 bg-slate-800/50 rounded-md border border-slate-800">
                                <div className="flex items-center gap-2 overflow-hidden">
                                    <Building className="h-3 w-3 text-slate-500" />
                                    <span className="text-xs text-slate-300 truncate max-w-[120px]">
                                        {/* Use label logic to show owner email if member */}
                                        {org.role === 'owner' ? org.name : `Workspace di ${org.ownerEmail || 'Admin'}`}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onAcceptInvite?.(org.id, e);
                                        }}
                                        className="p-1 hover:bg-green-500/20 text-green-500 rounded transition-colors"
                                        title="Accetta"
                                    >
                                        <Check className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onRejectInvite?.(org.id, e);
                                        }}
                                        className="p-1 hover:bg-red-500/20 text-red-500 rounded transition-colors"
                                        title="Rifiuta"
                                    >
                                        <X className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                        <DropdownMenuSeparator className="bg-slate-800" />
                    </>
                )}

                {/* Personal Workspace Section */}
                {personalOrg && (
                    <>
                        <DropdownMenuLabel className="text-xs font-medium text-slate-500 uppercase tracking-wider px-2 py-1.5 mt-2">
                            Il tuo spazio
                        </DropdownMenuLabel>
                        <DropdownMenuItem
                            onSelect={() => {
                                onSwitch(personalOrg.id);
                                setOpen(false);
                            }}
                            className="flex items-center gap-2 p-2 cursor-pointer focus:bg-slate-800 focus:text-white m-1 rounded-md"
                        >
                            <div className="flex items-center justify-center h-8 w-8 rounded bg-slate-800 text-slate-400">
                                <User className="h-4 w-4" />
                            </div>
                            <div className="flex-1">
                                <div className="font-medium text-sm">Il tuo Workspace</div>
                                <div className="text-xs text-slate-500">Personale</div>
                            </div>
                            {currentOrgId === personalOrg.id && (
                                <Check className="ml-auto h-4 w-4 text-amber-500" />
                            )}
                        </DropdownMenuItem>
                    </>
                )}

                {/* Teams Section */}
                {activeTeamOrgs.length > 0 && (
                    <>
                        <DropdownMenuSeparator className="bg-slate-800" />
                        <DropdownMenuLabel className="text-xs font-medium text-slate-500 uppercase tracking-wider px-2 py-1.5 mt-2">
                            Team
                        </DropdownMenuLabel>
                        {activeTeamOrgs.map((org) => (
                            <DropdownMenuItem
                                key={org.id}
                                onSelect={() => {
                                    onSwitch(org.id);
                                    setOpen(false);
                                }}
                                className="flex items-center gap-2 p-2 cursor-pointer focus:bg-slate-800 focus:text-white m-1 rounded-md"
                            >
                                <div className="flex items-center justify-center h-8 w-8 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                    <Building className="h-4 w-4" />
                                </div>
                                <div className="flex-1">
                                    <div className="font-medium text-sm truncate">
                                        {org.role === 'owner' ? org.name : `Workspace di ${org.ownerEmail || 'Admin'}`}
                                    </div>
                                    <div className="text-xs text-slate-500 capitalize">{org.role === 'owner' ? 'Proprietario' : org.role}</div>
                                </div>
                                {currentOrgId === org.id && (
                                    <Check className="ml-auto h-4 w-4 text-amber-500" />
                                )}
                            </DropdownMenuItem>
                        ))}
                    </>
                )}

                {!personalOrg && activeTeamOrgs.length === 0 && pendingInvites.length === 0 && (
                    <div className="p-4 text-center text-sm text-slate-500">
                        Nessun workspace trovato.
                    </div>
                )}

            </DropdownMenuContent>
        </DropdownMenu>
    );
}
