import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, Send, Loader2, Bot } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface DeepDiveProps {
    sectionId: string;
    existingQA?: Array<{ question: string; answer: string; timestamp: string }>;
    onAskQuestion: (sectionId: string, question: string) => void;
    isGlobalLoading: boolean;
    exampleQuestion?: string;
}

export function DeepDive({ sectionId, existingQA = [], onAskQuestion, isGlobalLoading, exampleQuestion }: DeepDiveProps) {
    const [question, setQuestion] = useState('');

    const handleSubmit = () => {
        if (!question.trim()) return;
        onAskQuestion(sectionId, question);
        setQuestion('');
    };

    return (
        <div className="mt-8 space-y-6">
            <div className="flex items-center gap-2 mb-4">
                <MessageSquare className="h-6 w-6 text-indigo-600" />
                <h3 className="text-xl font-bold text-slate-900">Approfondimenti AI</h3>
            </div>

            {/* List of existing Q&A */}
            <div className="space-y-4">
                {existingQA.map((qa, index) => (
                    <Card key={index} className="border-l-4 border-l-indigo-500 bg-slate-50">
                        <CardContent className="pt-6 space-y-4">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <Badge variant="outline" className="bg-white text-slate-600">Domanda</Badge>
                                    <span className="text-xs text-slate-400">{new Date(qa.timestamp).toLocaleString()}</span>
                                </div>
                                <p className="text-slate-800 font-medium">{qa.question}</p>
                            </div>
                            <div className="pl-4 border-l-2 border-slate-200">
                                <div className="flex items-center gap-2 mb-1">
                                    <Bot className="h-4 w-4 text-indigo-600" />
                                    <span className="text-xs text-indigo-600 font-semibold">Risposta AI</span>
                                </div>
                                <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">{qa.answer}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Input Area */}
            <Card className="border-dashed border-2 border-slate-200 shadow-none">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base font-medium text-slate-600 flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        Fai una richiesta di approfondimento su questa sezione
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-4">
                        <Textarea
                            placeholder={exampleQuestion || "Es. 'Ci sono penali specifiche per il ritardo nella consegna?'"}
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            className="min-h-[80px] resize-none"
                            disabled={isGlobalLoading}
                        />
                        <Button
                            onClick={handleSubmit}
                            disabled={!question.trim() || isGlobalLoading}
                            className="h-auto px-6 bg-indigo-600 hover:bg-indigo-700"
                        >
                            {isGlobalLoading ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                <Send className="h-5 w-5" />
                            )}
                        </Button>
                    </div>
                    {isGlobalLoading && (
                        <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Analisi in corso... attendere il completamento della richiesta corrente.
                        </p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
