import React, { useState } from 'react';
import type { OCRResult } from '../api/ocr';
import { clsx } from 'clsx';

interface ResultsViewProps {
    data: OCRResult;
    onReset: () => void;
}

export const ResultsView: React.FC<ResultsViewProps> = ({ data, onReset }) => {
    const [copied, setCopied] = useState<string | null>(null);

    const copyToClipboard = (text: string, type: string) => {
        navigator.clipboard.writeText(text);
        setCopied(type);
        setTimeout(() => setCopied(null), 2000);
    };

    return (
        <div className="w-full max-w-6xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">

            {/* Header Actions */}
            <div className="flex justify-between items-center mb-2 px-1">
                <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
                    Analysis Results
                </h2>
                <button
                    onClick={onReset}
                    className="group flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-200 hover:shadow-md transition-all duration-300 font-medium text-sm"
                >
                    <span className="transition-transform group-hover:-translate-x-0.5">←</span>
                    Scan New Image
                </button>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">

                {/* Left: Clean Document View */}
                <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-gray-200 to-slate-200 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-500"></div>
                    <div className="relative bg-white rounded-xl shadow-xl overflow-hidden border border-slate-200">
                        <div className="bg-slate-50/80 backdrop-blur-sm px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-slate-300"></div>
                                <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-widest">Document View</h3>
                            </div>
                        </div>

                        <div className="p-6 h-[500px] overflow-auto bg-white">
                            {data.results.length > 0 ? (
                                <div className="space-y-4 text-slate-800 leading-relaxed">
                                    {data.results.map((line, idx) => (
                                        <p key={idx} className={clsx("p-2 rounded hover:bg-indigo-50/50 transition-colors", !line && "h-6")}>
                                            {line || <span className="text-slate-300 select-none">↵</span>}
                                        </p>
                                    ))}
                                </div>
                            ) : (
                                <div className="h-full flex items-center justify-center text-slate-400 italic">
                                    No readable text detected.
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right: Technical/Raw View (Terminal Style) */}
                <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-slate-800 to-indigo-900 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-500"></div>
                    <div className="relative bg-slate-900 rounded-xl shadow-xl overflow-hidden border border-slate-800">
                        <div className="bg-slate-950/50 px-6 py-4 border-b border-slate-800 flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                                <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
                                <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
                                <h3 className="ml-3 text-xs font-mono text-slate-400">RAW_OUTPUT.TXT</h3>
                            </div>
                            <button
                                onClick={() => copyToClipboard(data.original, 'raw')}
                                className="text-xs font-mono text-slate-500 hover:text-indigo-400 transition-colors"
                            >
                                {copied === 'raw' ? '✓ COPIED' : 'COPY'}
                            </button>
                        </div>

                        <div className="p-6 h-[500px] overflow-auto custom-scrollbar">
                            <pre className="font-mono text-xs sm:text-sm text-emerald-400/90 leading-6 whitespace-pre-wrap selection:bg-emerald-900 selection:text-white">
                                {data.original}
                            </pre>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};
