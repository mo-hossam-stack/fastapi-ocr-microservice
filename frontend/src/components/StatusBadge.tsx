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
        const base = "px-3 py-1.5 rounded-full flex items-center gap-2 text-xs font-semibold backdrop-blur-md border border-white/20 shadow-sm transition-all duration-300";

        if (status === 'loading') return `${base} bg-gray-500/10 text-gray-500`;

        if (type === 'health') {
            return status === 'ok'
                ? `${base} bg-emerald-500/10 text-emerald-700 border-emerald-500/20`
                : `${base} bg-red-500/10 text-red-700 border-red-500/20`;
        } else {
            return status === 'ready'
                ? `${base} bg-blue-500/10 text-blue-700 border-blue-500/20`
                : `${base} bg-amber-500/10 text-amber-700 border-amber-500/20`;
        }
    };

    const getDotStyle = (status: string, type: 'health' | 'ready') => {
        if (status === 'loading') return "bg-gray-400 animate-pulse";
        if (type === 'health') return status === 'ok' ? "bg-emerald-500 animate-pulse" : "bg-red-500";
        return status === 'ready' ? "bg-blue-500 animate-pulse" : "bg-amber-500";
    };

    return (
        <div className="flex gap-3">
            <div className={getBadgeStyle(health, 'health')}>
                <span className={clsx("w-2 h-2 rounded-full", getDotStyle(health, 'health'))} />
                <span className="hidden sm:inline">System:</span>
                {health === 'loading' ? 'CHECKING...' : health.toUpperCase()}
            </div>

            <div className={getBadgeStyle(ready, 'ready')}>
                <span className={clsx("w-2 h-2 rounded-full", getDotStyle(ready, 'ready'))} />
                <span className="hidden sm:inline">OCR Engine:</span>
                {ready === 'loading' ? 'CHECKING...' : ready === 'ready' ? 'READY' : 'OFFLINE'}
            </div>
        </div>
    );
};
