import React, { useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload as UploadIcon, File, X, Loader2, AlertTriangle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { cn } from '@/lib/utils';

interface UploadProps {
    onUpload: (files: File[]) => Promise<void>;
    isUploading: boolean;
    userTier?: 'trial' | 'pro';
    userCredits?: number;
}

export function Upload({ onUpload, isUploading, userTier = 'trial', userCredits = 0 }: UploadProps) {
    const [files, setFiles] = React.useState<File[]>([]);

    // Limits logic
    // If user has credits OR is pro, they are not limited by trial restrictions
    const hasCredits = userCredits > 0;
    const isPro = userTier === 'pro';
    const IS_TRIAL = !isPro && !hasCredits;

    const MAX_FILES = 3;

    const onDrop = useCallback((acceptedFiles: File[]) => {
        setFiles(prev => {
            const newFiles = [...prev, ...acceptedFiles];
            if (newFiles.length > MAX_FILES) {
                alert(`Hai raggiunto il limite di ${MAX_FILES} file per progetto.`);
                // Cut to max files
                return newFiles.slice(0, MAX_FILES);
            }
            return newFiles;
        });
    }, [MAX_FILES, IS_TRIAL]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/pdf': ['.pdf'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
        },
        disabled: isUploading || files.length >= MAX_FILES
    });

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleUpload = async () => {
        if (files.length === 0) return;
        await onUpload(files);
    };

    return (
        <div className="max-w-2xl mx-auto mt-10">
            <Card className="bg-[#1e1e2d] border-slate-800 shadow-xl">
                <CardContent className="p-6">
                    <Alert variant="warning" className="mb-6 bg-amber-950/30 border-amber-900/50">
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                        <AlertDescription className="text-amber-200 text-xs">
                            Questo software utilizza modelli di Intelligenza Artificiale sperimentali che possono generare imprecisioni. L'analisi è un supporto operativo e non sostituisce la verifica umana.
                        </AlertDescription>
                    </Alert>

                    {IS_TRIAL && (
                        <div className="mb-4 p-3 bg-blue-950/30 text-blue-200 text-xs rounded-md flex items-start gap-2 border border-blue-900/50">
                            <Info className="h-4 w-4 shrink-0 mt-0.5 text-blue-400" />
                            <div>
                                <strong>Versione Trial limitata a 3 documenti</strong> (consigliati 2).<br />
                                Per un'analisi ottimale, carica: 1. Disciplinare, 2. Capitolato Tecnico, 3. Bando/Schema Contratto.
                            </div>
                        </div>
                    )}

                    <div
                        {...getRootProps()}
                        className={cn(
                            "border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors relative",
                            isDragActive ? "border-amber-500 bg-amber-950/20" : "border-slate-700 hover:border-slate-600 bg-slate-900/20",
                            (files.length >= MAX_FILES && !isUploading) && "opacity-50 cursor-not-allowed bg-slate-800/50"
                        )}
                    >
                        <input {...getInputProps()} />
                        <div className="flex flex-col items-center gap-2">
                            <div className="p-4 bg-slate-800 rounded-full">
                                <UploadIcon className="h-8 w-8 text-slate-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-200">
                                {files.length >= MAX_FILES
                                    ? "Limite file raggiunto"
                                    : isDragActive ? "Rilascia i file qui" : "Carica Documenti di Gara"}
                            </h3>
                            <p className="text-sm text-slate-400">
                                {files.length >= MAX_FILES
                                    ? "Rimuovi un file per caricarne altri"
                                    : "Trascina i file PDF o DOCX qui, o clicca per selezionarli"}
                            </p>
                        </div>
                    </div>

                    {files.length > 0 && (
                        <div className="mt-6 space-y-3">
                            <h4 className="text-sm font-medium text-slate-300">File Selezionati ({files.length}/{MAX_FILES})</h4>
                            {files.map((file, index) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-md border border-slate-700">
                                    <div className="flex items-center gap-3">
                                        <File className="h-5 w-5 text-slate-400" />
                                        <span className="text-sm text-slate-200 truncate max-w-xs">{file.name}</span>
                                        <span className="text-xs text-slate-500">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                                    </div>
                                    <button onClick={() => removeFile(index)} className="text-slate-500 hover:text-red-400">
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            ))}

                            <Button
                                onClick={handleUpload}
                                className="w-full mt-4 bg-amber-600 hover:bg-amber-700 text-white border-none"
                                disabled={isUploading}
                            >
                                {isUploading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Analisi in corso...
                                    </>
                                ) : (
                                    "Avvia Analisi"
                                )}
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
