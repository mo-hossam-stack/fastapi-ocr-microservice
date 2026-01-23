import React, { useEffect, useState } from 'react';
import { ocrApi } from '../api/ocr';
import { clsx } from 'clsx';

export const StatusBadge: React.FC = () => {
    const [health, setHealth] = useState<'ok' | 'error' | 'loading'>('loading');
    const [ready, setReady] = useState<'ready' | 'not-ready' | 'loading'>('loading');

    const checkStatus = async () => {
        try {
            await ocrApi.checkHealth();
            setHealth('ok');
        } catch {
            setHealth('error');
        }

        try {
            await ocrApi.checkReadiness();
            setReady('ready');
        } catch {
            setReady('not-ready');
        }
    };

    useEffect(() => {
        checkStatus();
        const interval = setInterval(checkStatus, 30000); // Poll every 30s
        return () => clearInterval(interval);
    }, []);

    // Helper for badge styles
    const getBadgeStyle = (status: string, type: 'health' | 'ready') => {
        const base = "px-4 py-2 rounded-xl flex items-center gap-2.5 text-[0.7rem] font-bold tracking-wider uppercase backdrop-blur-lg border transition-all duration-500 shadow-sm";

        if (status === 'loading') return `${base} bg-slate-500/5 text-slate-400 border-slate-200/50 mb-px`;

        if (type === 'health') {
            return status === 'ok'
                ? `${base} bg-emerald-500/5 text-emerald-700 border-emerald-500/20 hover:bg-emerald-500/10`
                : `${base} bg-red-500/5 text-red-700 border-red-500/20 hover:bg-red-500/10`;
        } else {
            return status === 'ready'
                ? `${base} bg-blue-500/5 text-blue-700 border-blue-500/20 hover:bg-blue-500/10`
                : `${base} bg-amber-500/5 text-amber-700 border-amber-500/20 hover:bg-amber-500/10`;
        }
    };

    const getDotStyle = (status: string, type: 'health' | 'ready') => {
        if (status === 'loading') return "bg-slate-300 animate-pulse";
        if (type === 'health') return status === 'ok' ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite]" : "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]";
        return status === 'ready' ? "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)] animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite]" : "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]";
    };

    return (
        <div className="flex gap-4">
            <div className={getBadgeStyle(health, 'health')}>
                <span className={clsx("w-2 h-2 rounded-full", getDotStyle(health, 'health'))} />
                <span className="hidden md:inline text-slate-500/80 font-semibold tracking-normal lowercase mr-0.5">system:</span>
                {health === 'loading' ? 'CHECKING...' : health.toUpperCase()}
            </div>

            <div className={getBadgeStyle(ready, 'ready')}>
                <span className={clsx("w-2 h-2 rounded-full", getDotStyle(ready, 'ready'))} />
                <span className="hidden md:inline text-slate-500/80 font-semibold tracking-normal lowercase mr-0.5">engine:</span>
                {ready === 'loading' ? 'CHECKING...' : ready === 'ready' ? 'READY' : 'OFFLINE'}
            </div>
        </div>
    );
};
