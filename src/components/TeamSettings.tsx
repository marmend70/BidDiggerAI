import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, UserPlus, Shield, LogOut, Loader2, Building, AlertCircle } from 'lucide-react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface TeamMember {
    user_id: string;
    role: 'owner' | 'admin' | 'member';
    joined_at: string;
    profiles: {
        email: string;
        full_name: string;
    };
}

interface Organization {
    id: string;
    name: string;
    created_at: string;
}

interface TeamSettingsProps {
    currentUserId: string;
    organizationId: string | null;
}

export function TeamSettings({ currentUserId, organizationId }: TeamSettingsProps) {
    const [organization, setOrganization] = useState<Organization | null>(null);
    const [members, setMembers] = useState<TeamMember[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [newMemberEmail, setNewMemberEmail] = useState('');
    const [isInviting, setIsInviting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Error Modal State
    const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
    const [errorModalContent, setErrorModalContent] = useState({ title: '', message: '' });

    useEffect(() => {
        if (organizationId) {
            fetchTeamData();
        } else {
            setIsLoading(false);
        }
    }, [organizationId]);

    const fetchTeamData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            // 1. Fetch Organization Details
            const { data: orgData, error: orgError } = await supabase
                .from('organizations')
                .select('*')
                .eq('id', organizationId)
                .single();

            if (orgError) throw orgError;
            setOrganization(orgData);

            // 2. Fetch Members
            const { data: membersData, error: membersError } = await supabase
                .from('organization_members')
                .select(`
                    user_id,
                    role,
                    joined_at,
                    profiles (
                        email,
                        full_name
                    )
                `)
                .eq('organization_id', organizationId);

            if (membersError) throw membersError;
            setMembers(membersData as any || []);

        } catch (err: any) {
            console.error('Error fetching team data:', err);
            setError(`Impossibile caricare i dati del team: ${err.message || 'Errore sconosciuto'}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddMember = async () => {
        if (!newMemberEmail || !organizationId) return;
        setIsInviting(true);
        setError(null);
        setSuccess(null);

        try {
            // 1. Find User by Email
            // Note: We can only query public profiles or similar. 
            // Assuming 'profiles' table has email and RLS allows reading basic info? 
            // Actually RLS usually restricts reading other profiles.
            // We might need an Edge Function to lookup user by email safely.
            // OR we blindly insert and let RLS block if not allowed?
            // "Add by Email" implies we know the email.

            // WORKAROUND: For this MVP, we try to finding the user ID via exact email match on profiles.
            // If RLS blocks this, we need a secure RPC.
            // Let's assume we can query profiles by email if we are authenticated.

            const { data: userProfile, error: profileError } = await supabase
                .rpc('get_profile_by_email', { email_input: newMemberEmail.trim() })
                .single();

            if (profileError || !userProfile) {
                throw new Error("Utente non trovato. Assicurati che sia già registrato alla piattaforma.");
            }

            // 2. Add to Organization
            const { error: addError } = await supabase
                .from('organization_members')
                .insert({
                    organization_id: organizationId,
                    user_id: (userProfile as any).id,
                    role: 'member'
                });

            if (addError) {
                if (addError.code === '23505') throw new Error("Utente già presente nel team.");
                throw addError;
            }

            setSuccess(`Utente ${newMemberEmail} aggiunto al team!`);
            setNewMemberEmail('');
            fetchTeamData(); // Refresh list

            // NOTIFICATION: Send email to the new member
            try {
                // Get inviter name (current user) - simple fallback or fetch from profile if available
                const inviterName = members.find(m => m.user_id === currentUserId)?.profiles?.full_name || "Un Amministratore";
                const workspaceName = organization?.name || "Workspace";

                const { error: fnError } = await supabase.functions.invoke('send-email', {
                    body: {
                        type: 'TEAM_INVITE',
                        payload: {
                            to: newMemberEmail, // Resend handles validation
                            inviterName: inviterName,
                            workspaceName: workspaceName
                        }
                    }
                });

                if (fnError) throw fnError;
                console.log("Email inviata a", newMemberEmail);
            } catch (emailErr: any) {
                console.error("Errore invio email:", emailErr);
                alert(`L'utente è stato aggiunto ma l'invio della mail è fallito: ${emailErr.message || 'Errore sconosciuto'}`);
            }

            setNewMemberEmail('');

        } catch (err: any) {
            console.error('Invite error:', err);
            // Check if it's our specific "Not Found" error
            if (err.message.includes("Utente non trovato") || err.message.includes("not found")) {
                setErrorModalContent({
                    title: "Utente non registrato",
                    message: `L'indirizzo email ${newMemberEmail} non corrisponde a nessun utente registrato su Bid Digger.\n\nPer aggiungere un membro al team, l'utente deve prima registrarsi gratuitamente alla piattaforma.`
                });
                setIsErrorModalOpen(true);
            } else {
                setError(err.message || "Errore durante l'aggiunta del membro.");
            }
        } finally {
            setIsInviting(false);
        }
    };

    const handleRemoveMember = async (memberId: string) => {
        if (!confirm("Sei sicuro di voler rimuovere questo membro dal team?")) return;
        try {
            const { error } = await supabase
                .from('organization_members')
                .delete()
                .eq('organization_id', organizationId)
                .eq('user_id', memberId);

            if (error) throw error;
            setMembers(prev => prev.filter(m => m.user_id !== memberId));
        } catch (err) {
            console.error("Remove error:", err);
            alert("Errore durante la rimozione.");
        }
    };

    if (isLoading) {
        return <div className="p-8 text-center text-slate-400"><Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />Caricamento Team...</div>;
    }

    if (!organizationId || !organization) {
        return (
            <div className="p-8 text-center text-slate-400">
                <Building className="h-10 w-10 mx-auto mb-4 opacity-50" />
                <h2 className="text-xl font-semibold mb-2">Nessuna Organizzazione</h2>
                <p>Non fai parte di nessuna organizzazione. Contatta il supporto per crearne una.</p>
            </div>
        );
    }

    const currentUserRole = members.find(m => m.user_id === currentUserId)?.role;
    const canManage = currentUserRole === 'owner' || currentUserRole === 'admin';

    const ownerMember = members.find(m => m.role === 'owner');
    const isOwner = currentUserRole === 'owner';
    const ownerEmail = ownerMember?.profiles?.email || 'Admin';

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
                        <Building className="h-6 w-6 text-amber-500" />
                        {isOwner ? "Il tuo Workspace" : `Workspace di ${ownerEmail}`}
                    </h1>
                    <p className="text-slate-400">
                        {isOwner
                            ? "Gestisci membri e permessi del tuo team."
                            : "Sei membro di questo team."}
                    </p>
                </div>
            </div>

            {/* ERROR / SUCCESS ALERTS */}
            {error && (
                <div className="bg-red-900/30 border border-red-800 text-red-200 p-4 rounded-lg text-sm">
                    {error}
                </div>
            )}
            {success && (
                <div className="bg-green-900/30 border border-green-800 text-green-200 p-4 rounded-lg text-sm">
                    {success}
                </div>
            )}

            {/* ADD MEMBER CARD */}
            {canManage && (
                <Card className="bg-[#1e1e2d] border-slate-800">
                    <CardHeader>
                        <CardTitle className="text-lg text-slate-200 flex items-center gap-2">
                            <UserPlus className="h-5 w-5 text-indigo-400" />
                            Aggiungi Membro
                        </CardTitle>
                        <CardDescription className="text-slate-500">
                            Invita colleghi al tuo workspace inserendo la loro email. Devono essere già registrati.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex gap-4">
                            <Input
                                placeholder="Email utente (es. mario.rossi@azienda.it)"
                                value={newMemberEmail}
                                onChange={(e) => setNewMemberEmail(e.target.value)}
                                className="bg-slate-900 border-slate-700 text-slate-200"
                            />
                            <Button
                                onClick={handleAddMember}
                                disabled={isInviting || !newMemberEmail}
                                className="bg-indigo-600 hover:bg-indigo-500"
                            >
                                {isInviting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Aggiungi"}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* MEMBERS LIST */}
            <Card className="bg-[#1e1e2d] border-slate-800">
                <CardHeader>
                    <CardTitle className="text-lg text-slate-200 flex items-center gap-2">
                        <Users className="h-5 w-5 text-emerald-400" />
                        Membri del Team ({members.length})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {members.map(member => (
                            <div key={member.user_id} className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg border border-slate-800">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 font-bold">
                                        {member.profiles?.full_name?.[0] || member.profiles?.email?.[0]?.toUpperCase() || '?'}
                                    </div>
                                    <div>
                                        <div className="font-medium text-slate-200">
                                            {member.profiles?.full_name || member.profiles?.email || 'Utente sconosciuto'}
                                        </div>
                                        <div className="text-sm text-slate-500 flex items-center gap-2">
                                            {member.profiles?.email}
                                            {member.user_id === currentUserId && <span className="text-xs bg-slate-700 px-2 py-0.5 rounded text-amber-400">Tu</span>}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 rounded-full border border-slate-700">
                                        <Shield className={cn("h-3 w-3", member.role === 'owner' ? "text-amber-500" : member.role === 'admin' ? "text-indigo-400" : "text-slate-400")} />
                                        <span className={cn("text-xs font-medium capitalize", member.role === 'owner' ? "text-amber-500" : member.role === 'admin' ? "text-indigo-400" : "text-slate-400")}>
                                            {member.role === 'owner' ? 'Proprietario' : member.role}
                                        </span>
                                    </div>

                                    {canManage && member.role !== 'owner' && member.user_id !== currentUserId && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleRemoveMember(member.user_id)}
                                            className="text-slate-500 hover:text-red-400 hover:bg-slate-800/50"
                                        >
                                            <LogOut className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* ERROR MODAL */}
            <AlertDialog open={isErrorModalOpen} onOpenChange={setIsErrorModalOpen}>
                <AlertDialogContent className="bg-slate-900 border-slate-700">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-red-400 flex items-center gap-2">
                            <AlertCircle className="h-5 w-5" />
                            {errorModalContent.title}
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-slate-300">
                            {errorModalContent.message}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogAction onClick={() => setIsErrorModalOpen(false)} className="bg-slate-700 hover:bg-slate-600 text-white">
                            Ho capito
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div >
    );
}

function cn(...classes: (string | undefined | null | boolean)[]) {
    return classes.filter(Boolean).join(' ');
}
