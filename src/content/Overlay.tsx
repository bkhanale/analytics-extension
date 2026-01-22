import { useEffect, useState } from 'react';
import { NetworkLog } from '../common/types';
import { NetworkList } from './NetworkList';
import css from '../index.css?inline';

export const Overlay = () => {
    const [logs, setLogs] = useState<NetworkLog[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [hasUnread, setHasUnread] = useState(false);

    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            console.log('[NT Overlay] Received message:', event.data);
            // We listen to window messages
            if (event.data?.type === 'NETWORK_EVENT' && event.data?.payload) {
                console.log('[NT Overlay] Processing event:', event.data.payload);
                const newLog = event.data.payload as NetworkLog;

                setLogs(prev => {
                    const idx = prev.findIndex(l => l.id === newLog.id);
                    if (idx >= 0) {
                        const newLogs = [...prev];
                        // Merge updates (e.g. status 0 -> 200, or responseBody added)
                        newLogs[idx] = { ...newLogs[idx], ...newLog };
                        return newLogs;
                    }
                    return [...prev, newLog];
                });

                if (!isOpen) {
                    setHasUnread(true);
                }
            }
        };
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [isOpen]);

    useEffect(() => {
        if (isOpen) setHasUnread(false);
    }, [isOpen]);

    // Use a container div to ensure styles scope correctly if needed, though Shadow DOM does that.
    return (
        <div className="antialiased text-gray-900">
            <style>{css}</style>

            {!isOpen ? (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-6 right-6 w-14 h-14 bg-gray-900 hover:bg-black text-white rounded-full shadow-xl flex items-center justify-center transition-all bg-gradient-to-br from-gray-800 to-black border border-gray-700 z-[2147483647] group"
                >
                    <svg className="w-6 h-6 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    {hasUnread && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-gray-900"></span>
                    )}
                </button>
            ) : (
                <div className="fixed bottom-6 right-6 w-[450px] h-[600px] max-h-[85vh] flex flex-col z-[2147483647] shadow-2xl rounded-xl transition-all animate-fade-in-up">
                    <div className="absolute -top-3 -right-3 z-50">
                        <button
                            onClick={() => setIsOpen(false)}
                            className="bg-gray-900 hover:bg-gray-700 text-white rounded-full p-1 shadow-md border border-gray-700 transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>

                    <NetworkList
                        logs={logs}
                        onClear={() => setLogs([])}
                        onRemove={(id) => setLogs(p => p.filter(l => l.id !== id))}
                    />
                </div>
            )}
        </div>
    );
};
