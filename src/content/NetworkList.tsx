import { useState } from 'react';
import { NetworkLog } from '../common/types';

interface Props {
    logs: NetworkLog[];
    onClear: () => void;
    onRemove: (id: string) => void;
}

const StatusBadge = ({ status }: { status: number }) => {
    let color = 'bg-gray-100 text-gray-600';
    if (status >= 200 && status < 300) color = 'bg-green-100 text-green-700';
    else if (status >= 300 && status < 400) color = 'bg-yellow-100 text-yellow-700';
    else if (status >= 400 || status === -1) color = 'bg-red-100 text-red-700';
    else if (status === 0) color = 'bg-blue-50 text-blue-600 animate-pulse'; // Pending

    return (
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${color}`}>
            {status === 0 ? 'PENDING' : status === -1 ? 'ERR' : status}
        </span>
    );
};

export const NetworkList = ({ logs, onClear, onRemove }: Props) => {
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const toggleExpand = (id: string) => {
        setExpandedId(expandedId === id ? null : id);
    };

    return (
        <div className="flex flex-col h-full bg-white shadow-2xl rounded-tl-lg rounded-bl-lg border border-gray-200 overflow-hidden font-sans text-sm">
            <div className="flex justify-between items-center px-3 py-2 bg-gray-50 border-b border-gray-200">
                <h3 className="font-semibold text-gray-700 text-xs uppercase tracking-wider">Network Activity</h3>
                <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-400 font-mono">{logs.length} reqs</span>
                    <button onClick={onClear} className="text-gray-400 hover:text-gray-600" title="Clear All">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar p-2 space-y-2 bg-gray-50/50">
                {logs.length === 0 && (
                    <div className="text-center text-gray-400 py-8 text-xs">
                        Waiting for requests...
                    </div>
                )}
                {[...logs].reverse().map((log) => (
                    <div key={log.id} className="bg-white border border-gray-200 rounded-md shadow-sm hover:shadow-md transition-shadow">
                        {/* Header Row */}
                        <div
                            className="flex items-center justify-between p-2 cursor-pointer select-none"
                            onClick={() => toggleExpand(log.id)}
                        >
                            <div className="flex flex-col overflow-hidden flex-1">
                                <div className="flex items-center space-x-2">
                                    <span className={`text-[10px] font-bold px-1 rounded ${log.method === 'GET' ? 'bg-blue-100 text-blue-700' :
                                        log.method === 'POST' ? 'bg-green-100 text-green-700' :
                                            log.method === 'DELETE' ? 'bg-red-100 text-red-700' : 'bg-purple-100 text-purple-700'
                                        }`}>{log.method}</span>
                                    <div className="truncate text-xs font-medium text-gray-700 flex-1" title={log.url}>
                                        {new URL(log.url).pathname}
                                    </div>
                                </div>
                                {(log.extractedRequestVar !== undefined || log.extractedResponseVar !== undefined) && (
                                    <div className="flex items-center space-x-2 mt-1 ml-1 text-[10px] font-mono text-gray-500">
                                        {log.extractedRequestVar !== undefined && (
                                            <span className="bg-blue-50 text-blue-600 px-1 rounded border border-blue-100" title="Request Value">
                                                req: {JSON.stringify(log.extractedRequestVar)}
                                            </span>
                                        )}
                                        {log.extractedResponseVar !== undefined && (
                                            <span className="bg-purple-50 text-purple-600 px-1 rounded border border-purple-100" title="Response Value">
                                                res: {JSON.stringify(log.extractedResponseVar)}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center space-x-2 ml-2">
                                <StatusBadge status={log.status} />
                                <button
                                    onClick={(e) => { e.stopPropagation(); onRemove(log.id); }}
                                    className="text-gray-300 hover:text-red-400 transition-colors"
                                >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                        </div>

                        {/* Expanded Details */}
                        {expandedId === log.id && (
                            <div className="border-t border-gray-100 p-2 bg-gray-50 text-xs">
                                <div className="mb-2">
                                    <div className="font-semibold text-gray-500 mb-1">Full URL</div>
                                    <div className="break-all font-mono text-gray-600 bg-gray-100 p-1 rounded">{log.url}</div>
                                </div>

                                {log.requestBody && (
                                    <div className="mb-2">
                                        <div className="font-semibold text-gray-500 mb-1">Request Body</div>
                                        <pre className="overflow-x-auto bg-gray-100 p-1 rounded font-mono text-gray-700 max-h-24">
                                            {typeof log.requestBody === 'string' ? log.requestBody : JSON.stringify(log.requestBody, null, 2)}
                                        </pre>
                                    </div>
                                )}

                                <div className="mb-1">
                                    <div className="font-semibold text-gray-500 mb-1">Response Body</div>
                                    <pre className="overflow-x-auto bg-gray-100 p-1 rounded font-mono text-gray-700 max-h-40">
                                        {typeof log.responseBody === 'string' ? log.responseBody : JSON.stringify(log.responseBody, null, 2)}
                                    </pre>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};
