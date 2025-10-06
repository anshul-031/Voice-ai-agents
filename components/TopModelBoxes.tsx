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

import { ModelConfig } from '../types';
import { Brain, Mic, Volume2 } from 'lucide-react';

interface TopModelBoxesProps {
    config: ModelConfig;
}

export default function TopModelBoxes({ config }: TopModelBoxesProps) {
    const models = [
        {
            type: 'LLM',
            name: config.llmModel,
            icon: Brain,
            color: 'from-purple-500 to-purple-600',
        },
        {
            type: 'STT',
            name: config.sttModel,
            icon: Mic,
            color: 'from-green-500 to-green-600',
        },
        {
            type: 'TTS',
            name: config.ttsModel,
            icon: Volume2,
            color: 'from-orange-500 to-orange-600',
        }
    ];

    return (
        <div className="bg-slate-800 rounded-lg p-4 mb-4 border border-slate-700 shadow-lg">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full"></div>
                Model Configuration
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {models.map((model) => {
                    const Icon = model.icon;
                    return (
                        <div key={model.type} className="bg-slate-700/50 rounded-lg p-4 border border-slate-600 hover:border-slate-500 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${model.color} flex items-center justify-center shadow-md`}>
                                    <Icon className="text-white" size={20} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-xs font-medium text-gray-400 mb-1">{model.type}</h3>
                                    <p className="text-sm text-white font-medium truncate">{model.name}</p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
