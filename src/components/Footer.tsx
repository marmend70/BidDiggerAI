import React, { useState } from 'react';
import { Mail } from 'lucide-react';
import { TERMS_AND_CONDITIONS, PRIVACY_POLICY, COOKIE_POLICY } from '@/constants/legalText';
import { LegalModal } from './LegalModal';

export function Footer({ onOpenContact }: { onOpenContact?: () => void }) {
    const [modalOpen, setModalOpen] = useState<'APP_TERMS' | 'PRIVACY' | 'COOKIE' | null>(null);

    const openModal = (type: 'APP_TERMS' | 'PRIVACY' | 'COOKIE') => {
        setModalOpen(type);
    };

    const closeModal = () => {
        setModalOpen(null);
    };

    const getModalContent = () => {
        switch (modalOpen) {
            case 'APP_TERMS':
                return { title: 'Termini e Condizioni', content: TERMS_AND_CONDITIONS };
            case 'PRIVACY':
                return { title: 'Privacy Policy', content: PRIVACY_POLICY };
            case 'COOKIE':
                return { title: 'Cookie Policy', content: COOKIE_POLICY };
            default:
                return { title: '', content: '' };
        }
    };

    const { title, content } = getModalContent();

    return (
        <>
            <footer className="bg-white border-t border-slate-200 py-6 mt-auto">
                <div className="max-w-7xl mx-auto px-4 md:px-6 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-500">
                    <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        <span>Contatti:</span>
                        <a href="mailto:mm.infoapps@gmail.com" className="text-slate-700 hover:text-blue-600 font-medium transition-colors">
                            mm.infoapps@gmail.com
                        </a>
                    </div>

                    <div className="flex flex-wrap justify-center gap-6">
                        <button
                            onClick={() => openModal('APP_TERMS')}
                            className="hover:text-blue-600 hover:underline transition-colors"
                        >
                            Termini e Condizioni
                        </button>
                        <button
                            onClick={() => openModal('PRIVACY')}
                            className="hover:text-blue-600 hover:underline transition-colors"
                        >
                            Privacy Policy
                        </button>
                        <button
                            onClick={() => openModal('COOKIE')}
                            className="hover:text-blue-600 hover:underline transition-colors"
                        >
                            Cookie Policy
                        </button>
                        <button
                            onClick={() => onOpenContact?.()}
                            className="hover:text-blue-600 hover:underline transition-colors"
                        >
                            Contatti
                        </button>
                    </div>

                    <div className="text-xs text-slate-400">
                        &copy; {new Date().getFullYear()} Bid Digger AI
                    </div>
                </div>
            </footer>

            <LegalModal
                isOpen={!!modalOpen}
                onClose={closeModal}
                title={title}
                content={content}
            />
        </>
    );
}
