import { useEffect, useState } from 'react';
import { PageConfig, Rule, HttpMethod } from '../common/types';

// Simple ID generator since we didn't install uuid
const generateId = () => Math.random().toString(36).substr(2, 9);

const STORAGE_KEY = 'network_tracker_config';

const EmptyState = ({ onAdd }: { onAdd: () => void }) => (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-white rounded-xl shadow-sm border border-gray-100 h-64">
        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4 text-blue-500 text-2xl">
            🌐
        </div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">No Pages Configured</h3>
        <p className="text-gray-500 text-sm mb-6 max-w-xs">
            Add a website to start tracking network requests.
        </p>
        <button
            onClick={onAdd}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 active:translate-y-0"
        >
            Add New Page
        </button>
    </div>
);

export default function App() {
    const [configs, setConfigs] = useState<PageConfig[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);

    useEffect(() => {
        chrome.storage.local.get([STORAGE_KEY], (result) => {
            if (result[STORAGE_KEY]) {
                setConfigs(result[STORAGE_KEY] as PageConfig[]);
            }
        });
    }, []);

    const saveConfigs = (newConfigs: PageConfig[]) => {
        setConfigs(newConfigs);
        chrome.storage.local.set({ [STORAGE_KEY]: newConfigs });
    };

    const handleDelete = (id: string) => {
        if (confirm('Are you sure you want to delete this configuration?')) {
            saveConfigs(configs.filter((c) => c.id !== id));
        }
    };

    const handleToggle = (id: string) => {
        saveConfigs(
            configs.map((c) => (c.id === id ? { ...c, enabled: !c.enabled } : c))
        );
    };

    const openForm = (id?: string) => {
        setEditingId(id || null);
        setIsFormOpen(true);
    };

    const handleSave = (config: PageConfig) => {
        if (editingId) {
            saveConfigs(configs.map((c) => (c.id === editingId ? config : c)));
        } else {
            saveConfigs([...configs, config]);
        }
        setIsFormOpen(false);
    };

    if (isFormOpen) {
        const initialData = configs.find((c) => c.id === editingId) || {
            id: generateId(),
            pagePattern: '',
            enabled: true,
            rules: [{ id: generateId(), urlPattern: '*', methods: ['GET', 'POST', 'PUT', 'DELETE'] }],
        };
        return <PageForm initialData={initialData} onSave={handleSave} onCancel={() => setIsFormOpen(false)} />;
    }

    return (
        <div className="w-[400px] min-h-[500px] bg-gray-50 p-4">
            <header className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-xl font-bold text-gray-900 tracking-tight">Network Tracker</h1>
                    <p className="text-xs text-gray-500 font-medium">Monitoring Dashboard</p>
                </div>
                <button
                    onClick={() => openForm()}
                    className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-sm"
                    title="Add Page"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                </button>
            </header>

            {configs.length === 0 ? (
                <EmptyState onAdd={() => openForm()} />
            ) : (
                <div className="space-y-3">
                    {configs.map((config) => (
                        <div
                            key={config.id}
                            className={`bg-white rounded-lg p-3 transition-all border flex items-center justify-between ${config.enabled
                                ? 'border-gray-200 shadow-sm hover:shadow-md'
                                : 'border-gray-100 bg-gray-50/50 opacity-80'
                                }`}
                        >
                            <div className="flex-1 min-w-0 mr-3">
                                <h3 className={`font-medium text-sm truncate ${config.enabled ? 'text-gray-900' : 'text-gray-500'}`} title={config.pagePattern}>
                                    {config.pagePattern}
                                </h3>
                                <div className="flex items-center mt-1 space-x-2">
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${config.enabled ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                                        {config.rules.length} Rule{config.rules.length !== 1 ? 's' : ''}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => openForm(config.id)}
                                    className="p-1.5 text-gray-400 hover:text-blue-600 rounded-md hover:bg-blue-50 transition-colors"
                                    title="Edit Configuration"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                </button>
                                <button
                                    onClick={() => handleDelete(config.id)}
                                    className="p-1.5 text-gray-400 hover:text-red-500 rounded-md hover:bg-red-50 transition-colors"
                                    title="Delete Configuration"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>

                                <div className="w-px h-4 bg-gray-200 mx-1"></div>

                                <button
                                    onClick={() => handleToggle(config.id)}
                                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${config.enabled ? 'bg-green-500' : 'bg-gray-300'
                                        }`}
                                    title={config.enabled ? "Enabled" : "Disabled"}
                                >
                                    <span
                                        className={`${config.enabled ? 'translate-x-5' : 'translate-x-1'
                                            } inline-block h-3 w-3 transform rounded-full bg-white transition-transform shadow-sm`}
                                    />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

const PageForm = ({
    initialData,
    onSave,
    onCancel,
}: {
    initialData: PageConfig;
    onSave: (data: PageConfig) => void;
    onCancel: () => void;
}) => {
    const [data, setData] = useState<PageConfig>(initialData);

    const updateRule = (index: number, field: keyof Rule, value: any) => {
        const newRules = [...data.rules];
        newRules[index] = { ...newRules[index], [field]: value };
        setData({ ...data, rules: newRules });
    };

    const addRule = () => {
        setData({
            ...data,
            rules: [...data.rules, { id: generateId(), urlPattern: '*', methods: ['GET'] }],
        });
    };

    const removeRule = (index: number) => {
        setData({ ...data, rules: data.rules.filter((_, i) => i !== index) });
    };

    const methodOptions: HttpMethod[] = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'];

    const toggleMethod = (ruleIndex: number, method: HttpMethod) => {
        const rule = data.rules[ruleIndex];
        if (rule.methods.includes(method)) {
            updateRule(
                ruleIndex,
                'methods',
                rule.methods.filter((m) => m !== method)
            );
        } else {
            updateRule(ruleIndex, 'methods', [...rule.methods, method]);
        }
    };

    return (
        <div className="w-[400px] min-h-[500px] bg-white p-4 flex flex-col">
            <div className="flex items-center mb-6">
                <button onClick={onCancel} className="mr-3 text-gray-400 hover:text-gray-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <h2 className="text-lg font-bold text-gray-900">Configure Page</h2>
            </div>

            <div className="flex-1 space-y-6 overflow-y-auto pb-20 no-scrollbar">
                {/* Page Pattern */}
                <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Page URL Pattern</label>
                    <input
                        type="text"
                        value={data.pagePattern}
                        onChange={(e) => setData({ ...data, pagePattern: e.target.value })}
                        placeholder="*.google.com/*"
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm font-medium"
                    />
                    <p className="text-[10px] text-gray-400 mt-1">Use * for wildcards (e.g., domain.com/*)</p>
                </div>

                {/* Rules */}
                <div>
                    <div className="flex justify-between items-center mb-3">
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Tracking Rules</label>
                        <button
                            onClick={addRule}
                            className="text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 px-2 py-1 rounded font-medium transition-colors"
                        >
                            + Add Rule
                        </button>
                    </div>

                    <div className="space-y-4">
                        {data.rules.map((rule, idx) => (
                            <div key={rule.id} className="p-3 border border-gray-200 rounded-lg bg-gray-50/50">
                                <div className="flex justify-between mb-2">
                                    <span className="text-xs font-medium text-gray-400">Rule #{idx + 1}</span>
                                    <button onClick={() => removeRule(idx)} className="text-gray-400 hover:text-red-500">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                </div>

                                <input
                                    type="text"
                                    value={rule.urlPattern}
                                    onChange={(e) => updateRule(idx, 'urlPattern', e.target.value)}
                                    placeholder="URL Pattern (e.g. */api/v1/*)"
                                    className="w-full mb-3 px-3 py-2 bg-white border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-500 outline-none text-sm placeholder-gray-400"
                                />

                                <div className="grid grid-cols-2 gap-2 mb-3">
                                    <div className="relative">
                                        <label className="block text-[10px] uppercase font-semibold text-gray-400 mb-1">Req. Prop</label>
                                        <input
                                            type="text"
                                            value={rule.requestVar || ''}
                                            onChange={(e) => updateRule(idx, 'requestVar', e.target.value)}
                                            placeholder="e.g. data.id"
                                            className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded text-xs focus:ring-1 focus:ring-blue-500 outline-none"
                                        />
                                    </div>
                                    <div className="relative">
                                        <label className="block text-[10px] uppercase font-semibold text-gray-400 mb-1">Res. Prop</label>
                                        <input
                                            type="text"
                                            value={rule.responseVar || ''}
                                            onChange={(e) => updateRule(idx, 'responseVar', e.target.value)}
                                            placeholder="e.g. user.token"
                                            className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded text-xs focus:ring-1 focus:ring-blue-500 outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    {methodOptions.map((m) => (
                                        <button
                                            key={m}
                                            onClick={() => toggleMethod(idx, m)}
                                            className={`text-[10px] px-2 py-1 rounded-md font-semibold transition-all ${rule.methods.includes(m)
                                                ? 'bg-blue-100 text-blue-700 ring-1 ring-blue-500/20'
                                                : 'bg-white text-gray-400 border border-gray-200 hover:border-gray-300'
                                                }`}
                                        >
                                            {m}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-100 p-4">
                <button
                    onClick={() => onSave(data)}
                    disabled={!data.pagePattern || data.rules.length === 0}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-lg shadow-md transition-all active:scale-[0.98]"
                >
                    Save Configuration
                </button>
            </div>
        </div>
    );
};
