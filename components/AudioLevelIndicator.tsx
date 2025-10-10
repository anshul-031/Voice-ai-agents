'use client';

import { motion } from 'framer-motion';
import { useEffect, useRef } from 'react';

interface AudioLevelIndicatorProps {
    level: number;
    isListening: boolean;
}

export default function AudioLevelIndicator({ level, isListening }: AudioLevelIndicatorProps) {
    const barsRef = useRef<HTMLDivElement[]>([]);
    const percentage = Math.min(100, level * 1000);

    useEffect(() => {
        const bars = barsRef.current;
        if (!bars.length) return;

        const updateBars = () => {
            bars.forEach((bar, index) => {
                if (!bar) return;
                
                const delay = index * 30;
                const randomVariation = Math.random() * 0.4 + 0.7;
                const baseHeight = (percentage / 100) * randomVariation;
                const wave = Math.sin(Date.now() / 200 + index * 0.4) * 0.3 + 0.7;
                const height = Math.min(100, baseHeight * wave * 100);
                
                setTimeout(() => {
                    bar.style.height = `${height}%`;
                }, delay);
            });
        };

        if (isListening) {
            const interval = setInterval(updateBars, 80);
            return () => clearInterval(interval);
        } else {
            bars.forEach(bar => {
                if (bar) bar.style.height = '8%';
            });
        }
    }, [level, isListening, percentage]);

    return (
        <div className="w-full space-y-3">
            {/* Status Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <motion.div
                        className={`w-2.5 h-2.5 rounded-full ${
                            isListening ? 'bg-blue-400' : 'bg-slate-600'
                        }`}
                        animate={isListening ? { scale: [1, 1.3, 1], opacity: [1, 0.7, 1] } : {}}
                        transition={{ duration: 1.5, repeat: Infinity }}
                    />
                    <span className="text-xs font-semibold text-gray-300">
                        {isListening ? 'Audio Active' : 'Audio Idle'}
                    </span>
                </div>
                <div className="glass-card px-3 py-1 rounded-lg">
                    <span className={`text-xs font-mono font-bold ${
                        percentage > 70 ? 'text-blue-400' : 
                        percentage > 40 ? 'text-blue-300' : 
                        'text-gray-400'
                    }`}>
                        {percentage.toFixed(0)}%
                    </span>
                </div>
            </div>
            
            {/* Enhanced Visualizer with Glass Effect */}
            <div className="relative w-full h-20 glass-card rounded-2xl overflow-hidden p-3 border border-blue-500/20">
                {/* Animated Background Gradient */}
                {isListening && (
                    <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-blue-400/5 to-blue-500/10"
                        animate={{
                            backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                        }}
                        transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: 'linear',
                        }}
                        style={{ backgroundSize: '200% 200%' }}
                    />
                )}
                
                {/* Frequency Bars */}
                <div className="relative flex items-end justify-center gap-1 h-full z-10">
                    {[...Array(32)].map((_, i) => (
                        <div
                            key={i}
                            ref={(el) => {
                                if (el) barsRef.current[i] = el;
                            }}
                            className={`flex-1 rounded-full transition-all duration-150 ${
                                isListening
                                    ? 'bg-gradient-to-t from-blue-600 via-blue-400 to-blue-300'
                                    : 'bg-gradient-to-t from-slate-700 to-slate-600'
                            }`}
                            style={{
                                height: '8%',
                                minHeight: '3px',
                                maxWidth: '6px',
                                boxShadow: isListening ? '0 0 8px rgba(59, 130, 246, 0.6)' : 'none',
                            }}
                        />
                    ))}
                </div>
                
                {/* Glow Overlay when Active */}
                {isListening && percentage > 30 && (
                    <motion.div
                        className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-blue-500/20 to-transparent pointer-events-none"
                        animate={{
                            opacity: [0.3, 0.6, 0.3],
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: 'easeInOut',
                        }}
                    />
                )}
            </div>

            {/* Level Warning */}
            {percentage > 85 && isListening && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 text-xs text-blue-400"
                >
                    <span className="animate-pulse">⚡</span>
                    <span>High audio level detected</span>
                </motion.div>
            )}
        </div>
    );
}
