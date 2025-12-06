import { X, Scale } from 'lucide-react';
import ReactMarkDown from 'react-markdown';

interface LegalModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    content: string;
}

export function LegalModal({ isOpen, onClose, title, content }: LegalModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50">
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <Scale className="h-5 w-5 text-slate-500" />
                        {title}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 transition-colors p-1 hover:bg-slate-200 rounded-full"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 text-slate-700 leading-relaxed text-sm">
                    <div className="prose prose-slate max-w-none prose-sm prose-h3:text-slate-900 prose-h3:font-bold prose-p:text-slate-700 prose-ul:list-disc prose-li:text-slate-700">
                        <ReactMarkDown>
                            {content}
                        </ReactMarkDown>
                    </div>
                </div>

                <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-white border border-slate-300 text-slate-700 font-medium rounded-md hover:bg-slate-100 transition-colors"
                    >
                        Chiudi
                    </button>
                </div>
            </div>
        </div>
    );
}
