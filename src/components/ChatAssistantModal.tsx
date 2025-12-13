import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, User, Search, RefreshCw, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import ReactMarkdown from 'react-markdown';

interface Message {
    role: 'user' | 'model';
    content: string;
}

interface ChatAssistantModalProps {
    isOpen: boolean;
    onClose: () => void;
    tenderId: string;
    tenderTitle: string;
}

export function ChatAssistantModal({ isOpen, onClose, tenderId, tenderTitle }: ChatAssistantModalProps) {
    const [messages, setMessages] = useState<Message[]>([
        { role: 'model', content: "Ciao! Sono il tuo assistente per questa gara. Come posso aiutarti? Posso analizzare i documenti o cercare informazioni aggiornate su internet (scrivi 'Cerca su internet:')." }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    // RESET CHAT WHEN TENDER CHANGED
    useEffect(() => {
        setMessages([
            { role: 'model', content: "Ciao! Sono il tuo assistente per questa gara. Come posso aiutarti? Posso analizzare i documenti o cercare informazioni aggiornate su internet (scrivi 'Cerca su internet:')." }
        ]);
        setInput('');
        setIsLoading(false);
    }, [tenderId]);

    if (!isOpen) return null;

    const handleSendMessage = async () => {
        if (!input.trim() || isLoading) return;

        const userMsg = input.trim();
        const isSearch = userMsg.toLowerCase().startsWith('cerca su internet:');

        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setIsLoading(true);
        if (isSearch) setIsSearching(true);

        try {
            // Prepare history (excluding the very first welcome message if desired, or keep it)
            // We pass the full history including the new message implicitly handled by the backend logic or explicitly here.
            // The backend expects "messages" including the new one.
            const conversationHistory = [...messages, { role: 'user', content: userMsg }];

            const { data, error } = await supabase.functions.invoke('chat-assistant', {
                body: {
                    tenderId,
                    messages: conversationHistory,
                    model: 'gpt-5-mini' // Default to GPT-5 Mini
                }
            });

            if (error) throw error;

            if (data && data.error) {
                throw new Error(data.error);
            }

            if (data && data.answer) {
                setMessages(prev => [...prev, { role: 'model', content: data.answer }]);
            } else {
                throw new Error("No answer received");
            }

        } catch (error: any) {
            console.error('Chat error:', error);
            const errorMessage = error.message || "Errore sconosciuto";
            setMessages(prev => [...prev, { role: 'model', content: `⚠️ Si è verificato un errore: ${errorMessage}. Riprova tra poco.` }]);
        } finally {
            setIsLoading(false);
            setIsSearching(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-in fade-in zoom-in duration-200">

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950">
                    <div className="flex items-center gap-3">
                        <div className="bg-amber-500/10 p-2 rounded-lg">
                            <Bot className="h-6 w-6 text-amber-500" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white">Bid Digger Assistant</h3>
                            <p className="text-xs text-slate-400 truncate max-w-[200px] sm:max-w-md">
                                {tenderTitle}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-800 rounded-full"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-900/50">
                    {messages.map((msg, idx) => (
                        <div
                            key={idx}
                            className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                        >
                            <div className={`p-2 rounded-full flex-shrink-0 mt-1 ${msg.role === 'user' ? 'bg-slate-700' : 'bg-amber-500/10'
                                }`}>
                                {msg.role === 'user' ? (
                                    <User className="h-4 w-4 text-slate-300" />
                                ) : (
                                    <Bot className="h-4 w-4 text-amber-500" />
                                )}
                            </div>

                            <div className={`rounded-2xl px-4 py-3 max-w-[85%] text-sm leading-relaxed shadow-sm ${msg.role === 'user'
                                ? 'bg-slate-800 text-slate-100 rounded-tr-none border border-slate-700'
                                : 'bg-slate-950 text-slate-300 rounded-tl-none border border-slate-800'
                                }`}>
                                {msg.role === 'model' ? (
                                    <div className="prose prose-invert prose-sm max-w-none">
                                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                                    </div>
                                ) : (
                                    <p className="whitespace-pre-wrap">{msg.content}</p>
                                )}
                            </div>
                        </div>
                    ))}

                    {isLoading && (
                        <div className="flex items-start gap-3">
                            <div className="p-2 rounded-full bg-amber-500/10 flex-shrink-0 mt-1">
                                <Bot className="h-4 w-4 text-amber-500" />
                            </div>
                            <div className="bg-slate-950 rounded-2xl rounded-tl-none px-4 py-3 border border-slate-800 flex items-center gap-3">
                                {isSearching ? (
                                    <>
                                        <Search className="h-4 w-4 text-amber-500 animate-pulse" />
                                        <span className="text-sm text-slate-400 animate-pulse">Ricerca su internet in corso...</span>
                                    </>
                                ) : (
                                    <div className="flex gap-1">
                                        <div className="h-2 w-2 bg-slate-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                        <div className="h-2 w-2 bg-slate-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                        <div className="h-2 w-2 bg-slate-500 rounded-full animate-bounce"></div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-4 bg-slate-950 border-t border-slate-800">
                    <div className="relative flex items-center gap-2">
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Scrivi un messaggio o 'Cerca su internet:'..."
                            className="w-full bg-slate-900 text-white placeholder-slate-500 rounded-xl px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-amber-500/50 border border-slate-700 resize-none h-[50px] max-h-[120px] scrollbar-hide py-3"
                            rows={1}
                        />
                        <button
                            onClick={handleSendMessage}
                            disabled={!input.trim() || isLoading}
                            className="absolute right-2 p-2 bg-amber-500 text-slate-900 rounded-lg hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-amber-500/20"
                        >
                            <Send className="h-4 w-4" />
                        </button>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-2 text-center">
                        Bid Digger Assistant può commettere errori. Verifica le informazioni importanti.
                    </p>
                </div>

            </div>
        </div>
    );
}
