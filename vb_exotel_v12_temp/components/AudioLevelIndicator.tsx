'use client';

interface AudioLevelIndicatorProps {
    level: number;
    isListening: boolean;
}

export default function AudioLevelIndicator({ level, isListening }: AudioLevelIndicatorProps) {
    // Convert RMS level (0-1) to percentage
    const percentage = Math.min(100, level * 1000); // Scale up for visibility

    return (
        <div className="w-full">
            <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-gray-400">Audio Level:</span>
                <span className="text-xs font-mono text-white">
                    {level.toFixed(4)}
                </span>
            </div>
            <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                    className={`h-full transition-all duration-100 ${isListening
                        ? percentage > 0.5 ? 'bg-green-500' : 'bg-yellow-500'
                        : 'bg-gray-500'
                        }`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
}
