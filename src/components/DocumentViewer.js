import React from 'react';
import { useDocument } from '../context/DocumentContext';

function DocumentViewer() {
    const { originalDoc, improvedDoc, suggestions, handleSuggestion, analytics, exportDocument } = useDocument();
    const [showSuggestion, setShowSuggestion] = React.useState(null);

    if (!originalDoc || !improvedDoc) return null;

    const renderImprovedContent = () => {
        const sortedSuggestions = [...suggestions].sort((a, b) => a.start - b.start);
        let content = [];
        let lastIndex = 0;

        sortedSuggestions.forEach(s => {
            if (s.start > lastIndex) content.push(improvedDoc.substring(lastIndex, s.start));
            const suggestionClass = s.status === 'accepted'
                ? 'bg-green-200 dark:bg-green-900'
                : s.status === 'rejected'
                    ? 'bg-red-200 dark:bg-red-900'
                    : 'bg-yellow-200 dark:bg-yellow-900 cursor-pointer';
            content.push(
                <span
                    key={s.id}
                    className={`px-1 rounded-md suggestion ${suggestionClass} transition-all duration-300`}
                    onClick={() => s.status === 'pending' && setShowSuggestion(s.id === showSuggestion ? null : s.id)}
                >
                    {s.status === 'rejected' ? s.originalText : s.improvedText}
                    {s.status === 'pending' && showSuggestion === s.id && (
                        <div className="suggestion-tooltip bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 border border-gray-200 dark:border-gray-700">
                            <p className="mb-2 text-sm"><strong>Reason:</strong> {s.reason}</p>
                            <p className="mb-2 text-sm"><strong>Original:</strong> {s.originalText}</p>
                            <div className="flex justify-between">
                                <button
                                    className="px-3 py-1 bg-green-600 text-white rounded btn-hover-effect"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleSuggestion(s.id, 'accepted');
                                        setShowSuggestion(null);
                                    }}
                                >
                                    Accept
                                </button>
                                <button
                                    className="px-3 py-1 bg-red-600 text-white rounded btn-hover-effect"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleSuggestion(s.id, 'rejected');
                                        setShowSuggestion(null);
                                    }}
                                >
                                    Reject
                                </button>
                            </div>
                        </div>
                    )}
                </span>
            );
            lastIndex = s.end;
        });
        if (lastIndex < improvedDoc.length) content.push(improvedDoc.substring(lastIndex));
        return content;
    };

    return (
        <div className="max-w-4xl mx-auto p-4 slide-in-left">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold flex items-center">
                    <span className="glow-animation inline-block mr-2">📝</span>
                    Document Comparison
                </h2>
                <button
                    className="px-4 py-2 bg-gradient-accent text-white rounded-lg btn-hover-effect"
                    onClick={exportDocument}
                >
                    Export Improved Document
                </button>
            </div>
            <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-1 bg-light-card dark:bg-dark-card p-6 rounded-xl shadow-lg card-3d">
                    <h3 className="font-semibold mb-3 text-lg text-center bg-gradient-primary text-white inline-block px-3 py-1 rounded">Original</h3>
                    <div className="h-96 overflow-auto p-4 bg-white dark:bg-gray-800 rounded-lg">
                        <pre className="document-text whitespace-pre-wrap">{originalDoc}</pre>
                    </div>
                </div>
                <div className="flex-1 bg-light-card dark:bg-dark-card p-6 rounded-xl shadow-lg card-3d">
                    <h3 className="font-semibold mb-3 text-lg text-center bg-gradient-primary text-white inline-block px-3 py-1 rounded">Improved</h3>
                    <div className="h-96 overflow-auto p-4 bg-white dark:bg-gray-800 rounded-lg">
                        <pre className="document-text whitespace-pre-wrap">{renderImprovedContent()}</pre>
                    </div>
                </div>
            </div>
            <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg flex items-center">
                <div className="flex-shrink-0 text-2xl mr-3">💡</div>
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    <strong>Tip:</strong> Click on highlighted suggestions to see details and accept or reject them directly. Use Ctrl+A to accept all, Ctrl+R to reject all.
                </p>
            </div>
            {analytics.wordCount > 0 && (
                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                    <h3 className="font-semibold text-lg mb-2">Document Analytics</h3>
                    <p className="text-sm">Word Count: {analytics.wordCount}</p>
                    <p className="text-sm">Readability Score: {analytics.readabilityScore} (Flesch-Kincaid)</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                        {analytics.readabilityScore >= 80 ? 'Very easy to read' :
                         analytics.readabilityScore >= 60 ? 'Fairly easy to read' :
                         analytics.readabilityScore >= 30 ? 'Somewhat difficult to read' : 'Very difficult to read'}
                    </p>
                </div>
            )}
        </div>
    );
}

export default DocumentViewer;