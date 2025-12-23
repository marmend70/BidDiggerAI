import React, { useState, useEffect, useRef } from 'react';
import { Pencil, Check, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface EditableFieldProps {
    value: string | number | undefined;
    onSave: (newValue: string | number) => Promise<void>;
    type?: 'text' | 'textarea' | 'number' | 'date';
    className?: string;
    label?: string; // Optional label for accessibility or debugging
    placeholder?: string;
    readOnly?: boolean;
    displayFormatter?: (value: string | number) => string;
}

export function EditableField({
    value,
    onSave,
    type = 'text',
    className,
    label,
    placeholder = 'Clicca per modificare...',
    readOnly = false,
    displayFormatter
}: EditableFieldProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editedValue, setEditedValue] = useState<string | number>('');
    const [isLoading, setIsLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

    useEffect(() => {
        setEditedValue(value === undefined || value === null ? '' : value);
    }, [value]);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isEditing]);

    const handleSave = async () => {
        if (editedValue === value) {
            setIsEditing(false);
            return;
        }

        setIsLoading(true);
        try {
            await onSave(editedValue);
            setIsEditing(false);
        } catch (error) {
            console.error("Failed to save:", error);
            // Optionally revert or show error state
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = () => {
        setEditedValue(value === undefined || value === null ? '' : value);
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey && type !== 'textarea') {
            handleSave();
        } else if (e.key === 'Escape') {
            handleCancel();
        }
    };

    if (readOnly) {
        return <span className={className}>{value}</span>;
    }

    if (isEditing) {
        return (
            <div className={cn("flex items-start gap-2 animate-in fade-in zoom-in-95 duration-200", className)}>
                {type === 'textarea' ? (
                    <Textarea
                        ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                        value={editedValue}
                        onChange={(e) => setEditedValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="min-h-[80px] bg-slate-900 border-slate-700 text-slate-100 resize-none focus-visible:ring-amber-500"
                        placeholder={placeholder}
                    />
                ) : (
                    <Input
                        ref={inputRef as React.RefObject<HTMLInputElement>}
                        type={type === 'number' ? 'number' : 'text'}
                        value={editedValue}
                        onChange={(e) => setEditedValue(type === 'number' ? Number(e.target.value) : e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="bg-slate-900 border-slate-700 text-slate-100 h-9 focus-visible:ring-amber-500"
                        placeholder={placeholder}
                    />
                )}

                <div className="flex flex-col gap-1">
                    <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-green-400 hover:text-green-300 hover:bg-green-950/30"
                        onClick={handleSave}
                        disabled={isLoading}
                    >
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    </Button>
                    <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-950/30"
                        onClick={handleCancel}
                        disabled={isLoading}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div
            role="button"
            tabIndex={0}
            onClick={() => setIsEditing(true)}
            className={cn(
                "group relative border border-transparent hover:border-dashed hover:border-amber-500/50 rounded px-1 -mx-1 transition-all cursor-pointer",
                !value && "text-slate-500 italic",
                className
            )}
            title="Clicca per modificare"
        >
            {displayFormatter ? displayFormatter(value!) : (value || placeholder)}
            <Pencil className="h-3 w-3 text-amber-500 absolute -right-3 top-0 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
    );
}
