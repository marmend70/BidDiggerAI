import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Edit3, Check, Save } from "lucide-react";
import { Button } from "@/components/ui/button";

interface UserNotesBlockProps {
    initialNotes?: string;
    onSave: (notes: string) => Promise<void>;
}

export const UserNotesBlock: React.FC<UserNotesBlockProps> = ({ initialNotes, onSave }) => {
    const [notes, setNotes] = useState(initialNotes || '');
    const [isSaving, setIsSaving] = useState(false);
    const [isDirty, setIsDirty] = useState(false);

    useEffect(() => {
        setNotes(initialNotes || '');
        setIsDirty(false);
    }, [initialNotes]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await onSave(notes);
            setIsDirty(false);
        } catch (error) {
            console.error("Failed to save notes:", error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Card className="bg-amber-950/5 border-amber-900/30 mt-8 shadow-sm">
            <CardHeader className="pb-3 border-b border-amber-900/10">
                <CardTitle className="flex items-center justify-between text-amber-100/90 text-lg">
                    <div className="flex items-center gap-2">
                        <Edit3 className="h-5 w-5 text-amber-500" />
                        Integrazioni e Note
                    </div>
                    {isDirty && (
                        <Button
                            size="sm"
                            variant="outline"
                            className="h-8 gap-2 bg-amber-950/30 text-amber-200 border-amber-800 hover:bg-amber-900/50 hover:text-amber-100"
                            onClick={handleSave}
                            disabled={isSaving}
                        >
                            {isSaving ? (
                                <>Salvataggio...</>
                            ) : (
                                <>
                                    <Save className="h-4 w-4" />
                                    Salva Modifiche
                                </>
                            )}
                        </Button>
                    )}
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
                <p className="text-sm text-slate-400 mb-3 italic">
                    Qui puoi aggiungere eventuali osservazioni, note, correzioni e/o integrazioni a quanto rilevato, che saranno archiviate nella scheda gara.
                </p>
                <Textarea
                    value={notes}
                    onChange={(e) => {
                        const val = e.target.value.slice(0, 600);
                        setNotes(val);
                        setIsDirty(val !== (initialNotes || ''));
                    }}
                    onBlur={() => {
                        // Optional: Auto-save on blur if dirty? 
                        // User request didn't specify, but explicit button is safer for "corrections".
                        // Let's keep button only for now to avoid accidental overwrites.
                    }}
                    placeholder="Scrivi qui le tue note (max 600 caratteri)..."
                    className="min-h-[100px] bg-slate-950/40 border-slate-800 text-slate-200 placeholder:text-slate-600 focus:border-amber-500/50 focus:ring-amber-500/20 resize-none"
                />
                <div className="mt-2 flex justify-end">
                    <span className={`text-xs ${notes.length > 550 ? 'text-amber-500' : 'text-slate-500'}`}>{notes.length}/600</span>
                </div>
            </CardContent>
        </Card>
    );
};
