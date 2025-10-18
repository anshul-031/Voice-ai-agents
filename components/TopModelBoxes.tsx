// 'use client';

// import { ModelConfig } from '@/types';

// interface TopModelBoxesProps {
//     config: ModelConfig;
// }

// export default function TopModelBoxes({ config }: TopModelBoxesProps) {
//     const models = [
//         {
//             type: 'LLM',
//             name: config.llmModel,
//         },
//         {
//             type: 'STT',
//             name: config.sttModel,
//         },
//         {
//             type: 'TTS',
//             name: config.ttsModel,
//         }
//     ];

//     return (
//         <div className="bg-slate-800 rounded-md p-4 mb-4">
//             <h2 className="text-lg font-medium text-white mb-3">
//                 Model Configuration
//             </h2>

//             <div className="space-y-3">
//                 {models.map((model) => (
//                     <div key={model.type} className="bg-slate-700 rounded-md p-3">
//                         <div className="flex items-center justify-between">
//                             <div>
//                                 <h3 className="text-sm font-medium text-white">{model.type}</h3>
//                             </div>
//                             <div>
//                                 <p className="text-sm text-white">{model.name}</p>
//                             </div>
//                         </div>
//                     </div>
//                 ))}
//             </div>
//         </div>
//     );
// }

import { motion } from 'framer-motion';
import { Brain, Mic, Sparkles, Volume2 } from 'lucide-react';
import type { ModelConfig } from '../types';

interface TopModelBoxesProps {
    config: ModelConfig;
}

export default function TopModelBoxes({ config }: TopModelBoxesProps) {
    const models = [
        {
            type: 'LLM',
            name: config.llmModel,
            icon: Brain,
            gradient: 'from-blue-500 via-blue-600 to-blue-700',
            glowColor: 'rgba(59, 130, 246, 0.5)',
        },
        {
            type: 'STT',
            name: config.sttModel,
            icon: Mic,
            gradient: 'from-blue-400 via-blue-500 to-blue-600',
            glowColor: 'rgba(96, 165, 250, 0.5)',
        },
        {
            type: 'TTS',
            name: config.ttsModel,
            icon: Volume2,
            gradient: 'from-blue-600 via-blue-700 to-blue-800',
            glowColor: 'rgba(37, 99, 235, 0.5)',
        },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="glass-panel rounded-2xl p-6 mb-6 border border-blue-500/20 shadow-2xl"
        >
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                    <div className="w-1.5 h-8 bg-gradient-to-b from-blue-400 via-blue-500 to-blue-600 rounded-full shadow-lg glow-blue"></div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        Model Configuration
                    </h2>
                </div>
                <div className="flex items-center gap-2 glass-card px-3 py-1.5 rounded-lg">
                    <Sparkles size={14} className="text-blue-400" />
                    <span className="text-xs font-semibold text-gray-300">AI Models</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {models.map((model, index) => {
                    const Icon = model.icon;
                    return (
                        <motion.div
                            key={model.type}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1, duration: 0.4 }}
                            whileHover={{ y: -4, transition: { duration: 0.2 } }}
                            className="relative group glass-card rounded-xl p-4 border border-blue-400/20 hover:border-blue-400/40 transition-all duration-300 overflow-hidden"
                        >
                            {/* Hover glow effect */}
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                                style={{
                                    background: `radial-gradient(circle at center, ${model.glowColor} 0%, transparent 70%)`,
                                }}
                            />

                            <div className="relative z-10 flex items-center gap-3">
                                <motion.div
                                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${model.gradient} flex items-center justify-center shadow-lg`}
                                    whileHover={{ rotate: [0, -10, 10, -10, 0], scale: 1.1 }}
                                    transition={{ duration: 0.5 }}
                                    style={{
                                        boxShadow: `0 4px 20px ${model.glowColor}`,
                                    }}
                                >
                                    <Icon className="text-white drop-shadow-lg" size={22} />
                                </motion.div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-xs font-bold text-blue-300 mb-1 uppercase tracking-wider">{model.type}</h3>
                                    <p className="text-sm text-white font-semibold truncate">{model.name}</p>
                                </div>
                            </div>

                            {/* Glass shine overlay */}
                            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />

                            {/* Animated border shimmer */}
                            <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                                <div className="absolute inset-0 rounded-xl shimmer" />
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </motion.div>
    );
}
