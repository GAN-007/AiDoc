import React from 'react';
import { useDocument } from '../context/DocumentContext';

function FileUpload() {
    const { handleFileUpload, handleTextAnalysis, textInput, setTextInput, loadDemoDocument, analytics } = useDocument();
    const fileInputRef = React.useRef();
    const [isDragging, setIsDragging] = React.useState(false);

    const handleChange = (e) => {
        if (e.target.files.length) handleFileUpload(e.target.files);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files.length) handleFileUpload(e.dataTransfer.files);
    };

    return (
        <div className="max-w-2xl mx-auto p-4 fade-in">
            <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleChange} accept=".txt,.docx,.pdf,.csv,.xlsx" />
            <div
                className={`border-3 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 ${
                    isDragging ? 'border-primary bg-primary bg-opacity-10 scale-105' : 'border-gray-300 dark:border-gray-600 hover:border-primary hover:scale-102'
                }`}
                onClick={() => fileInputRef.current.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                <div className="flex flex-col items-center">
                    <div className="mb-4 text-5xl float-animation">📄</div>
                    <h3 className="text-xl font-semibold mb-2">Drag & Drop or Click to Upload</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Supports .TXT, .DOCX, .PDF, .CSV, .XLSX</p>
                    <button
                        className="bg-gradient-primary text-white px-6 py-2 rounded-full btn-hover-effect"
                        onClick={(e) => {
                            e.stopPropagation();
                            fileInputRef.current.click();
                        }}
                    >
                        Browse Files
                    </button>
                    <div className="mt-4">
                        <button
                            className="text-primary underline hover:text-primary-hover"
                            onClick={(e) => {
                                e.stopPropagation();
                                loadDemoDocument();
                            }}
                        >
                            or try with a demo document
                        </button>
                    </div>
                </div>
            </div>
            <div className="mt-6 p-4 bg-light-card dark:bg-dark-card rounded-xl shadow-lg card-3d">
                <h3 className="text-xl font-bold mb-4">Or Paste Text</h3>
                <textarea
                    className="w-full h-32 p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="Paste your text here... (Ctrl+Enter to analyze)"
                />
                <div className="flex justify-between items-center mt-2">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                        {analytics.wordCount > 0 && (
                            <>
                                Words: {analytics.wordCount} | Readability: {analytics.readabilityScore} (Flesch-Kincaid)
                            </>
                        )}
                    </div>
                    <button
                        className="px-4 py-2 bg-gradient-primary text-white rounded-lg btn-hover-effect"
                        onClick={handleTextAnalysis}
                    >
                        Analyze Text
                    </button>
                </div>
            </div>
        </div>
    );
}

export default FileUpload;