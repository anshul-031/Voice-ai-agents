'use client';

interface InitialPromptEditorProps {
    value: string;
    onChange: (value: string) => void;
}

export default function InitialPromptEditor({ value, onChange }: InitialPromptEditorProps) {
    const characterCount = value.length;
    const maxCharacters = 1000;

    return (
        <div className="bg-slate-800 rounded-md p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
                <label htmlFor="initial-prompt" className="text-base font-medium text-white">
                    System Prompt
                </label>

                <div className="text-xs text-gray-400">
                    <span className={`
                        ${characterCount > maxCharacters * 0.8 ? 'text-yellow-500' : ''} 
                        ${characterCount > maxCharacters ? 'text-red-500' : ''}
                    `}>
                        {characterCount}
                    </span>
                    <span>/{maxCharacters}</span>
                </div>
            </div>

            <div className="relative">
                <textarea
                    id="initial-prompt"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="Define how the AI should behave and respond..."
                    className="w-full px-4 py-3 border border-slate-600 bg-slate-700 text-white placeholder-gray-400 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    rows={5}
                    maxLength={maxCharacters}
                />
            </div>

            {/* Quick prompt suggestions */}
            <div className="mt-3">
                <div className="flex flex-wrap gap-2 mt-2">
                    {[
                        "Professional & Empathetic",
                        "Focus on Solutions",
                        "Clear Communication",
                        "Payment Assistance"
                    ].map((suggestion) => (
                        <button
                            key={suggestion}
                            onClick={() => {
                                const prompts = {
                                    "Professional & Empathetic": "You are a professional and empathetic EMI collection assistant. Always approach customers with understanding while helping them find practical payment solutions.",
                                    "Focus on Solutions": "You are a solution-focused AI assistant specializing in EMI collections. Provide clear, actionable guidance and payment alternatives to help customers manage their obligations effectively.",
                                    "Clear Communication": "You are a clear and direct AI assistant for EMI collection support. Communicate payment information transparently and help customers understand their options without confusion.",
                                    "Payment Assistance": "You are a helpful payment assistance specialist. Guide customers through EMI collection processes, offer flexible payment plans, and provide financial guidance with patience and clarity."
                                };
                                onChange(prompts[suggestion as keyof typeof prompts]);
                            }}
                            className="px-3 py-1 text-xs bg-slate-700 text-white rounded-md border border-slate-600"
                        >
                            {suggestion}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}