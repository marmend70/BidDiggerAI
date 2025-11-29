import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload as UploadIcon, File, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface UploadProps {
    onUpload: (files: File[]) => Promise<void>;
    isUploading: boolean;
}

export function Upload({ onUpload, isUploading }: UploadProps) {
    const [files, setFiles] = React.useState<File[]>([]);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        setFiles(prev => [...prev, ...acceptedFiles]);
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

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
                    <div
                        {...getRootProps()}
                        className={cn(
                            "border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors",
                            isDragActive ? "border-amber-500 bg-amber-50" : "border-slate-200 hover:border-slate-300"
                        )}
                    >
                        <input {...getInputProps()} />
                        <div className="flex flex-col items-center gap-2">
                            <div className="p-4 bg-slate-100 rounded-full">
                                <UploadIcon className="h-8 w-8 text-slate-500" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-900">
                                {isDragActive ? "Rilascia i file qui" : "Carica Documenti di Gara"}
                            </h3>
                            <p className="text-sm text-slate-500">
                                Trascina i file PDF qui, o clicca per selezionarli
                            </p>
                        </div>
                    </div>

                    {files.length > 0 && (
                        <div className="mt-6 space-y-3">
                            <h4 className="text-sm font-medium text-slate-900">File Selezionati</h4>
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
