'use client';

import { Mic, Square } from 'lucide-react';

interface MicButtonProps {
    isListening: boolean;
    isOpen: boolean;
    onToggle: () => void;
}

export default function MicButton({ isListening, isOpen, onToggle }: MicButtonProps) {
    return (
        <div className="relative">
            <button
                onClick={onToggle}
                aria-label={isOpen ? 'Stop recording' : 'Start recording'}
                className={`
                    flex items-center justify-center w-10 h-10 rounded-lg
                    ${isListening
                        ? 'bg-red-600'
                        : isOpen
                            ? 'bg-slate-600'
                            : 'bg-blue-600'
                    }
                `}
                title={isOpen ? 'Stop recording' : 'Start recording'}
            >
                {isListening ? (
                    <Square className="h-5 w-5 text-white" />
                ) : (
                    <Mic className="h-5 w-5 text-white" />
                )}
            </button>

            <div
                className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border border-white ${isListening ? 'bg-red-500' :
                        isOpen ? 'bg-yellow-500' :
                            'bg-green-500'
                    }`}
            />
        </div>
    );
}