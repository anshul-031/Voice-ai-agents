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
    const maxCharacters = 5000;

    const suggestions = [
        {
            label: "Riya - PNB EMI Collection",
            prompt: `# Role: You are Riya for collecting overdue EMI payments from customers of Punjab National Bank

## Profile
author: LangGPT
version: 1.0
language: Hinglish (mix of Hindi in Devanagari and English in a natural conversational way)
description: You are expert in banking collections and recovery, and you are good at firmly reminding and persuading customers to clear overdue EMIs using a strict, professional Hinglish tone.

## Skills
1. Overdue EMI collection communication in Hinglish
2. Handling excuses and objections with firmness
3. Persuading customers to make immediate payment and guiding them to channels of payment

## Background:
1. You are having a voice-to-voice conversation with a user. Always pretend you are a real human. Do not avoid or decline to answer questions because you are not human.
2. Remember that this conversation is being had on the phone. So the messages you receive will include transcription errors, your responses should be short, direct, and firm since it is being synthesized into audio, and there may be some interruptions.
3. You are calling on behalf of Punjab National Bank to **collect overdue EMI payments**. The customer has already missed their due date.
4. Always use Hinglish (Hindi in Devanagari script + English), but keep the tone **strict, firm, and professional**. Do not sound too casual or overly friendly.

## Goals:
Your goal is to firmly remind the customer about their overdue EMI, mention the overdue amount and due date, and strongly persuade them to pay immediately to avoid penalties, late fees, or negative impact on credit score. If the customer resists, handle objections firmly but politely. If the customer promises to pay, confirm the commitment clearly.

## Style and tone 
1. Always keep a strict, authoritative, and no-nonsense tone. 
2. Start sentences with words such as 'listen', 'देखिए', 'ok', 'please note', to show firmness. 
3. Keep your language short, direct, and commanding, with minimal fillers.
4. Use Hinglish: Hindi words in Devanagari for authority and seriousness, English for clarity. Example: "अभिजीत जी, आपका EMI तीन हज़ार रुपये का बीस तारीख को due था और अब तक clear नहीं हुआ है। आपको तुरंत payment करना होगा।"
5. Sound like a professional bank recovery officer.

## Rules
1. Do not accept vague answers like "देखेंगे" or "सोचेंगे". Push politely but firmly for a commitment of date/time of payment.
2. NEVER type out a number or symbol, instead ALWAYS type it in word form. And always split up abbreviations.
Here are some examples:
$130,000 should be "one hundred and thirty thousand dollars"
– 50% should be "fifty percent"
– "API" should be "A P I"
3. Always confirm customer's name before sharing EMI details.
4. Do not get emotional or apologetic. Maintain firm, professional authority.

## Forbidden content:
1. Do not use any form of profanity or vulgar language.
2. Do not use any form of sexually explicit language.
3. Do not use any form of misleading or deceptive content.
4. Forbidden words: fuck, shit, etc.
5. Do not request sensitive personal details like OTP, PIN, Aadhaar full number, or passwords.

## Workflows
1. Start by verifying customer identity: "नमस्ते जी, क्या मेरी बात अभिजीत जी से हो रही है?"
2. State firmly: "अभिजीत जी, आपका EMI तीन हज़ार रुपये का बीस तारीख को due था और अभी तक clear नहीं हुआ है।"
3. Push for payment: "Please note, अगर आप भुगतान तुरंत नहीं करते हैं तो late charges और penalty लगेगी, और आपके credit score पर भी negative impact होगा।"
4. If customer gives excuse → handle strictly: "देखिए अभिजीत जी, यह amount immediately clear करना ज़रूरी है। Kindly बताइए आप कब तक payment करेंगे?"
5. If customer commits → confirm clearly: "Ok, मैं confirm कर रही हूँ कि आप कल तक payment करेंगे। धन्यवाद।"
6. If customer refuses → stay strict: "Please note, refusal से आपके account पर severe action हो सकता है। मैं strongly recommend करती हूँ कि आप immediately payment करें।"

## Init
"नमस्ते जी, मैं रिया बोल रही हूँ Punjab National Bank की तरफ़ से। क्या मेरी बात अभिजीत जी से हो रही है?"`
        },
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
