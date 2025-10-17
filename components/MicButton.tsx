// 'use client';

// import { Mic, Square } from 'lucide-react';

// interface MicButtonProps {
//     isListening: boolean;
//     isOpen: boolean;
//     onToggle: () => void;
// }

// export default function MicButton({ isListening, isOpen, onToggle }: MicButtonProps) {
//     return (
//         <div className="relative">
//             <button
//                 onClick={onToggle}
//                 aria-label={isOpen ? 'Stop recording' : 'Start recording'}
//                 className={`
//                     flex items-center justify-center w-10 h-10 rounded-lg
//                     ${isListening
//                         ? 'bg-red-600'
//                         : isOpen
//                             ? 'bg-slate-600'
//                             : 'bg-blue-600'
//                     }
//                 `}
//                 title={isOpen ? 'Stop recording' : 'Start recording'}
//             >
//                 {isListening ? (
//                     <Square className="h-5 w-5 text-white" />
//                 ) : (
//                     <Mic className="h-5 w-5 text-white" />
//                 )}
//             </button>

//             <div
//                 className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border border-white ${isListening ? 'bg-red-500' :
//                     isOpen ? 'bg-yellow-500' :
//                         'bg-green-500'
//                     }`}
//             />
//         </div>
//     );
// }

import { motion } from 'framer-motion';
import { Mic, Square } from 'lucide-react';

interface MicButtonProps {
    isListening: boolean;
    isOpen: boolean;
    onToggle: () => void;
}

export default function MicButton({ isListening, isOpen, onToggle }: MicButtonProps) {
    return (
        <div className="relative">
            {/* Glow rings when listening */}
            {isListening && (
                <>
                    <motion.div
                        className="absolute inset-0 rounded-xl bg-red-500/30 blur-xl"
                        animate={{
                            scale: [1, 1.3, 1],
                            opacity: [0.5, 0, 0.5],
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                    />
                    <motion.div
                        className="absolute inset-0 rounded-xl bg-red-500/20 blur-2xl"
                        animate={{
                            scale: [1, 1.5, 1],
                            opacity: [0.3, 0, 0.3],
                        }}
                        transition={{
                            duration: 2.5,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: 0.5
                        }}
                    />
                </>
            )}

            <motion.button
                onClick={onToggle}
                aria-label={isOpen ? 'Stop recording' : 'Start recording'}
                className={`
                    relative flex items-center justify-center w-16 h-16 rounded-2xl 
                    backdrop-blur-md border-2 transition-all duration-300
                    ${isListening
                        ? 'glass-button border-red-400/50 bg-gradient-to-br from-red-500/40 to-red-600/40 glow-red'
                        : isOpen
                            ? 'glass-button border-blue-400/30 bg-gradient-to-br from-slate-600/40 to-slate-700/40'
                            : 'glass-button border-blue-400/50 bg-gradient-to-br from-blue-500/40 to-blue-600/40 glow-blue'
                    }
                    hover:scale-105 active:scale-95
                    focus-visible:ring-4 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900
                    ${isListening ? 'focus-visible:ring-red-400/50' : 'focus-visible:ring-blue-400/50'}
                `}
                title={isOpen ? 'Stop recording' : 'Start recording'}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.95 }}
            >
                <motion.div
                    animate={isListening ? { rotate: [0, 5, -5, 0] } : {}}
                    transition={isListening ? { duration: 0.6, repeat: Infinity } : {}}
                >
                    {isListening ? (
                        <Square className="h-7 w-7 text-white drop-shadow-lg" />
                    ) : (
                        <Mic className="h-7 w-7 text-white drop-shadow-lg" />
                    )}
                </motion.div>

                {/* Inner glass shine */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none" />
            </motion.button>

            {/* Status indicator dot */}
            <motion.div
                className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 shadow-lg
                    ${isListening ? 'bg-red-500 border-red-300' :
                        isOpen ? 'bg-yellow-400 border-yellow-300' :
                            'bg-green-500 border-green-300'
                    }`}
                animate={isListening ? { 
                    scale: [1, 1.2, 1],
                    boxShadow: [
                        '0 0 0 0 rgba(239, 68, 68, 0.7)',
                        '0 0 0 8px rgba(239, 68, 68, 0)',
                        '0 0 0 0 rgba(239, 68, 68, 0)'
                    ]
                } : {}}
                transition={isListening ? { duration: 1.5, repeat: Infinity } : {}}
            />

            {/* Ripple effect on active */}
            {isListening && (
                <motion.div
                    className="absolute inset-0 rounded-2xl border-2 border-red-400/50"
                    initial={{ scale: 1, opacity: 1 }}
                    animate={{ scale: 1.4, opacity: 0 }}
                    transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeOut"
                    }}
                />
            )}
        </div>
    );
}
