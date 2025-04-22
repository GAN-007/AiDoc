const DocumentContext = React.createContext();

const fileTypeIcons = {
    pdf: "📄", docx: "📝", txt: "📄", xlsx: "📊", csv: "📊", sql: "🗃️",
    zip: "🗜️", rar: "🗜️", jpg: "🖼️", png: "🖼️", mp3: "🔊", mp4: "🎬", unknown: "📎"
};

const getFileIcon = (fileName) => {
    const ext = fileName.split('.').pop().toLowerCase();
    return fileTypeIcons[ext] || fileTypeIcons.unknown;
};

async function readFileContent(file) {
    try {
        if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target.result);
                reader.readAsText(file);
            });
        } else if (file.type === 'application/pdf') {
            const url = URL.createObjectURL(file);
            const pdf = await pdfjsLib.getDocument(url).promise;
            let text = '';
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const content = await page.getTextContent();
                text += content.items.map(item => item.str).join(' ') + '\n';
            }
            URL.revokeObjectURL(url);
            return text;
        } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            const arrayBuffer = await file.arrayBuffer();
            const result = await mammoth.extractRawText({ arrayBuffer });
            return result.value;
        } else if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target.result);
                reader.readAsText(file);
            });
        } else {
            return `Mock content for ${file.name}.`;
        }
    } catch (error) {
        console.error('File reading error:', error);
        return `Error reading ${file.name}.`;
    }
}

function calculateReadability(text) {
    if (!text.trim()) return { wordCount: 0, readabilityScore: 0 };

    const words = text.split(/\s+/).filter(w => w.length > 0);
    const wordCount = words.length;
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
    const syllables = words.reduce((count, word) => {
        word = word.toLowerCase();
        if (word.length <= 3) return count + 1;
        let syllableCount = 0;
        let vowels = 'aeiouy';
        let prevCharWasVowel = false;
        for (let i = 0; i < word.length; i++) {
            let isVowel = vowels.includes(word[i]);
            if (isVowel && !prevCharWasVowel) syllableCount++;
            prevCharWasVowel = isVowel;
        }
        return count + Math.max(1, syllableCount);
    }, 0);

    // Flesch-Kincaid Reading Ease
    const readabilityScore = 206.835 - 1.015 * (wordCount / sentences) - 84.6 * (syllables / wordCount);
    return {
        wordCount,
        readabilityScore: Math.round(readabilityScore * 10) / 10
    };
}

function mockFastAPIProcess(content) {
    let improvedDoc = content;
    const suggestions = [];
    let id = 1;

    // Grammar suggestion: "end of Q2" -> "the end of Q2"
    const grammarPattern = /end of Q2/gi;
    let match;
    while ((match = grammarPattern.exec(content)) !== null) {
        const start = match.index;
        const originalText = match[0];
        const improvedText = 'the end of Q2';
        improvedDoc = improvedDoc.substring(0, start) + improvedText + improvedDoc.substring(start + originalText.length);
        suggestions.push({
            id: id++,
            start,
            end: start + improvedText.length,
            originalText,
            improvedText,
            reason: 'Added "the" for grammatical correctness',
            type: 'grammar',
            status: 'pending'
        });
    }

    // Clarity suggestion: "report" -> "detailed report"
    const clarityPattern = /report/gi;
    while ((match = clarityPattern.exec(content)) !== null && suggestions.length < 5) {
        const start = match.index;
        const originalText = match[0];
        const improvedText = 'detailed report';
        improvedDoc = improvedDoc.substring(0, start) + improvedText + improvedDoc.substring(start + originalText.length);
        suggestions.push({
            id: id++,
            start,
            end: start + improvedText.length,
            originalText,
            improvedText,
            reason: 'Enhanced clarity with adjective',
            type: 'clarity',
            status: 'pending'
        });
    }

    // Style suggestion: "important" -> "crucial"
    const stylePattern = /important/gi;
    while ((match = stylePattern.exec(content)) !== null && suggestions.length < 10) {
        const start = match.index;
        const originalText = match[0];
        const improvedText = 'crucial';
        improvedDoc = improvedDoc.substring(0, start) + improvedText + improvedDoc.substring(start + originalText.length);
        suggestions.push({
            id: id++,
            start,
            end: start + improvedText.length,
            originalText,
            improvedText,
            reason: 'Improved style with stronger adjective',
            type: 'style',
            status: 'pending'
        });
    }

    // If no suggestions, add mock ones
    if (suggestions.length === 0) {
        suggestions.push({
            id: id++,
            start: 0,
            end: 7,
            originalText: content.substring(0, 7) || "Sample",
            improvedText: "Improved " + (content.substring(0, 7) || "Sample"),
            reason: 'General enhancement suggestion',
            type: 'general',
            status: 'pending'
        });
    }

    return { improvedDoc, suggestions };
}

function DocumentProvider({ children }) {
    const [documents, setDocuments] = React.useState(() => {
        const saved = localStorage.getItem('documents');
        return saved ? JSON.parse(saved) : [];
    });
    const [activeDocument, setActiveDocument] = React.useState(null);
    const [originalDoc, setOriginalDoc] = React.useState(null);
    const [improvedDoc, setImprovedDoc] = React.useState(null);
    const [suggestions, setSuggestions] = React.useState([]);
    const [status, setStatus] = React.useState({ type: 'idle', message: '' });
    const [textInput, setTextInput] = React.useState('');
    const [showDemo, setShowDemo] = React.useState(true);
    const [settings, setSettings] = React.useState(() => {
        const saved = localStorage.getItem('settings');
        return saved ? JSON.parse(saved) : {
            darkMode: document.documentElement.classList.contains('dark'),
            autoSave: true,
            notifications: true,
            showAnimations: true,
            colorGradient: '#5D5CDE',
            aiModel: 'default'
        };
    });
    const [analytics, setAnalytics] = React.useState({ wordCount: 0, readabilityScore: 0 });
    const [animationPaused, setAnimationPaused] = React.useState(false);

    React.useEffect(() => {
        localStorage.setItem('documents', JSON.stringify(documents));
    }, [documents]);

    React.useEffect(() => {
        localStorage.setItem('settings', JSON.stringify(settings));
        document.documentElement.classList.toggle('dark', settings.darkMode);
    }, [settings]);

    React.useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.ctrlKey && e.key === 'Enter' && textInput.trim()) {
                handleTextAnalysis();
            }
            if (e.ctrlKey && e.key === 'a' && suggestions.length > 0) {
                suggestions.forEach(s => {
                    if (s.status === 'pending') handleSuggestion(s.id, 'accepted');
                });
            }
            if (e.ctrlKey && e.key === 'r' && suggestions.length > 0) {
                suggestions.forEach(s => {
                    if (s.status === 'pending') handleSuggestion(s.id, 'rejected');
                });
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [textInput, suggestions]);

    const handleFileUpload = async (files) => {
        setShowDemo(false);
        setStatus({ type: 'loading', message: 'Uploading files...' });
        const newDocs = Array.from(files).map(file => ({
            id: `${Date.now()}-${Math.random()}`,
            file,
            name: file.name,
            status: 'uploading',
            progress: 0,
            icon: getFileIcon(file.name),
            uploadDate: new Date().toLocaleString()
        }));
        setDocuments(prev => [...prev, ...newDocs]);

        for (const doc of newDocs) {
            let progress = 0;
            const interval = setInterval(() => {
                progress += 20;
                setDocuments(prev => prev.map(d => d.id === doc.id ? { ...d, progress } : d));
                if (progress >= 100) {
                    clearInterval(interval);
                    setDocuments(prev => prev.map(d => d.id === doc.id ? { ...d, status: 'ready' } : d));
                    if (newDocs.indexOf(doc) === 0) processDocument(doc);
                }
            }, 300);
        }
        setStatus({ type: 'success', message: 'Files uploaded successfully!' });
        setTimeout(() => setStatus({ type: 'idle', message: '' }), 3000);
    };

    const handleTextAnalysis = async () => {
        if (!textInput.trim()) {
            setStatus({ type: 'error', message: 'Please enter text to analyze.' });
            setTimeout(() => setStatus({ type: 'idle', message: '' }), 3000);
            return;
        }
        setShowDemo(false);
        setStatus({ type: 'loading', message: 'Analyzing text...' });
        setOriginalDoc(textInput);

        const analyticsData = calculateReadability(textInput);
        setAnalytics(analyticsData);

        setTimeout(() => {
            const { improvedDoc, suggestions } = mockFastAPIProcess(textInput);
            setImprovedDoc(improvedDoc);
            setSuggestions(suggestions);
            setStatus({ type: 'success', message: 'Analysis complete!' });
            setTimeout(() => setStatus({ type: 'idle', message: '' }), 3000);
        }, 1500);
    };

    const processDocument = async (doc) => {
        setDocuments(prev => prev.map(d => d.id === doc.id ? { ...d, status: 'processing' } : d));
        setActiveDocument(doc);
        setStatus({ type: 'loading', message: 'Analyzing document...' });
        const content = await readFileContent(doc.file);
        setOriginalDoc(content);

        const analyticsData = calculateReadability(content);
        setAnalytics(analyticsData);

        setTimeout(() => {
            const { improvedDoc, suggestions } = mockFastAPIProcess(content);
            setImprovedDoc(improvedDoc);
            setSuggestions(suggestions);
            setDocuments(prev => prev.map(d => d.id === doc.id ? { ...d, status: 'analyzed' } : d));
            setStatus({ type: 'success', message: 'Analysis complete!' });
            setTimeout(() => setStatus({ type: 'idle', message: '' }), 3000);
        }, 1500);
    };

    const handleSuggestion = (id, action) => {
        const updatedSuggestions = suggestions.map(s => s.id === id ? { ...s, status: action } : s);
        setSuggestions(updatedSuggestions);
        let newImprovedDoc = originalDoc;
        updatedSuggestions
            .sort((a, b) => a.start - b.start)
            .forEach(s => {
                if (s.status === 'accepted') {
                    newImprovedDoc = newImprovedDoc.substring(0, s.start) + s.improvedText + newImprovedDoc.substring(s.end);
                }
            });
        setImprovedDoc(newImprovedDoc);
        if (settings.notifications) {
            setStatus({
                type: 'success',
                message: action === 'accepted' ? 'Suggestion accepted!' : 'Suggestion rejected!'
            });
            setTimeout(() => setStatus({ type: 'idle', message: '' }), 2000);
        }
        if (settings.autoSave) {
            localStorage.setItem(`improvedDoc-${activeDocument?.id || 'text'}`, newImprovedDoc);
        }
    };

    const exportDocument = () => {
        if (!improvedDoc) return;
        const blob = new Blob([improvedDoc], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${activeDocument?.name.replace(/\.[^/.]+$/, '') || 'improved'}_improved.txt`;
        a.click();
        URL.revokeObjectURL(url);
        setStatus({ type: 'success', message: 'Document exported!' });
        setTimeout(() => setStatus({ type: 'idle', message: '' }), 3000);
    };

    const loadDemoDocument = () => {
        setShowDemo(false);
        setStatus({ type: 'loading', message: 'Loading demo document...' });
        const demoDoc = {
            id: `demo-${Date.now()}`,
            name: 'quarterly-report.txt',
            status: 'ready',
            icon: getFileIcon('quarterly-report.txt'),
            uploadDate: new Date().toLocaleString()
        };
        setDocuments([demoDoc]);
        setActiveDocument(demoDoc);
        const demoContent = `QUARTERLY BUSINESS REPORT
Q2 2023

EXECUTIVE SUMMARY
This report provides a comprehensive overview of our business performance during end of Q2 2023. The company has experienced significant growth across multiple product lines and expanded into new markets.

KEY FINDINGS
- Revenue increased by 18% compared to Q1
- Customer acquisition costs decreased by 7%
- New product line exceeded expectations with 125% of target sales
- Market share grew from 23% to 27% in core segments

CHALLENGES
The engineering team faced some delays in the development of our mobile application update. The marketing team also reported difficulties in penetrating the European market despite increased spending on advertising.

RECOMMENDATIONS
Based on the report findings, we recommend:
1. Increasing investment in the successful product lines
2. Reassessing the European market strategy
3. Allocating additional resources to the engineering team
4. Developing a more comprehensive report for stakeholders

CONCLUSION
Overall, the business is performing well and is on track to meet annual targets. The executive team should continue monitoring the identified challenges while capitalizing on the growth opportunities.`;
        setOriginalDoc(demoContent);
        const analyticsData = calculateReadability(demoContent);
        setAnalytics(analyticsData);
        setTimeout(() => {
            const { improvedDoc, suggestions } = mockFastAPIProcess(demoContent);
            setImprovedDoc(improvedDoc);
            setSuggestions(suggestions);
            setStatus({ type: 'success', message: 'Demo document loaded!' });
            setTimeout(() => setStatus({ type: 'idle', message: '' }), 3000);
        }, 1500);
    };

    const toggleDarkMode = () => {
        setSettings(prev => ({ ...prev, darkMode: !prev.darkMode }));
    };

    const updateColorGradient = (color) => {
        document.documentElement.style.setProperty('--primary-color', color);
        document.documentElement.style.setProperty('--gradient-start', color);
        const lightenColor = (color, percent) => {
            const num = parseInt(color.replace('#', ''), 16),
                amt = Math.round(2.55 * percent),
                R = (num >> 16) + amt,
                G = (num >> 8 & 0x00FF) + amt,
                B = (num & 0x0000FF) + amt;
            return '#' + (
                0x1000000 +
                (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
                (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
                (B < 255 ? B < 1 ? 0 : B : 255)
            ).toString(16).slice(1);
        };
        const gradientEnd = lightenColor(color, 10);
        document.documentElement.style.setProperty('--gradient-end', gradientEnd);
        setSettings(prev => ({ ...prev, colorGradient: color }));
    };

    const updateAIModel = (model) => {
        setSettings(prev => ({ ...prev, aiModel: model }));
    };

    return (
        <DocumentContext.Provider value={{
            documents, activeDocument, originalDoc, improvedDoc, suggestions, status, settings, textInput, showDemo, analytics, animationPaused,
            handleFileUpload, handleTextAnalysis, processDocument, handleSuggestion, loadDemoDocument, exportDocument,
            toggleDarkMode, updateColorGradient, updateAIModel, setTextInput, setAnimationPaused
        }}>
            {children}
        </DocumentContext.Provider>
    );
}

const useDocument = () => React.useContext(DocumentContext);

function Hero3DAnimation() {
    const canvasRef = React.useRef();
    const { settings, animationPaused, setAnimationPaused } = useDocument();
    const sceneRef = React.useRef(null);
    const animationFrameRef = React.useRef(null);

    React.useEffect(() => {
        if (!settings.showAnimations || !canvasRef.current) return;
        if (sceneRef.current) {
            sceneRef.current.clear();
            sceneRef.current = null;
        }
        const width = canvasRef.current.clientWidth;
        const height = canvasRef.current.clientHeight;
        const scene = new THREE.Scene();
        sceneRef.current = scene;
        const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
        camera.position.z = 5;
        const renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current, alpha: true, antialias: true });
        renderer.setSize(width, height);
        renderer.setClearColor(0x000000, 0);

        const createTexture = (text, color = 0x5D5CDE, bgColor = 0xffffff) => {
            const canvas = document.createElement('canvas');
            canvas.width = 512;
            canvas.height = 512;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = `#${bgColor.toString(16).padStart(6, '0')}`;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = `#${color.toString(16).padStart(6, '0')}`;
            ctx.font = 'bold 32px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const lines = [];
            const words = text.split(' ');
            let currentLine = words[0];
            for (let i = 1; i < words.length; i++) {
                const word = words[i];
                const width = ctx.measureText(currentLine + ' ' + word).width;
                if (width < canvas.width - 60) {
                    currentLine += ' ' + word;
                } else {
                    lines.push(currentLine);
                    currentLine = word;
                }
            }
            lines.push(currentLine);
            lines.forEach((line, index) => {
                const y = canvas.height / 2 - (lines.length - 1) * 20 / 2 + index * 40;
                ctx.fillText(line, canvas.width / 2, y);
            });
            ctx.fillStyle = '#CCCCCC';
            for (let i = 0; i < 10; i++) {
                ctx.fillRect(50, 200 + i * 25, 412, 2);
            }
            const texture = new THREE.CanvasTexture(canvas);
            return new THREE.MeshBasicMaterial({ map: texture });
        };

        const originalMaterial = createTexture('Original Document', 0x5D5CDE);
        const improvedMaterial = createTexture('Improved Document', 0xFF5151);
        const pageGeometry = new THREE.PlaneGeometry(1.8, 2.5);
        const originalPage = new THREE.Mesh(pageGeometry, originalMaterial);
        originalPage.position.x = -1.2;
        scene.add(originalPage);
        const improvedPage = new THREE.Mesh(pageGeometry, improvedMaterial);
        improvedPage.position.x = 1.2;
        scene.add(improvedPage);
        const arrowGeometry = new THREE.PlaneGeometry(1, 0.3);
        const arrowMaterial = createTexture('→ AI Magic →', 0x00D0BD, 0x000000);
        const arrow = new THREE.Mesh(arrowGeometry, arrowMaterial);
        scene.add(arrow);
        let time = 0;
        const animate = () => {
            if (!sceneRef.current || animationPaused) {
                animationFrameRef.current = requestAnimationFrame(animate);
                return;
            }
            time += 0.01;
            originalPage.position.y = Math.sin(time) * 0.1;
            improvedPage.position.y = Math.sin(time + 1) * 0.1;
            arrow.position.y = Math.sin(time + 0.5) * 0.1;
            originalPage.rotation.y = Math.sin(time * 0.5) * 0.1;
            improvedPage.rotation.y = Math.sin(time * 0.5 + 1) * 0.1;
            renderer.render(scene, camera);
            animationFrameRef.current = requestAnimationFrame(animate);
        };
        animate();
        const handleResize = () => {
            if (!canvasRef.current) return;
            const width = canvasRef.current.clientWidth;
            const height = canvasRef.current.clientHeight;
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
            renderer.setSize(width, height);
        };
        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
            renderer.dispose();
            if (sceneRef.current) {
                sceneRef.current.clear();
                sceneRef.current = null;
            }
        };
    }, [settings.showAnimations, animationPaused]);

    if (!settings.showAnimations) return null;
    return (
        <div className="w-full h-64 relative overflow-hidden mb-4">
            <canvas ref={canvasRef} className="w-full h-full" />
            <button
                className="absolute top-4 right-4 p-2 bg-gradient-primary text-white rounded-full btn-hover-effect"
                onClick={() => setAnimationPaused(!animationPaused)}
            >
                {animationPaused ? '▶️' : '⏸️'}
            </button>
        </div>
    );
}

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
        {/* Container for the list of suggestions */}
        <div className="space-y-4">
            {/* Map through each pending suggestion */}
            {pendingSuggestions.map(s => (
                // Outermost element for each suggestion, with the unique key
                <div
                    key={s.id}
                    className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-all border border-gray-100 dark:border-gray-700/50"
                >
                    {/* Top section: Status tag and Suggestion ID/Type */}
                    <div className="flex justify-between items-center mb-3">
                        <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300 rounded text-xs font-medium">
                            Pending
                        </span>
                        <span className="text-gray-500 dark:text-gray-400 text-xs font-mono">
                            ID: {s.id} {s.type ? `(${s.type})` : ''} {/* Display type if available */}
                        </span>
                    </div>

                    {/* Middle section: Original vs Improved text */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                        {/* Original Text Block */}
                        <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded border border-gray-200 dark:border-gray-600">
                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 font-medium">Original:</div>
                            <div className="font-mono text-sm text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-800 p-2 rounded break-words">
                                {s.originalText}
                            </div>
                        </div>
                        {/* Improved Text Block */}
                        <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded border border-gray-200 dark:border-gray-600">
                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 font-medium">Suggested:</div>
                            <div className="font-mono text-sm text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-800 p-2 rounded break-words">
                                {s.improvedText}
                            </div>
                        </div>
                    </div>

                    {/* Reason section */}
                    <div className="mb-4">
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 font-medium">Reason:</div>
                        <div className="text-sm p-3 bg-gray-50 dark:bg-gray-700/50 rounded text-gray-700 dark:text-gray-300">
                            {s.reason}
                        </div>
                    </div>

                    {/* Action buttons section */}
                    <div className="flex justify-end space-x-3">
                        <button
                            title="Accept Suggestion"
                            className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white text-sm font-semibold rounded-lg shadow btn-hover-effect focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                            onClick={() => handleSuggestion(s.id, 'accepted')}
                        >
                            Accept ✓
                        </button>
                        <button
                            title="Reject Suggestion"
                            className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white text-sm font-semibold rounded-lg shadow btn-hover-effect focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                            onClick={() => handleSuggestion(s.id, 'rejected')}
                        >
                            Reject ✕
                        </button>
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

function SettingsSidebar() {
    const { settings, toggleDarkMode, updateColorGradient, updateAIModel } = useDocument();
    const [isOpen, setIsOpen] = React.useState(false);

    const colors = [
        { name: 'Purple', value: '#5D5CDE', class: 'bg-[#5D5CDE]' },
        { name: 'Teal', value: '#00D0BD', class: 'bg-[#00D0BD]' },
        { name: 'Orange', value: '#FFA41B', class: 'bg-[#FFA41B]' },
        { name: 'Pink', value: '#F472B6', class: 'bg-[#F472B6]' },
        { name: 'Blue', value: '#3B82F6', class: 'bg-[#3B82F6]' },
        { name: 'Green', value: '#10B981', class: 'bg-[#10B981]' },
    ];

    const aiModels = [
        { name: 'Default AI', value: 'default' },
        { name: 'Advanced AI', value: 'advanced' },
        { name: 'Experimental AI', value: 'experimental' }
    ];

    return (
        <>
            <button
                className="fixed top-4 right-4 p-3 bg-gradient-primary text-white rounded-full shadow-lg hover:shadow-xl transition-all z-10"
                onClick={() => setIsOpen(!isOpen)}
            >
                ⚙️
            </button>
            <div className={`fixed top-0 right-0 h-full w-80 bg-white dark:bg-gray-800 p-6 shadow-lg z-20 transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-semibold text-xl">Settings</h3>
                    <button className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white" onClick={() => setIsOpen(false)}>✕</button>
                </div>
                <div className="space-y-6">
                    <div>
                        <h4 className="font-medium text-lg mb-3">Interface</h4>
                        <div className="space-y-3">
                            <label className="flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                                <span>Dark Mode</span>
                                <div className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer ${settings.darkMode ? 'bg-primary justify-end' : 'bg-gray-300 justify-start'}`} onClick={toggleDarkMode}>
                                    <div className="bg-white w-4 h-4 rounded-full shadow-md"></div>
                                </div>
                            </label>
                            <label className="flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                                <span>Auto-Save</span>
                                <div
                                    className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer ${settings.autoSave ? 'bg-primary justify-end' : 'bg-gray-300 justify-start'}`}
                                    onClick={() => setSettings(prev => ({ ...prev, autoSave: !prev.autoSave }))}
                                >
                                    <div className="bg-white w-4 h-4 rounded-full shadow-md"></div>
                                </div>
                            </label>
                            <label className="flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                                <span>Notifications</span>
                                <div
                                    className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer ${settings.notifications ? 'bg-primary justify-end' : 'bg-gray-300 justify-start'}`}
                                    onClick={() => setSettings(prev => ({ ...prev, notifications: !prev.notifications }))}
                                >
                                    <div className="bg-white w-4 h-4 rounded-full shadow-md"></div>
                                </div>
                            </label>
                            <label className="flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                                <span>Animations</span>
                                <div
                                    className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer ${settings.showAnimations ? 'bg-primary justify-end' : 'bg-gray-300 justify-start'}`}
                                    onClick={() => setSettings(prev => ({ ...prev, showAnimations: !prev.showAnimations }))}
                                >
                                    <div className="bg-white w-4 h-4 rounded-full shadow-md"></div>
                                </div>
                            </label>
                        </div>
                    </div>
                    <div>
                        <h4 className="font-medium text-lg mb-3">AI Model</h4>
                        <select
                            className="w-full p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                            value={settings.aiModel}
                            onChange={(e) => updateAIModel(e.target.value)}
                        >
                            {aiModels.map(model => (
                                <option key={model.value} value={model.value}>{model.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <h4 className="font-medium text-lg mb-3">Color Theme</h4>
                        <div className="grid grid-cols-3 gap-3">
                            {colors.map(color => (
                                <button
                                    key={color.value}
                                    className={`w-full h-10 rounded-lg transition-all ${color.class} ${settings.colorGradient === color.value ? 'ring-2 ring-offset-2 ring-gray-400' : ''}`}
                                    onClick={() => updateColorGradient(color.value)}
                                    title={color.name}
                                />
                            ))}
                        </div>
                    </div>
                    <div>
                        <h4 className="font-medium text-lg mb-3">Document Processing</h4>
                        <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-sm">
                            This AI assistant can currently process text, PDFs, and Word documents. More formats coming soon!
                        </div>
                    </div>
                </div>
            </div>
            {isOpen && <div className="fixed inset-0 bg-black bg-opacity-30 z-10" onClick={() => setIsOpen(false)} />}
        </>
    );
}

function StatusNotification() {
    const { status, settings } = useDocument();
    if (status.type === 'idle' || !settings.notifications) return null;

    const getStatusStyles = () => {
        switch (status.type) {
            case 'loading': return 'bg-blue-500 text-white';
            case 'success': return 'bg-green-500 text-white';
            case 'error': return 'bg-red-500 text-white';
            default: return 'bg-gray-500 text-white';
        }
    };

    return (
        <div className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg z-30 fade-in flex items-center ${getStatusStyles()}`}>
            {status.type === 'loading' && <div className="loading-spinner mr-3 border-white border-r-transparent"></div>}
            {status.type === 'success' && <div className="mr-3">✅</div>}
            {status.type === 'error' && <div className="mr-3">❌</div>}
            <div>{status.message}</div>
        </div>
    );
}

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

function App() {
    return (
        <div className="min-h-screen">
            <header className="bg-gradient-primary text-white p-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
                    <div className="absolute top-10 left-10 w-32 h-32 bg-white opacity-5 rounded-full"></div>
                    <div className="absolute bottom-10 right-20 w-48 h-48 bg-white opacity-5 rounded-full"></div>
                    <div className="absolute top-20 right-40 w-16 h-16 bg-white opacity-5 rounded-full"></div>
                </div>
                <div className="container mx-auto relative z-10">
                    <div className="flex justify-between items-center">
                        <h1 className="text-3xl font-bold flex items-center">
                            <span className="text-white text-opacity-70 mr-2">AI Doc Assistant</span>
                            <span className="text-xs bg-white bg-opacity-20 px-2 py-1 rounded">By George Alfred</span>
                        </h1>
                        <div className="hidden md:flex space-x-4">
                            <a href="/" className="text-white text-opacity-80 hover:text-opacity-100 transition-opacity">Home</a>
                            <a href="#settings" onClick={() => toggleSettings()} className="text-white text-opacity-80 hover:text-opacity-100 transition-opacity">Features</a>
                            <a href="/help.html" className="text-white text-opacity-80 hover:text-opacity-100 transition-opacity">Help</a>
                        </div>
                    </div>
                </div>
            </header>
            <Hero3DAnimation />
            <HeroWelcome />
            <main className="container mx-auto py-6">
                <FileUpload />
                <FileList />
                <DocumentViewer />
                <SuggestionInterface />
            </main>
            <footer className="bg-light-card dark:bg-dark-card p-6 mt-10">
                <div className="container mx-auto text-center text-gray-600 dark:text-gray-400 text-sm">
                    <p>AI Doc Assistant © 2025 by George Alfred</p>
                    <p className="mt-2">Enhance your documents with artificial intelligence</p>
                </div>
            </footer>
            <SettingsSidebar />
            <StatusNotification />
        </div>
    );
}

ReactDOM.createRoot(document.getElementById('root')).render(
    <DocumentProvider>
        <App />
    </DocumentProvider>
);

// Unit Tests (only run in testing environment)
if (typeof describe !== 'undefined') {
    // Import testing utilities (available in Jest environment)
    const { render, screen, fireEvent, waitFor } = require('@testing-library/react');
    const { act } = require('react-dom/test-utils');

    // Mock external dependencies
    jest.mock('pdfjs-dist', () => ({
        getDocument: jest.fn(() => ({
            promise: Promise.resolve({
                numPages: 1,
                getPage: jest.fn(() => Promise.resolve({
                    getTextContent: jest.fn(() => Promise.resolve({
                        items: [{ str: 'Mock PDF content' }]
                    }))
                }))
            })
        }))
    }));

    jest.mock('mammoth', () => ({
        extractRawText: jest.fn(() => Promise.resolve({ value: 'Mock DOCX content' }))
    }));

    global.THREE = {
        Scene: jest.fn(() => ({
            add: jest.fn(),
            clear: jest.fn()
        })),
        PerspectiveCamera: jest.fn(() => ({
            position: { z: 0 },
            updateProjectionMatrix: jest.fn()
        })),
        WebGLRenderer: jest.fn(() => ({
            setSize: jest.fn(),
            setClearColor: jest.fn(),
            render: jest.fn(),
            dispose: jest.fn()
        })),
        PlaneGeometry: jest.fn(),
        MeshBasicMaterial: jest.fn(),
        Mesh: jest.fn(() => ({
            position: { x: 0, y: 0 },
            rotation: { y: 0 }
        })),
        CanvasTexture: jest.fn()
    };

    // Mock browser APIs
    const mockLocalStorage = {
        store: {},
        getItem: jest.fn((key) => mockLocalStorage.store[key] || null),
        setItem: jest.fn((key, value) => (mockLocalStorage.store[key] = value)),
        clear: jest.fn(() => (mockLocalStorage.store = {}))
    };
    Object.defineProperty(global, 'localStorage', { value: mockLocalStorage });

    global.URL = {
        createObjectURL: jest.fn(() => 'mock-url'),
        revokeObjectURL: jest.fn()
    };

    global.FileReader = jest.fn(() => ({
        readAsText: jest.fn(),
        onload: null,
        result: 'Mock file content'
    }));

    global.document = {
        createElement: jest.fn((tag) => ({
            tagName: tag.toUpperCase(),
            href: '',
            download: '',
            click: jest.fn(),
            getContext: jest.fn(() => ({
                fillStyle: '',
                fillRect: jest.fn(),
                fillText: jest.fn(),
                measureText: jest.fn(() => ({ width: 100 })),
                font: '',
                textAlign: '',
                textBaseline: ''
            })),
            style: { setProperty: jest.fn() },
            classList: { add: jest.fn(), remove: jest.fn(), toggle: jest.fn() }
        })),
        documentElement: { style: { setProperty: jest.fn() }, classList: { contains: jest.fn(() => false), toggle: jest.fn() } },
        querySelector: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn()
    };

    global.window = {
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        requestAnimationFrame: jest.fn((cb) => setTimeout(cb, 0)),
        cancelAnimationFrame: jest.fn()
    };

    // Mock Date.now for consistent IDs
    jest.spyOn(Date, 'now').mockImplementation(() => 1234567890);

    // Mock Math.random for consistent IDs
    jest.spyOn(Math, 'random').mockImplementation(() => 0.123456789);

    // Utility Function Tests
    describe('Utility Functions', () => {
        describe('getFileIcon', () => {
            it('returns correct icon for known file extensions', () => {
                expect(getFileIcon('document.pdf')).toBe('📄');
                expect(getFileIcon('document.docx')).toBe('📝');
                expect(getFileIcon('image.png')).toBe('🖼️');
                expect(getFileIcon('video.mp4')).toBe('🎬');
            });

            it('returns unknown icon for unrecognized extensions', () => {
                expect(getFileIcon('document.xyz')).toBe('📎');
            });

            it('handles case insensitivity', () => {
                expect(getFileIcon('document.PDF')).toBe('📄');
                expect(getFileIcon('document.TXT')).toBe('📄');
            });
        });

        describe('calculateReadability', () => {
            it('returns zero for empty or whitespace-only text', () => {
                expect(calculateReadability('')).toEqual({ wordCount: 0, readabilityScore: 0 });
                expect(calculateReadability('   ')).toEqual({ wordCount: 0, readabilityScore: 0 });
            });

            it('calculates correct word count and readability score', () => {
                const text = 'This is a simple sentence. Another sentence.';
                const result = calculateReadability(text);
                expect(result.wordCount).toBe(7);
                expect(result.readabilityScore).toBeCloseTo(81.7, 1);
            });

            it('handles single sentence with complex words', () => {
                const text = 'The elephant is enormous.';
                const result = calculateReadability(text);
                expect(result.wordCount).toBe(4);
                expect(result.readabilityScore).toBeCloseTo(60.6, 1);
            });
        });

        describe('mockFastAPIProcess', () => {
            it('generates grammar suggestions for "end of Q2"', () => {
                const content = 'Performance at end of Q2 was strong.';
                const result = mockFastAPIProcess(content);
                expect(result.improvedDoc).toContain('the end of Q2');
                expect(result.suggestions).toContainEqual(
                    expect.objectContaining({
                        originalText: 'end of Q2',
                        improvedText: 'the end of Q2',
                        type: 'grammar',
                        status: 'pending'
                    })
                );
            });

            it('generates clarity suggestions for "report"', () => {
                const content = 'The report is ready.';
                const result = mockFastAPIProcess(content);
                expect(result.improvedDoc).toContain('detailed report');
                expect(result.suggestions).toContainEqual(
                    expect.objectContaining({
                        originalText: 'report',
                        improvedText: 'detailed report',
                        type: 'clarity',
                        status: 'pending'
                    })
                );
            });

            it('generates style suggestions for "important"', () => {
                const content = 'This is important.';
                const result = mockFastAPIProcess(content);
                expect(result.improvedDoc).toContain('crucial');
                expect(result.suggestions).toContainEqual(
                    expect.objectContaining({
                        originalText: 'important',
                        improvedText: 'crucial',
                        type: 'style',
                        status: 'pending'
                    })
                );
            });

            it('adds mock suggestion when no matches found', () => {
                const content = 'Hello world';
                const result = mockFastAPIProcess(content);
                expect(result.suggestions).toContainEqual(
                    expect.objectContaining({
                        originalText: 'Hello w',
                        improvedText: 'Improved Hello w',
                        type: 'general',
                        status: 'pending'
                    })
                );
            });
        });

        describe('readFileContent', () => {
            it('reads text file content', async () => {
                const file = { type: 'text/plain', name: 'test.txt' };
                const mockReader = new global.FileReader();
                mockReader.readAsText.mockImplementation(() => {
                    mockReader.onload({ target: { result: 'Mock text content' } });
                });
                const content = await readFileContent(file);
                expect(content).toBe('Mock text content');
            });

            it('reads PDF file content', async () => {
                const file = { type: 'application/pdf', name: 'test.pdf' };
                const content = await readFileContent(file);
                expect(content).toBe('Mock PDF content\n');
            });

            it('reads DOCX file content', async () => {
                const file = {
                    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    name: 'test.docx',
                    arrayBuffer: jest.fn(() => Promise.resolve(new ArrayBuffer(8)))
                };
                const content = await readFileContent(file);
                expect(content).toBe('Mock DOCX content');
            });

            it('handles errors gracefully', async () => {
                const file = { type: 'invalid/type', name: 'test.invalid' };
                const content = await readFileContent(file);
                expect(content).toBe('Mock content for test.invalid');
            });
        });
    });

    // Component and Hook Tests
    describe('Components and Hooks', () => {
        beforeEach(() => {
            mockLocalStorage.clear();
            jest.clearAllMocks();
        });

        describe('DocumentProvider and useDocument', () => {
            it('provides context values and initializes from localStorage', () => {
                mockLocalStorage.setItem('documents', JSON.stringify([{ id: '1', name: 'test.txt' }]));
                mockLocalStorage.setItem('settings', JSON.stringify({ darkMode: true }));
                let contextValue;
                const TestComponent = () => {
                    contextValue = useDocument();
                    return null;
                };
                render(
                    <DocumentProvider>
                        <TestComponent />
                    </DocumentProvider>
                );
                expect(contextValue.documents).toEqual([{ id: '1', name: 'test.txt' }]);
                expect(contextValue.settings.darkMode).toBe(true);
            });

            it('updates localStorage on documents change', () => {
                const TestComponent = () => {
                    const { handleFileUpload } = useDocument();
                    React.useEffect(() => {
                        handleFileUpload([new File(['content'], 'test.txt', { type: 'text/plain' })]);
                    }, []);
                    return null;
                };
                render(
                    <DocumentProvider>
                        <TestComponent />
                    </DocumentProvider>
                );
                expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
                    'documents',
                    expect.stringContaining('test.txt')
                );
            });

            it('handles keyboard shortcuts', async () => {
                const TestComponent = () => {
                    const { setTextInput, suggestions, setSuggestions } = useDocument();
                    React.useEffect(() => {
                        setTextInput('test');
                        setSuggestions([{ id: 1, status: 'pending', start: 0, end: 4, originalText: 'test', improvedText: 'best' }]);
                    }, []);
                    return null;
                };
                render(
                    <DocumentProvider>
                        <TestComponent />
                    </DocumentProvider>
                );
                const event = new KeyboardEvent('keydown', { ctrlKey: true, key: 'a' });
                await act(async () => {
                    window.dispatchEvent(event);
                });
                expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
                    'improvedDoc-text',
                    expect.stringContaining('best')
                );
            });
        });

        describe('Hero3DAnimation', () => {
            it('does not render when showAnimations is false', () => {
                const mockContext = {
                    settings: { showAnimations: false },
                    animationPaused: false,
                    setAnimationPaused: jest.fn()
                };
                jest.spyOn(React, 'useContext').mockReturnValue(mockContext);
                render(<Hero3DAnimation />);
                expect(screen.queryByRole('button')).not.toBeInTheDocument();
            });

            it('toggles animation pause state', () => {
                const mockContext = {
                    settings: { showAnimations: true },
                    animationPaused: false,
                    setAnimationPaused: jest.fn()
                };
                jest.spyOn(React, 'useContext').mockReturnValue(mockContext);
                render(<Hero3DAnimation />);
                const button = screen.getByRole('button', { name: '⏸️' });
                fireEvent.click(button);
                expect(mockContext.setAnimationPaused).toHaveBeenCalledWith(true);
            });
        });

        describe('FileUpload', () => {
            it('renders file upload and text input sections', () => {
                const mockContext = {
                    handleFileUpload: jest.fn(),
                    handleTextAnalysis: jest.fn(),
                    textInput: '',
                    setTextInput: jest.fn(),
                    loadDemoDocument: jest.fn(),
                    analytics: { wordCount: 0, readabilityScore: 0 }
                };
                jest.spyOn(React, 'useContext').mockReturnValue(mockContext);
                render(<FileUpload />);
                expect(screen.getByText('Drag & Drop or Click to Upload')).toBeInTheDocument();
                expect(screen.getByPlaceholderText('Paste your text here... (Ctrl+Enter to analyze)')).toBeInTheDocument();
            });

            it('triggers file upload on file selection', () => {
                const mockContext = {
                    handleFileUpload: jest.fn(),
                    handleTextAnalysis: jest.fn(),
                    textInput: '',
                    setTextInput: jest.fn(),
                    loadDemoDocument: jest.fn(),
                    analytics: { wordCount: 0, readabilityScore: 0 }
                };
                jest.spyOn(React, 'useContext').mockReturnValue(mockContext);
                render(<FileUpload />);
                const input = screen.getByTestId('file-input', { hidden: true });
                fireEvent.change(input, { target: { files: [new File(['content'], 'test.txt')] } });
                expect(mockContext.handleFileUpload).toHaveBeenCalled();
            });

            it('displays analytics when available', () => {
                const mockContext = {
                    handleFileUpload: jest.fn(),
                    handleTextAnalysis: jest.fn(),
                    textInput: '',
                    setTextInput: jest.fn(),
                    loadDemoDocument: jest.fn(),
                    analytics: { wordCount: 100, readabilityScore: 75 }
                };
                jest.spyOn(React, 'useContext').mockReturnValue(mockContext);
                render(<FileUpload />);
                expect(screen.getByText('Words: 100 | Readability: 75 (Flesch-Kincaid)')).toBeInTheDocument();
            });
        });

        describe('FileList', () => {
            it('renders nothing when documents are empty', () => {
                const mockContext = { documents: [], processDocument: jest.fn() };
                jest.spyOn(React, 'useContext').mockReturnValue(mockContext);
                render(<FileList />);
                expect(screen.queryByText('Your Documents')).not.toBeInTheDocument();
            });

            it('renders document list with correct status', () => {
                const mockContext = {
                    documents: [
                        { id: '1', name: 'test.txt', status: 'ready', icon: '📄', uploadDate: '2023-01-01' }
                    ],
                    processDocument: jest.fn()
                };
                jest.spyOn(React, 'useContext').mockReturnValue(mockContext);
                render(<FileList />);
                expect(screen.getByText('test.txt')).toBeInTheDocument();
                expect(screen.getByRole('button', { name: 'Analyze' })).toBeInTheDocument();
            });
        });

        describe('DocumentViewer', () => {
            it('renders nothing when no documents are loaded', () => {
                const mockContext = {
                    originalDoc: null,
                    improvedDoc: null,
                    suggestions: [],
                    handleSuggestion: jest.fn(),
                    analytics: { wordCount: 0, readabilityScore: 0 },
                    exportDocument: jest.fn()
                };
                jest.spyOn(React, 'useContext').mockReturnValue(mockContext);
                render(<DocumentViewer />);
                expect(screen.queryByText('Document Comparison')).not.toBeInTheDocument();
            });

            it('renders original and improved documents with suggestions', () => {
                const mockContext = {
                    originalDoc: 'Original text',
                    improvedDoc: 'Improved text',
                    suggestions: [
                        {
                            id: 1,
                            start: 0,
                            end: 8,
                            originalText: 'Original',
                            improvedText: 'Improved',
                            status: 'pending',
                            reason: 'Test suggestion',
                            type: 'general'
                        }
                    ],
                    handleSuggestion: jest.fn(),
                    analytics: { wordCount: 2, readabilityScore: 80 },
                    exportDocument: jest.fn()
                };
                jest.spyOn(React, 'useContext').mockReturnValue(mockContext);
                render(<DocumentViewer />);
                expect(screen.getByText('Original text')).toBeInTheDocument();
                expect(screen.getByText('Improved text')).toBeInTheDocument();
                expect(screen.getByText('Document Analytics')).toBeInTheDocument();
            });

            it('handles suggestion interactions', () => {
                const mockContext = {
                    originalDoc: 'Original text',
                    improvedDoc: 'Improved text',
                    suggestions: [
                        {
                            id: 1,
                            start: 0,
                            end: 8,
                            originalText: 'Original',
                            improvedText: 'Improved',
                            status: 'pending',
                            reason: 'Test suggestion',
                            type: 'general'
                        }
                    ],
                    handleSuggestion: jest.fn(),
                    analytics: { wordCount: 2, readabilityScore: 80 },
                    exportDocument: jest.fn()
                };
                jest.spyOn(React, 'useContext').mockReturnValue(mockContext);
                render(<DocumentViewer />);
                const suggestion = screen.getByText('Improved');
                fireEvent.click(suggestion);
                expect(screen.getByText('Reason: Test suggestion')).toBeInTheDocument();
                fireEvent.click(screen.getByRole('button', { name: 'Accept' }));
                expect(mockContext.handleSuggestion).toHaveBeenCalledWith(1, 'accepted');
            });
        });

        describe('SuggestionInterface', () => {
            it('renders nothing when no suggestions', () => {
                const mockContext = { suggestions: [], handleSuggestion: jest.fn() };
                jest.spyOn(React, 'useContext').mockReturnValue(mockContext);
                render(<SuggestionInterface />);
                expect(screen.queryByText('AI Improvement Suggestions')).not.toBeInTheDocument();
            });

            it('displays suggestion counts and details', () => {
                const mockContext = {
                    suggestions: [
                        {
                            id: 1,
                            start: 0,
                            end: 8,
                            originalText: 'Original',
                            improvedText: 'Improved',
                            status: 'pending',
                            reason: 'Test suggestion',
                            type: 'general'
                        },
                        {
                            id: 2,
                            start: 9,
                            end: 14,
                            originalText: 'text',
                            improvedText: 'content',
                            status: 'accepted',
                            reason: 'Improved clarity',
                            type: 'clarity'
                        },
                        {
                            id: 3,
                            start: 15,
                            end: 20,
                            originalText: 'more',
                            improvedText: 'extra',
                            status: 'rejected',
                            reason: 'Style preference',
                            type: 'style'
                        }
                    ],
                    handleSuggestion: jest.fn()
                };
                jest.spyOn(React, 'useContext').mockReturnValue(mockContext);
                render(<SuggestionInterface />);
                expect(screen.getByText('1')).toBeInTheDocument(); // Pending count
                expect(screen.getByText('1')).toBeInTheDocument(); // Accepted count
                expect(screen.getByText('1')).toBeInTheDocument(); // Rejected count
                expect(screen.getByText('Pending Suggestions')).toBeInTheDocument();
                expect(screen.getByText('Original: Original')).toBeInTheDocument();
                expect(screen.getByText('Improved: Improved')).toBeInTheDocument();
                expect(screen.getByText('Reason: Test suggestion')).toBeInTheDocument();
                expect(screen.getByText('Resolved Suggestions')).toBeInTheDocument();
                expect(screen.getByText('Accepted')).toBeInTheDocument();
                expect(screen.getByText('Rejected')).toBeInTheDocument();
            });

            it('handles suggestion actions', () => {
                const mockContext = {
                    suggestions: [
                        {
                            id: 1,
                            start: 0,
                            end: 8,
                            originalText: 'Original',
                            improvedText: 'Improved',
                            status: 'pending',
                            reason: 'Test suggestion',
                            type: 'general'
                        }
                    ],
                    handleSuggestion: jest.fn()
                };
                jest.spyOn(React, 'useContext').mockReturnValue(mockContext);
                render(<SuggestionInterface />);
                fireEvent.click(screen.getByRole('button', { name: 'Accept' }));
                expect(mockContext.handleSuggestion).toHaveBeenCalledWith(1, 'accepted');
                fireEvent.click(screen.getByRole('button', { name: 'Reject' }));
                expect(mockContext.handleSuggestion).toHaveBeenCalledWith(1, 'rejected');
            });
        });

        describe('SettingsSidebar', () => {
            it('toggles sidebar visibility', () => {
                const mockContext = {
                    settings: {
                        darkMode: false,
                        autoSave: true,
                        notifications: true,
                        showAnimations: true,
                        colorGradient: '#5D5CDE',
                        aiModel: 'default'
                    },
                    toggleDarkMode: jest.fn(),
                    updateColorGradient: jest.fn(),
                    updateAIModel: jest.fn()
                };
                jest.spyOn(React, 'useContext').mockReturnValue(mockContext);
                render(<SettingsSidebar />);
                expect(screen.queryByText('Settings')).not.toBeInTheDocument();
                fireEvent.click(screen.getByRole('button', { name: '⚙️' }));
                expect(screen.getByText('Settings')).toBeInTheDocument();
                fireEvent.click(screen.getByRole('button', { name: '✕' }));
                expect(screen.queryByText('Settings')).not.toBeInTheDocument();
            });

            it('toggles settings', () => {
                const mockContext = {
                    settings: {
                        darkMode: false,
                        autoSave: true,
                        notifications: true,
                        showAnimations: true,
                        colorGradient: '#5D5CDE',
                        aiModel: 'default'
                    },
                    toggleDarkMode: jest.fn(),
                    updateColorGradient: jest.fn(),
                    updateAIModel: jest.fn()
                };
                jest.spyOn(React, 'useContext').mockReturnValue(mockContext);
                render(<SettingsSidebar />);
                fireEvent.click(screen.getByRole('button', { name: '⚙️' }));
                fireEvent.click(screen.getByLabelText('Dark Mode').querySelector('.cursor-pointer'));
                expect(mockContext.toggleDarkMode).toHaveBeenCalled();
                fireEvent.change(screen.getByRole('combobox'), { target: { value: 'advanced' } });
                expect(mockContext.updateAIModel).toHaveBeenCalledWith('advanced');
                fireEvent.click(screen.getByTitle('Teal'));
                expect(mockContext.updateColorGradient).toHaveBeenCalledWith('#00D0BD');
            });
        });

        describe('StatusNotification', () => {
            it('renders nothing when status is idle', () => {
                const mockContext = {
                    status: { type: 'idle', message: '' },
                    settings: { notifications: true }
                };
                jest.spyOn(React, 'useContext').mockReturnValue(mockContext);
                render(<StatusNotification />);
                expect(screen.queryByText('Uploading files...')).not.toBeInTheDocument();
            });

            it('renders loading notification', () => {
                const mockContext = {
                    status: { type: 'loading', message: 'Uploading files...' },
                    settings: { notifications: true }
                };
                jest.spyOn(React, 'useContext').mockReturnValue(mockContext);
                render(<StatusNotification />);
                expect(screen.getByText('Uploading files...')).toBeInTheDocument();
                expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
            });

            it('renders success notification', () => {
                const mockContext = {
                    status: { type: 'success', message: 'Files uploaded!' },
                    settings: { notifications: true }
                };
                jest.spyOn(React, 'useContext').mockReturnValue(mockContext);
                render(<StatusNotification />);
                expect(screen.getByText('Files uploaded!')).toBeInTheDocument();
                expect(screen.getByText('✅')).toBeInTheDocument();
            });

            it('renders error notification', () => {
                const mockContext = {
                    status: { type: 'error', message: 'Upload failed!' },
                    settings: { notifications: true }
                };
                jest.spyOn(React, 'useContext').mockReturnValue(mockContext);
                render(<StatusNotification />);
                expect(screen.getByText('Upload failed!')).toBeInTheDocument();
                expect(screen.getByText('❌')).toBeInTheDocument();
            });

            it('does not render when notifications are disabled', () => {
                const mockContext = {
                    status: { type: 'success', message: 'Files uploaded!' },
                    settings: { notifications: false }
                };
                jest.spyOn(React, 'useContext').mockReturnValue(mockContext);
                render(<StatusNotification />);
                expect(screen.queryByText('Files uploaded!')).not.toBeInTheDocument();
            });
        });

        describe('HeroWelcome', () => {
            it('renders nothing when showDemo is false', () => {
                const mockContext = { showDemo: false, loadDemoDocument: jest.fn() };
                jest.spyOn(React, 'useContext').mockReturnValue(mockContext);
                render(<HeroWelcome />);
                expect(screen.queryByText('AI Document Assistant')).not.toBeInTheDocument();
            });

            it('renders welcome content and triggers demo', () => {
                const mockContext = { showDemo: true, loadDemoDocument: jest.fn() };
                jest.spyOn(React, 'useContext').mockReturnValue(mockContext);
                render(<HeroWelcome />);
                expect(screen.getByText('AI Document Assistant')).toBeInTheDocument();
                fireEvent.click(screen.getByRole('button', { name: 'Try with Demo Document' }));
                expect(mockContext.loadDemoDocument).toHaveBeenCalled();
            });
        });

        describe('App', () => {
            it('renders all main components', () => {
                render(
                    <DocumentProvider>
                        <App />
                    </DocumentProvider>
                );
                expect(screen.getByText('AI Doc Assistant')).toBeInTheDocument();
                expect(screen.getByText('AI Document Assistant')).toBeInTheDocument();
                expect(screen.getByText('AI Doc Assistant © 2025 by George Alfred')).toBeInTheDocument();
                expect(screen.getByRole('button', { name: '⚙️' })).toBeInTheDocument();
            });
        });
    });
}