'use client';

import { ModelConfig } from '@/types';

interface TopModelBoxesProps {
    config: ModelConfig;
}

export default function TopModelBoxes({ config }: TopModelBoxesProps) {
    const models = [
        {
            type: 'LLM',
            name: config.llmModel,
        },
        {
            type: 'STT',
            name: config.sttModel,
        },
        {
            type: 'TTS',
            name: config.ttsModel,
        }
    ];

    return (
        <div className="bg-slate-800 rounded-md p-4 mb-4">
            <h2 className="text-lg font-medium text-white mb-3">
                Model Configuration
            </h2>

            <div className="space-y-3">
                {models.map((model) => (
                    <div key={model.type} className="bg-slate-700 rounded-md p-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-medium text-white">{model.type}</h3>
                            </div>
                            <div>
                                <p className="text-sm text-white">{model.name}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}