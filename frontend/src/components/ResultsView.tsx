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

    const downloadAsTxt = () => {
        const element = document.createElement("a");
        const file = new Blob([data.original], { type: 'text/plain' });
        element.href = URL.createObjectURL(file);
        element.download = `extracted-text-${new Date().getTime()}.txt`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    };

    return (
        <div className="w-full max-w-7xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-12 duration-1000">

            {/* Header Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-2">
                <div className="space-y-1">
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                        Analysis Results
                    </h2>
                    <p className="text-slate-500 font-medium text-sm">Extracted content ready for export</p>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button
                        onClick={downloadAsTxt}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 transition-all duration-300 font-bold text-sm transform hover:-translate-y-0.5 active:scale-95"
                    >
                        <span>📥</span>
                        Download TXT
                    </button>
                    <button
                        onClick={onReset}
                        className="flex-1 sm:flex-none group flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300 font-bold text-sm"
                    >
                        <span className="transition-transform group-hover:-translate-x-1">←</span>
                        Scan New
                    </button>
                </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-10">

                {/* Left: Clean Document View */}
                <div className="relative group/card">
                    <div className="absolute -inset-1 bg-gradient-to-br from-slate-200 to-gray-200 rounded-3xl blur opacity-20 group-hover/card:opacity-40 transition duration-700"></div>
                    <div className="relative bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden border border-slate-200/60 transition-transform duration-500 group-hover/card:translate-y-[-2px]">
                        <div className="bg-slate-50/50 px-8 py-5 border-b border-slate-200/60 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="w-2.5 h-2.5 rounded-full bg-slate-300 animate-pulse"></div>
                                <h3 className="text-[0.7rem] font-black text-slate-500 uppercase tracking-[0.2em]">Document View</h3>
                            </div>
                            <span className="text-[0.65rem] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">CLEAN_RESULT</span>
                        </div>

                        <div className="p-8 h-[600px] overflow-auto bg-white/40 custom-scrollbar">
                            {data.results.length > 0 ? (
                                <div className="space-y-5 text-slate-800 leading-relaxed font-serif text-lg">
                                    {data.results.map((line, idx) => (
                                        <p key={idx} className={clsx("p-2 rounded-lg hover:bg-slate-50 transition-colors duration-300", !line && "h-8 border-l-2 border-slate-100")}>
                                            {line || <span className="text-slate-200 select-none opacity-0 group-hover/card:opacity-100 transition-opacity">↵</span>}
                                        </p>
                                    ))}
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-4">
                                    <span className="text-4xl opacity-20">📭</span>
                                    <p className="italic font-medium">No readable text detected.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right: Technical/Raw View (Terminal Style) */}
                <div className="relative group/card">
                    <div className="absolute -inset-1 bg-gradient-to-br from-indigo-900 to-slate-900 rounded-3xl blur opacity-20 group-hover/card:opacity-40 transition duration-700"></div>
                    <div className="relative bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-800 transition-transform duration-500 group-hover/card:translate-y-[-2px]">
                        <div className="bg-slate-950/60 px-8 py-5 border-b border-slate-800 flex justify-between items-center">
                            <div className="flex items-center gap-2.5">
                                <div className="w-2.5 h-2.5 rounded-full bg-red-500/60 shadow-[0_0_8px_rgba(239,68,68,0.3)]"></div>
                                <div className="w-2.5 h-2.5 rounded-full bg-amber-500/60 shadow-[0_0_8px_rgba(245,158,11,0.3)]"></div>
                                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/60 shadow-[0_0_8px_rgba(16,185,129,0.3)]"></div>
                                <h3 className="ml-4 text-[0.65rem] font-bold font-mono text-slate-500 uppercase tracking-[0.2em]">RAW_OUTPUT.TXT</h3>
                            </div>
                            <button
                                onClick={() => copyToClipboard(data.original, 'raw')}
                                className="px-3 py-1 rounded-md text-[0.65rem] font-bold font-mono text-slate-500 hover:text-indigo-400 hover:bg-slate-800/50 transition-all border border-transparent hover:border-slate-700"
                            >
                                {copied === 'raw' ? '✓ COPIED' : 'COPY_RAW'}
                            </button>
                        </div>

                        <div className="p-8 h-[600px] overflow-auto custom-scrollbar bg-slate-900/50 backdrop-blur-sm">
                            <pre className="font-mono text-sm sm:text-base text-emerald-400/80 leading-7 whitespace-pre-wrap selection:bg-emerald-500/20 selection:text-emerald-200">
                                {data.original}
                            </pre>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};
