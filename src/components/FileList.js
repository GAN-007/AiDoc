import React from 'react';
import { useDocument } from '../context/DocumentContext';

function FileList() {
    const { documents, processDocument } = useDocument();
    if (!documents.length) return null;

    return (
        <div className="max-w-2xl mx-auto p-4 fade-in">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
                <span className="rotate-animation inline-block mr-2">📁</span>
                Your Documents
            </h2>
            <div className="grid grid-cols-1 gap-3">
                {documents.map(doc => (
                    <div key={doc.id} className="file-item p-4 bg-light-card dark:bg-dark-card rounded-lg flex justify-between items-center card-3d shadow-md">
                        <div className="flex items-center">
                            <span className="text-2xl mr-3 float-animation">{doc.icon}</span>
                            <div>
                                <h3 className="font-medium">{doc.name}</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{doc.uploadDate}</p>
                            </div>
                        </div>
                        <div className="flex items-center">
                            {doc.status === 'uploading' && (
                                <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                    <div className="h-full bg-gradient-primary rounded-full transition-all duration-300" style={{ width: `${doc.progress}%` }}></div>
                                </div>
                            )}
                            {doc.status === 'ready' && (
                                <button
                                    className="ml-2 px-4 py-2 bg-gradient-primary text-white rounded-lg shadow btn-hover-effect"
                                    onClick={() => processDocument(doc)}
                                >
                                    Analyze
                                </button>
                            )}
                            {doc.status === 'analyzed' && (
                                <span className="text-green-500 font-semibold">✓ Analyzed</span>
                            )}
                            {doc.status === 'processing' && <div className="loading-spinner"></div>}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default FileList;