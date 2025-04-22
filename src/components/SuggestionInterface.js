import React from 'react';
import { useDocument } from '../context/DocumentContext';

function SuggestionInterface() {
    const { suggestions, handleSuggestion } = useDocument();

    if (!suggestions.length) return null;

    const pendingSuggestions = suggestions.filter(s => s.status === 'pending');
    const acceptedSuggestions = suggestions.filter(s => s.status === 'accepted');
    const rejectedSuggestions = suggestions.filter(s => s.status === 'rejected');
    const pendingCount = pendingSuggestions.length;
    const acceptedCount = acceptedSuggestions.length;
    const rejectedCount = rejectedSuggestions.length;

    return (
        <div className="max-w-4xl mx-auto p-4 mt-6 slide-in-right">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
                <span className="glow-animation inline-block mr-2">✨</span>
                AI Improvement Suggestions
            </h2>
            <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-yellow-100 dark:bg-yellow-900/30 p-4 rounded-lg text-center">
                    <div className="text-xl font-bold text-yellow-600 dark:text-yellow-300">{pendingCount}</div>
                    <div className="text-sm text-yellow-700 dark:text-yellow-400">Pending</div>
                </div>
                <div className="bg-green-100 dark:bg-green-900/30 p-4 rounded-lg text-center">
                    <div className="text-xl font-bold text-green-600 dark:text-green-300">{acceptedCount}</div>
                    <div className="text-sm text-green-700 dark:text-green-400">Accepted</div>
                </div>
                <div className="bg-red-100 dark:bg-red-900/30 p-4 rounded-lg text-center">
                    <div className="text-xl font-bold text-red-600 dark:text-red-300">{rejectedCount}</div>
                    <div className="text-sm text-red-700 dark:text-red-400">Rejected</div>
                </div>
            </div>
            {pendingSuggestions.length > 0 && (
                <div className="bg-light-card dark:bg-dark-card rounded-xl shadow-lg p-6 mb-6">
                    <h3 className="font-semibold mb-4 text-lg text-gray-700 dark:text-gray-300">Pending Suggestions</h3>
                    <div className="space-y-4">
                        {pendingSuggestions.map(s => (
                            <div key={s.id} className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-all border border-gray-100 dark:border-gray-700/50">
                                <div className="flex justify-between items-center mb-3">
                                    <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300 rounded text-xs font-medium">Pending</span>
                                    <span className="text-gray-500 dark:text-gray-400 text-xs font-mono">ID: {s.id} {s.type ? `(${s.type})` : ''}</span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                                    <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded border border-gray-200 dark:border-gray-600">
                                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 font-medium">Original:</div>
                                        <div className="font-mono text-sm text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-800 p-2 rounded break-words">{s.originalText}</div>
                                    </div>
                                    <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded border border-gray-200 dark:border-gray-600">
                                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 font-medium">Suggested:</div>
                                        <div className="font-mono text-sm text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-800 p-2 rounded break-words">{s.improvedText}</div>
                                    </div>
                                </div>
                                <div className="mb-4">
                                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 font-medium">Reason:</div>
                                    <div className="text-sm p-3 bg-gray-50 dark:bg-gray-700/50 rounded text-gray-700 dark:text-gray-300">{s.reason}</div>
                                </div>
                                <div className="flex justify-end space-x-3">
                                    <button className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white text-sm font-semibold rounded-lg shadow btn-hover-effect focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800" onClick={() => handleSuggestion(s.id, 'accepted')}>Accept ✓</button>
                                    <button className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white text-sm font-semibold rounded-lg shadow btn-hover-effect focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800" onClick={() => handleSuggestion(s.id, 'rejected')}>Reject ✕</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            {(acceptedSuggestions.length > 0 || rejectedSuggestions.length > 0) && (
                <div className="bg-light-card dark:bg-dark-card rounded-xl shadow-lg p-6">
                    <h3 className="font-semibold mb-4 text-lg">Resolved Suggestions</h3>
                    <div className="space-y-3">
                        {acceptedSuggestions.map(s => (
                            <div key={s.id} className="p-3 bg-white dark:bg-gray-800 rounded-lg border-l-4 border-green-500">
                                <div className="flex justify-between mb-2">
                                    <div className="px-2 py-1 bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300 rounded text-xs">Accepted</div>
                                    <div className="text-gray-500 dark:text-gray-400 text-xs">#{s.id} ({s.type})</div>
                                </div>
                                <p className="text-sm"><span className="line-through text-gray-500">{s.originalText}</span> → <span className="font-medium">{s.improvedText}</span></p>
                            </div>
                        ))}
                        {rejectedSuggestions.map(s => (
                            <div key={s.id} className="p-3 bg-white dark:bg-gray-800 rounded-lg border-l-4 border-red-500">
                                <div className="flex justify-between mb-2">
                                    <div className="px-2 py-1 bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300 rounded text-xs">Rejected</div>
                                    <div className="text-gray-500 dark:text-gray-400 text-xs">#{s.id} ({s.type})</div>
                                </div>
                                <p className="text-sm">Kept original: <span className="font-medium">{s.originalText}</span></p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default SuggestionInterface;