import React from 'react';
import { AVAILABLE_MODELS } from '@/constants';
import { Badge } from '@/components/ui/badge';
import { CheckSquare, Bot, BrainCircuit, Database } from 'lucide-react';

interface ModelSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (structuredModelId: string, semanticModelId: string) => void;
    defaultStructuredModelId?: string;
    defaultSemanticModelId?: string;
}

export function ModelSelectionModal({ isOpen, onClose, onConfirm, defaultStructuredModelId, defaultSemanticModelId }: ModelSelectionModalProps) {
    const [selectedStructuredId, setSelectedStructuredId] = React.useState<string>(defaultStructuredModelId || 'gemini-2.5-flash');
    const [selectedSemanticId, setSelectedSemanticId] = React.useState<string>(defaultSemanticModelId || 'gpt-5-mini');

    React.useEffect(() => {
        if (defaultStructuredModelId) setSelectedStructuredId(defaultStructuredModelId);
        if (defaultSemanticModelId) setSelectedSemanticId(defaultSemanticModelId);
    }, [defaultStructuredModelId, defaultSemanticModelId]);

    if (!isOpen) return null;

    const structuredModels = AVAILABLE_MODELS.filter(m => m.type === 'structured');
    const semanticModels = AVAILABLE_MODELS.filter(m => m.type === 'semantic');

    const selectedStructured = AVAILABLE_MODELS.find(m => m.id === selectedStructuredId);
    const selectedSemantic = AVAILABLE_MODELS.find(m => m.id === selectedSemanticId);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                <div className="p-6 border-b flex items-center justify-between bg-slate-50">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-100 p-2 rounded-lg">
                            <Bot className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">Configurazione Modelli AI</h2>
                            <p className="text-sm text-slate-500">Seleziona i modelli per l'estrazione dati e l'analisi semantica.</p>
                        </div>
                    </div>
                </div>

                <div className="p-6 overflow-y-auto flex-1 grid md:grid-cols-2 gap-8">
                    {/* Structured Column */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-4">
                            <Database className="h-5 w-5 text-emerald-600" />
                            <h3 className="font-semibold text-slate-800">1. Estrazione Strutturata</h3>
                        </div>
                        <div className="grid gap-3">
                            {structuredModels.map((model) => (
                                <div
                                    key={model.id}
                                    className={`cursor-pointer rounded-lg border p-4 transition-all hover:shadow-md relative ${selectedStructuredId === model.id
                                        ? 'border-emerald-600 bg-emerald-50 ring-2 ring-emerald-600 ring-offset-2'
                                        : (model as any).isRecommended
                                            ? 'border-amber-400 bg-amber-50/30'
                                            : 'border-slate-200 bg-white hover:border-emerald-300'
                                        }`}
                                    onClick={() => setSelectedStructuredId(model.id)}
                                >
                                    {(model as any).isRecommended && (
                                        <Badge className="absolute -top-2 -right-2 bg-amber-500 hover:bg-amber-600 text-white border-none shadow-sm text-[10px]">
                                            Consigliato
                                        </Badge>
                                    )}
                                    <div className="flex items-center justify-between mb-1">
                                        <h4 className="font-semibold text-slate-900">{model.name}</h4>
                                        {selectedStructuredId === model.id && (
                                            <CheckSquare className="h-5 w-5 text-emerald-600" />
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-500 mb-2 min-h-[32px]">{model.description}</p>
                                    <div className="flex gap-2 text-[10px]">
                                        <Badge variant="secondary" className="bg-slate-100 text-slate-700">
                                            {model.speed}
                                        </Badge>
                                        <Badge variant="secondary" className="bg-slate-100 text-slate-700">
                                            {model.cost}
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Semantic Column */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-4">
                            <BrainCircuit className="h-5 w-5 text-purple-600" />
                            <h3 className="font-semibold text-slate-800">2. Analisi Semantica</h3>
                        </div>
                        <div className="grid gap-3">
                            {semanticModels.map((model) => (
                                <div
                                    key={model.id}
                                    className={`cursor-pointer rounded-lg border p-4 transition-all hover:shadow-md relative ${selectedSemanticId === model.id
                                        ? 'border-purple-600 bg-purple-50 ring-2 ring-purple-600 ring-offset-2'
                                        : (model as any).isRecommended
                                            ? 'border-amber-400 bg-amber-50/30'
                                            : 'border-slate-200 bg-white hover:border-purple-300'
                                        }`}
                                    onClick={() => setSelectedSemanticId(model.id)}
                                >
                                    {(model as any).isRecommended && (
                                        <Badge className="absolute -top-2 -right-2 bg-amber-500 hover:bg-amber-600 text-white border-none shadow-sm text-[10px]">
                                            Consigliato
                                        </Badge>
                                    )}
                                    <div className="flex items-center justify-between mb-1">
                                        <h4 className="font-semibold text-slate-900">{model.name}</h4>
                                        {selectedSemanticId === model.id && (
                                            <CheckSquare className="h-5 w-5 text-purple-600" />
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-500 mb-2 min-h-[32px]">{model.description}</p>
                                    <div className="flex gap-2 text-[10px]">
                                        <Badge variant="secondary" className="bg-slate-100 text-slate-700">
                                            {model.speed}
                                        </Badge>
                                        <Badge variant="secondary" className="bg-slate-100 text-slate-700">
                                            {model.cost}
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t bg-slate-50 flex justify-between items-center">
                    <div className="text-sm text-slate-500 flex flex-col">
                        <span>Strutturato: <span className="font-semibold text-slate-900">{selectedStructured?.name}</span></span>
                        <span>Semantico: <span className="font-semibold text-slate-900">{selectedSemantic?.name}</span></span>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors font-medium"
                        >
                            Annulla
                        </button>
                        <button
                            onClick={() => onConfirm(selectedStructuredId, selectedSemanticId)}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-bold shadow-lg shadow-blue-200"
                        >
                            Avvia Analisi Completa
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
