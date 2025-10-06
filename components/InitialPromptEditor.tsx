// 'use client';

// interface InitialPromptEditorProps {
//     value: string;
//     onChange: (value: string) => void;
// }

// export default function InitialPromptEditor({ value, onChange }: InitialPromptEditorProps) {
//     const characterCount = value.length;
//     const maxCharacters = 1000;

//     return (
//         <div className="bg-slate-800 rounded-md p-4 mb-4">
//             <div className="flex items-center justify-between mb-3">
//                 <label htmlFor="initial-prompt" className="text-base font-medium text-white">
//                     System Prompt
//                 </label>

//                 <div className="text-xs text-gray-400">
//                     <span className={`
//                         ${characterCount > maxCharacters * 0.8 ? 'text-yellow-500' : ''} 
//                         ${characterCount > maxCharacters ? 'text-red-500' : ''}
//                     `}>
//                         {characterCount}
//                     </span>
//                     <span>/{maxCharacters}</span>
//                 </div>
//             </div>

//             <div className="relative">
//                 <textarea
//                     id="initial-prompt"
//                     value={value}
//                     onChange={(e) => onChange(e.target.value)}
//                     placeholder="Define how the AI should behave and respond..."
//                     className="w-full px-4 py-3 border border-slate-600 bg-slate-700 text-white placeholder-gray-400 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
//                     rows={5}
//                     maxLength={maxCharacters}
//                 />
//             </div>

//             {/* Quick prompt suggestions */}
//             <div className="mt-3">
//                 <div className="flex flex-wrap gap-2 mt-2">
//                     {[
//                         "Professional & Empathetic",
//                         "Focus on Solutions",
//                         "Clear Communication",
//                         "Payment Assistance"
//                     ].map((suggestion) => (
//                         <button
//                             key={suggestion}
//                             onClick={() => {
//                                 const prompts = {
//                                     "Professional & Empathetic": "You are a professional and empathetic EMI collection assistant. Always approach customers with understanding while helping them find practical payment solutions.",
//                                     "Focus on Solutions": "You are a solution-focused AI assistant specializing in EMI collections. Provide clear, actionable guidance and payment alternatives to help customers manage their obligations effectively.",
//                                     "Clear Communication": "You are a clear and direct AI assistant for EMI collection support. Communicate payment information transparently and help customers understand their options without confusion.",
//                                     "Payment Assistance": "You are a helpful payment assistance specialist. Guide customers through EMI collection processes, offer flexible payment plans, and provide financial guidance with patience and clarity."
//                                 };
//                                 onChange(prompts[suggestion as keyof typeof prompts]);
//                             }}
//                             className="px-3 py-1 text-xs bg-slate-700 text-white rounded-md border border-slate-600"
//                         >
//                             {suggestion}
//                         </button>
//                     ))}
//                 </div>
//             </div>
//         </div>
//     );
// }

interface InitialPromptEditorProps {
    value: string;
    onChange: (value: string) => void;
}

export default function InitialPromptEditor({ value, onChange }: InitialPromptEditorProps) {
    const characterCount = value.length;
    const maxCharacters = 1000;

    const suggestions = [
        {
            label: "Professional & Empathetic",
            prompt: "You are a professional and empathetic EMI collection assistant. Always approach customers with understanding while helping them find practical payment solutions."
        },
        {
            label: "Focus on Solutions",
            prompt: "You are a solution-focused AI assistant specializing in EMI collections. Provide clear, actionable guidance and payment alternatives to help customers manage their obligations effectively."
        },
        {
            label: "Clear Communication",
            prompt: "You are a clear and direct AI assistant for EMI collection support. Communicate payment information transparently and help customers understand their options without confusion."
        },
        {
            label: "Payment Assistance",
            prompt: "You are a helpful payment assistance specialist. Guide customers through EMI collection processes, offer flexible payment plans, and provide financial guidance with patience and clarity."
        }
    ];

    return (
        <div className="bg-slate-800 rounded-lg p-4 mb-4 border border-slate-700 shadow-lg">
            <div className="flex items-center justify-between mb-3">
                <label htmlFor="initial-prompt" className="text-base font-semibold text-white flex items-center gap-2">
                    <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full"></div>
                    System Prompt
                </label>

                <div className="text-xs text-gray-400">
                    <span className={`font-mono ${characterCount > maxCharacters * 0.8 ? 'text-yellow-500' : ''}
            ${characterCount > maxCharacters ? 'text-red-500' : ''}
          `}>
                        {characterCount}
                    </span>
                    <span className="text-gray-500">/{maxCharacters}</span>
                </div>
            </div>

            <div className="relative">
                <textarea
                    id="initial-prompt"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="Define how the AI should behave and respond..."
                    className="w-full px-4 py-3 border border-slate-600 bg-slate-700/50 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none transition-all"
                    rows={5}
                    maxLength={maxCharacters}
                />
            </div>

            <div className="mt-3">
                <p className="text-xs text-gray-400 mb-2">Quick Templates:</p>
                <div className="flex flex-wrap gap-2">
                    {suggestions.map((suggestion) => (
                        <button
                            key={suggestion.label}
                            onClick={() => onChange(suggestion.prompt)}
                            className="px-3 py-1.5 text-xs bg-slate-700 text-white rounded-lg border border-slate-600 hover:border-blue-500 hover:bg-slate-600 transition-all"
                        >
                            {suggestion.label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
