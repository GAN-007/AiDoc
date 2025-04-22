import React, { createContext, useContext, useState } from 'react';

const DocumentContext = createContext();

export const DocumentProvider = ({ children }) => {
    const [documents, setDocuments] = useState([]);
    const [activeDocument, setActiveDocument] = useState(null);
    const [originalDoc, setOriginalDoc] = useState(null);
    const [improvedDoc, setImprovedDoc] = useState(null);
    const [suggestions, setSuggestions] = useState([]);
    const [status, setStatus] = useState({ type: 'idle', message: '' });
    const [textInput, setTextInput] = useState('');
    const [showDemo, setShowDemo] = useState(true);
    const [analytics, setAnalytics] = useState({ wordCount: 0, readabilityScore: 0 });
    const [settings, setSettings] = useState({
        darkMode: false,
        autoSave: true,
        notifications: true,
        showAnimations: true,
        colorGradient: '#5D5CDE',
        aiModel: 'default'
    });

    return (
        <DocumentContext.Provider value={{
            documents, setDocuments,
            activeDocument, setActiveDocument,
            originalDoc, setOriginalDoc,
            improvedDoc, setImprovedDoc,
            suggestions, setSuggestions,
            status, setStatus,
            textInput, setTextInput,
            showDemo, setShowDemo,
            analytics, setAnalytics,
            settings, setSettings
        }}>
            {children}
        </DocumentContext.Provider>
    );
};

export const useDocument = () => useContext(DocumentContext);