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
            <Card>
                <CardContent className="p-6">
                    <Alert variant="warning" className="mb-6 bg-amber-50 border-amber-200">
                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                        <AlertDescription className="text-amber-800 text-xs">
                            Questo software utilizza modelli di Intelligenza Artificiale sperimentali che possono generare imprecisioni. L'analisi è un supporto operativo e non sostituisce la verifica umana.
                        </AlertDescription>
                    </Alert>

                    {IS_TRIAL && (
                        <div className="mb-4 p-3 bg-blue-50 text-blue-800 text-xs rounded-md flex items-start gap-2 border border-blue-100">
                            <Info className="h-4 w-4 shrink-0 mt-0.5" />
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
                            isDragActive ? "border-amber-500 bg-amber-50" : "border-slate-200 hover:border-slate-300",
                            (files.length >= MAX_FILES && !isUploading) && "opacity-50 cursor-not-allowed bg-slate-50"
                        )}
                    >
                        <input {...getInputProps()} />
                        <div className="flex flex-col items-center gap-2">
                            <div className="p-4 bg-slate-100 rounded-full">
                                <UploadIcon className="h-8 w-8 text-slate-500" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-900">
                                {files.length >= MAX_FILES
                                    ? "Limite file raggiunto"
                                    : isDragActive ? "Rilascia i file qui" : "Carica Documenti di Gara"}
                            </h3>
                            <p className="text-sm text-slate-500">
                                {files.length >= MAX_FILES
                                    ? "Rimuovi un file per caricarne altri"
                                    : "Trascina i file PDF o DOCX qui, o clicca per selezionarli"}
                            </p>
                        </div>
                    </div>

                    {files.length > 0 && (
                        <div className="mt-6 space-y-3">
                            <h4 className="text-sm font-medium text-slate-900">File Selezionati ({files.length}/{MAX_FILES})</h4>
                            {files.map((file, index) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-md">
                                    <div className="flex items-center gap-3">
                                        <File className="h-5 w-5 text-slate-400" />
                                        <span className="text-sm text-slate-700 truncate max-w-xs">{file.name}</span>
                                        <span className="text-xs text-slate-400">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                                    </div>
                                    <button onClick={() => removeFile(index)} className="text-slate-400 hover:text-red-500">
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            ))}

                            <Button
                                onClick={handleUpload}
                                className="w-full mt-4 bg-amber-500 hover:bg-amber-600 text-white"
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
