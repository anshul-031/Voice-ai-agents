// 'use client';

// import { motion, AnimatePresence } from 'framer-motion';
// import { AlertTriangle } from 'lucide-react';

// interface ConfirmDialogProps {
//     isOpen: boolean;
//     title: string;
//     message: string;
//     confirmLabel?: string;
//     cancelLabel?: string;
//     confirmColor?: 'red' | 'blue';
//     onConfirm: () => void;
//     onCancel: () => void;
// }

// export default function ConfirmDialog({
//     isOpen,
//     title,
//     message,
//     confirmLabel = 'Confirm',
//     cancelLabel = 'Cancel',
//     confirmColor = 'red',
//     onConfirm,
//     onCancel,
// }: ConfirmDialogProps) {
//     return (
//         <AnimatePresence>
//             {isOpen && (
//                 <>
//                     {/* Backdrop */}
//                     <motion.div
//                         className="fixed inset-0 bg-black/50 z-40"
//                         initial={{ opacity: 0 }}
//                         animate={{ opacity: 1 }}
//                         exit={{ opacity: 0 }}
//                         onClick={onCancel}
//                     />

//                     {/* Modal */}
//                     <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
//                         <motion.div
//                             className="bg-slate-800 rounded-lg shadow-xl max-w-md w-full border border-slate-700"
//                             initial={{ opacity: 0, scale: 0.9, y: 20 }}
//                             animate={{ opacity: 1, scale: 1, y: 0 }}
//                             exit={{ opacity: 0, scale: 0.9, y: 20 }}
//                             transition={{ type: 'spring', duration: 0.3 }}
//                         >
//                             {/* Header */}
//                             <div className="flex items-center gap-3 p-4 border-b border-slate-700">
//                                 <div className="flex items-center justify-center w-10 h-10 rounded-full bg-yellow-500/20">
//                                     <AlertTriangle className="text-yellow-500" size={20} />
//                                 </div>
//                                 <h3 className="text-lg font-semibold text-white">{title}</h3>
//                             </div>

//                             {/* Content */}
//                             <div className="p-4">
//                                 <p className="text-gray-300">{message}</p>
//                             </div>

//                             {/* Actions */}
//                             <div className="flex items-center justify-end gap-3 p-4 border-t border-slate-700">
//                                 <motion.button
//                                     onClick={onCancel}
//                                     className="px-4 py-2 text-sm font-medium text-gray-300 bg-slate-700 hover:bg-slate-600 rounded transition-colors"
//                                     whileHover={{ scale: 1.02 }}
//                                     whileTap={{ scale: 0.98 }}
//                                 >
//                                     {cancelLabel}
//                                 </motion.button>
//                                 <motion.button
//                                     onClick={onConfirm}
//                                     className={`px-4 py-2 text-sm font-medium text-white rounded transition-colors ${confirmColor === 'red'
//                                             ? 'bg-red-600 hover:bg-red-700'
//                                             : 'bg-blue-600 hover:bg-blue-700'
//                                         }`}
//                                     whileHover={{ scale: 1.02 }}
//                                     whileTap={{ scale: 0.98 }}
//                                 >
//                                     {confirmLabel}
//                                 </motion.button>
//                             </div>
//                         </motion.div>
//                     </div>
//                 </>
//             )}
//         </AnimatePresence>
//     );
// }


import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    confirmColor?: 'red' | 'blue';
    onConfirm: () => void;
    onCancel: () => void;
}

export default function ConfirmDialog({
    isOpen,
    title,
    message,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    confirmColor = 'red',
    onConfirm,
    onCancel,
}: ConfirmDialogProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onCancel}
                    />

                    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
                        <motion.div
                            className="bg-slate-800 rounded-xl shadow-2xl max-w-md w-full border border-slate-700"
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            transition={{ type: 'spring', duration: 0.3 }}
                        >
                            <div className="flex items-start gap-4 p-6 border-b border-slate-700">
                                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-yellow-500/20 flex-shrink-0">
                                    <AlertTriangle className="text-yellow-500" size={24} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-white mb-1">{title}</h3>
                                    <p className="text-gray-300 text-sm leading-relaxed">{message}</p>
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 p-4 bg-slate-750">
                                <motion.button
                                    onClick={onCancel}
                                    className="px-5 py-2.5 text-sm font-medium text-gray-300 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    {cancelLabel}
                                </motion.button>
                                <motion.button
                                    onClick={onConfirm}
                                    className={`px-5 py-2.5 text-sm font-medium text-white rounded-lg transition-colors shadow-lg ${confirmColor === 'red'
                                        ? 'bg-red-600 hover:bg-red-700'
                                        : 'bg-blue-600 hover:bg-blue-700'
                                        }`}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    {confirmLabel}
                                </motion.button>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}
