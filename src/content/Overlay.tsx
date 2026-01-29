import { useEffect, useState } from 'react';
import { NetworkLog } from '../common/types';
import { NetworkList } from './NetworkList';
import css from '../index.css?inline';

export const Overlay = () => {
  const [logs, setLogs] = useState<NetworkLog[]>([]);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    // Load persisted collapse state
    chrome.storage.local.get(['nt_collapsed'], (result) => {
      if (result.nt_collapsed !== undefined) {
        setIsCollapsed(result.nt_collapsed as boolean);
      }
    });

    const handleMessage = (event: MessageEvent) => {
      // We listen to window messages
      if (event.data?.type === 'NETWORK_EVENT' && event.data?.payload) {
        const newLog = event.data.payload as NetworkLog;
        console.log('[NT Overlay] Processing event:', newLog);

        setLogs((prev) => {
          const idx = prev.findIndex((l) => l.id === newLog.id);
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

  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    chrome.storage.local.set({ nt_collapsed: newState });
  };

  // If no logs, show nothing (per "As soon as the event appears it gets inserted")
  if (logs.length === 0)
    return (
      <div className="antialiased text-gray-900">
        <style>{css}</style>
      </div>
    );

  return (
    <div className="antialiased text-gray-900">
      <style>{css}</style>
      <div
        className={`fixed bottom-6 right-6 w-[450px] flex flex-col bg-white border border-gray-300 shadow-2xl rounded-xl transition-all animate-fade-in-up overflow-hidden font-sans z-[2147483647] ${
          isCollapsed ? 'h-auto' : 'max-h-[600px]'
        }`}
      >
        <div className="absolute top-0 bottom-0 left-0 w-[6px] bg-blue-600 z-10" />
        <div
          className="bg-gray-50 border-b border-gray-200 pl-4 pr-3 py-2 flex justify-between items-center cursor-pointer hover:bg-gray-100 transition-colors"
          onClick={toggleCollapse}
        >
          <div className="flex items-center space-x-2">
            <button className="text-gray-500 hover:text-gray-700 focus:outline-none">
              {isCollapsed ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 15l7-7 7 7"
                  />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              )}
            </button>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Network Activity
              </span>
              <span className="text-[10px] text-gray-400 font-mono" title="Active Config Source">
                {document.documentElement.dataset.ntConfigPattern || 'Unknown Config'}
              </span>
            </div>
          </div>
          <div className="flex space-x-2 items-center">
            <span className="text-xs text-gray-400 font-mono mr-1">{logs.length} reqs</span>
            {!isCollapsed && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setLogs([]);
                }}
                className="text-gray-400 hover:text-red-500 font-medium"
                title="Clear All"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>
        {!isCollapsed && (
          <NetworkList
            logs={logs}
            onRemove={(id) => setLogs((p) => p.filter((l) => l.id !== id))}
          />
        )}
      </div>
    </div>
  );
};
