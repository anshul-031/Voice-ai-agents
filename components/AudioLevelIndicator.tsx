'use client';

import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

interface AudioLevelIndicatorProps {
    level: number;
    isListening: boolean;
}

export default function AudioLevelIndicator({ level, isListening }: AudioLevelIndicatorProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameRef = useRef<number | undefined>(undefined);
    const [_barHeights, setBarHeights] = useState<number[]>(Array(64).fill(5));
    const percentage = Math.min(100, level * 1000);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set canvas size
        const updateCanvasSize = () => {
            const rect = canvas.getBoundingClientRect();
            canvas.width = rect.width * window.devicePixelRatio;
            canvas.height = rect.height * window.devicePixelRatio;
            ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        };

        updateCanvasSize();
        window.addEventListener('resize', updateCanvasSize);

        const barCount = 64;
        const currentHeights = Array(barCount).fill(5);
        let targetHeights = Array(barCount).fill(5);
        let phase = 0;

        const animate = () => {
            if (!canvas || !ctx) return;

            const rect = canvas.getBoundingClientRect();
            const width = rect.width;
            const height = rect.height;

            // Clear canvas
            ctx.clearRect(0, 0, width, height);

            const barWidth = (width / barCount) * 0.8;
            const gap = (width / barCount) * 0.2;

            if (isListening && percentage > 0) {
                // Update target heights based on audio level and wave pattern
                for (let i = 0; i < barCount; i++) {
                    const normalizedIndex = i / barCount;

                    // Create multiple wave patterns
                    const wave1 = Math.sin(phase + normalizedIndex * Math.PI * 2) * 0.3;
                    const wave2 = Math.sin(phase * 1.5 + normalizedIndex * Math.PI * 4) * 0.2;
                    const wave3 = Math.cos(phase * 0.8 + normalizedIndex * Math.PI * 6) * 0.15;

                    // Combine waves with audio level
                    const combined = (wave1 + wave2 + wave3 + 1) / 2;
                    const baseHeight = (percentage / 100) * combined;

                    // Add randomness for natural feel
                    const randomFactor = Math.random() * 0.2 + 0.9;
                    targetHeights[i] = Math.max(5, Math.min(95, baseHeight * randomFactor * 100));
                }

                phase += 0.05;
            } else {
                // Return to idle state
                targetHeights = targetHeights.map(() => 5);
            }

            // Smooth transition to target heights
            for (let i = 0; i < barCount; i++) {
                const diff = targetHeights[i] - currentHeights[i];
                currentHeights[i] += diff * 0.15; // Smooth easing
            }

            setBarHeights([...currentHeights]);

            // Draw bars
            for (let i = 0; i < barCount; i++) {
                const x = i * (barWidth + gap);
                const barHeight = (currentHeights[i] / 100) * height;
                const y = height - barHeight;

                // Create gradient based on height
                const gradient = ctx.createLinearGradient(x, y, x, height);

                if (isListening) {
                    const intensity = currentHeights[i] / 100;
                    gradient.addColorStop(0, `rgba(34, 211, 238, ${0.8 * intensity})`); // Cyan
                    gradient.addColorStop(0.5, `rgba(59, 130, 246, ${0.9 * intensity})`); // Blue
                    gradient.addColorStop(1, `rgba(34, 197, 94, ${1 * intensity})`); // Green
                } else {
                    gradient.addColorStop(0, 'rgba(71, 85, 105, 0.3)');
                    gradient.addColorStop(1, 'rgba(51, 65, 85, 0.5)');
                }

                ctx.fillStyle = gradient;

                // Draw rounded rectangle
                const radius = barWidth / 2;
                ctx.beginPath();
                ctx.moveTo(x + radius, y);
                ctx.lineTo(x + barWidth - radius, y);
                ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + radius);
                ctx.lineTo(x + barWidth, height - radius);
                ctx.quadraticCurveTo(x + barWidth, height, x + barWidth - radius, height);
                ctx.lineTo(x + radius, height);
                ctx.quadraticCurveTo(x, height, x, height - radius);
                ctx.lineTo(x, y + radius);
                ctx.quadraticCurveTo(x, y, x + radius, y);
                ctx.closePath();
                ctx.fill();

                // Add glow effect when active
                if (isListening && currentHeights[i] > 20) {
                    ctx.shadowBlur = 10;
                    ctx.shadowColor = 'rgba(59, 130, 246, 0.5)';
                    ctx.fill();
                    ctx.shadowBlur = 0;
                }
            }

            animationFrameRef.current = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
            window.removeEventListener('resize', updateCanvasSize);
        };
    }, [level, isListening, percentage]);

    return (
        <div className="w-full space-y-3">
            {/* Modern Status Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <motion.div
                        className={`w-3 h-3 rounded-full ${
                            isListening ? 'bg-gradient-to-br from-green-400 to-green-500 shadow-lg shadow-green-500/50' : 'bg-white/10'
                        }`}
                        animate={isListening ? { scale: [1, 1.2, 1], opacity: [1, 0.8, 1] } : {}}
                        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                    />
                    <span className="text-xs font-semibold text-white/80">
                        {isListening ? 'Listening' : 'Idle'}
                    </span>
                </div>
                <div className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg backdrop-blur-sm">
                    <span className={`text-xs font-mono font-bold transition-colors ${
                        percentage > 70 ? 'text-green-400' :
                            percentage > 40 ? 'text-blue-400' :
                                'text-white/40'
                    }`}>
                        {percentage.toFixed(0)}%
                    </span>
                </div>
            </div>

            {/* Advanced Canvas-Based Visualizer */}
            <div className="relative w-full h-32 bg-gradient-to-br from-black/60 to-black/30 rounded-2xl overflow-hidden border border-white/5 backdrop-blur-md shadow-2xl">
                {/* Animated Background Glow */}
                {isListening && (
                    <>
                        <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-green-500/5 via-blue-500/15 to-cyan-500/5"
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
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                    </>
                )}

                {/* Canvas Visualizer */}
                <canvas
                    ref={canvasRef}
                    className="absolute inset-0 w-full h-full"
                    style={{ imageRendering: 'crisp-edges' }}
                />

                {/* Active Indicator Overlay */}
                {isListening && percentage > 20 && (
                    <motion.div
                        className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-blue-500/10 to-transparent pointer-events-none"
                        animate={{
                            opacity: [0.4, 0.7, 0.4],
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
