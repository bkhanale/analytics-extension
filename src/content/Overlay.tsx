import { useEffect, useState } from 'react';
import { NetworkLog } from '../common/types';
import { NetworkList } from './NetworkList';
import css from '../index.css?inline';

export const Overlay = () => {
    const [logs, setLogs] = useState<NetworkLog[]>([]);

    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            // We listen to window messages
            if (event.data?.type === 'NETWORK_EVENT' && event.data?.payload) {
                const newLog = event.data.payload as NetworkLog;
                console.log('[NT Overlay] Processing event:', newLog);

                setLogs(prev => {
                    const idx = prev.findIndex(l => l.id === newLog.id);
                    if (idx >= 0) {
                        const newLogs = [...prev];
                        newLogs[idx] = { ...newLogs[idx], ...newLog };
                        return newLogs;
                    }
                    return [...prev, newLog]; // NetworkList reverses this for validation (LIFO display)
                });
            }
        };
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    // If no logs, show nothing (per "As soon as the event appears it gets inserted")
    if (logs.length === 0) return (
        <div className="antialiased text-gray-900">
            <style>{css}</style>
        </div>
    );

    return (
        <div className="antialiased text-gray-900">
            <style>{css}</style>
            <div className="fixed bottom-6 right-6 w-[450px] max-h-[600px] flex flex-col bg-white border-[3px] border-gray-900 ring-4 ring-white shadow-[0_35px_60px_-15px_rgba(0,0,0,0.6)] rounded-xl transition-all animate-fade-in-up overflow-hidden font-sans z-[2147483647]">
                <div className="bg-gray-50 border-b border-gray-200 px-3 py-2 flex justify-between items-center">
                    <div className="flex flex-col">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Live Requests</span>
                        <span className="text-[10px] text-gray-400 font-mono" title="Active Config Source">
                            {document.documentElement.dataset.ntConfigPattern || 'Unknown Config'}
                        </span>
                    </div>
                    <div className="flex space-x-2">
                        <button onClick={() => setLogs([])} className="text-xs text-gray-400 hover:text-red-500 font-medium">Clear</button>
                    </div>
                </div>
                <NetworkList
                    logs={logs}
                    onClear={() => setLogs([])}
                    onRemove={(id) => setLogs(p => p.filter(l => l.id !== id))}
                />
            </div>
        </div>
    );
};
