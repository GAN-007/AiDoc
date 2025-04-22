import React from 'react';
import { useDocument } from '../context/DocumentContext';

function HeroWelcome() {
    const { showDemo, loadDemoDocument } = useDocument();
    if (!showDemo) return null;

    return (
        <div className="max-w-4xl mx-auto p-4 text-center my-8 relative zoom-in">
            <div className="bg-light-card dark:bg-dark-card p-8 rounded-2xl shadow-xl relative overflow-hidden">
                <div className="hero-paper">
                    <div className="hero-paper-title"></div>
                    <div className="hero-paper-line"></div>
                    <div className="hero-paper-line"></div>
                    <div className="hero-paper-line"></div>
                </div>
                <div className="hero-paper">
                    <div className="hero-paper-title"></div>
                    <div className="hero-paper-line"></div>
                    <div className="hero-paper-line"></div>
                </div>
                <div className="hero-paper">
                    <div className="hero-paper-title"></div>
                    <div className="hero-paper-line"></div>
                    <div className="hero-paper-line"></div>
                    <div className="hero-paper-line"></div>
                </div>
                <div className="relative z-10">
                    <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-primary">AI Document Assistant</h1>
                    <p className="text-xl mb-8 max-w-2xl mx-auto">
                        Upload your documents or paste text and let AI improve them with smart suggestions for grammar, clarity, and style.
                    </p>
                    <div className="flex flex-col md:flex-row justify-center gap-4 mb-8">
                        <div className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow card-3d">
                            <div className="text-3xl mb-2">📤</div>
                            <h3 className="font-semibold">Upload Documents</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Supports TXT, DOCX, PDF, CSV, XLSX</p>
                        </div>
                        <div className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow card-3d">
                            <div className="text-3xl mb-2">✨</div>
                            <h3 className="font-semibold">AI Enhancement</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Improves clarity, grammar, and style</p>
                        </div>
                        <div className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow card-3d">
                            <div className="text-3xl mb-2">📝</div>
                            <h3 className="font-semibold">Review Changes</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Accept or reject AI suggestions</p>
                        </div>
                    </div>
                    <button
                        className="px-8 py-3 bg-gradient-primary text-white rounded-full text-lg shadow-lg btn-hover-effect"
                        onClick={loadDemoDocument}
                    >
                        Try with Demo Document
                    </button>
                </div>
            </div>
        </div>
    );
}

export default HeroWelcome;