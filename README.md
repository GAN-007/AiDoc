# AI Doc Assistant

A React-based web application designed to enhance documents using AI-driven suggestions for grammar, clarity, and style. Users can upload documents (TXT, DOCX, PDF, CSV, XLSX), paste text, or try a demo document, view original and improved versions side by side, and accept or reject suggestions interactively.

## Features
- **Document Upload**: Supports `.txt`, `.docx`, `.pdf`, `.csv`, and `.xlsx` files with drag-and-drop or click-to-upload.
- **Text Input Analysis**: Paste text directly for AI analysis.
- **Document Viewer**: Side-by-side display of original and improved documents with highlighted suggestions.
- **Suggestion Interface**: Interactive suggestions with accept/reject options, categorized by grammar, clarity, and style.
- **Settings**: Toggle dark mode, autosave, notifications, animations, select AI model (display-only), and choose color themes.
- **Animations**: 3D effects, gradients, and motion graphics using Three.js and GSAP for enhanced UX.
- **Responsive Design**: Works across devices with Tailwind CSS.
- **Demo Mode**: Try a preloaded demo document to explore features.

## Prerequisites
- Modern web browser (Chrome, Firefox, Edge, Safari)
- Internet connection (for CDN-hosted dependencies)

## Installation
1. **Clone or Download**:
   - Clone the repository https://github.com/GAN-007/AiDoc or download the `index.html` file.
   ```bash
   git clone https://github.com/GAN-007/AiDoc
   ```
2. **Place in a Directory**:
   - Save `index.html` in a local directory (e.g., `ai-doc-assistant/`).
3. **Serve Locally** (optional for better experience):
   - Use a local server to avoid CORS issues with file uploads:
   ```bash
   npm install -g serve
   serve -s .
   ```
   - Alternatively, use Python:
   ```bash
   python -m http.server 8000
   ```
4. **Open in Browser**:
   - Navigate to `http://localhost:5000` (or the port provided by your server) or open `index.html` directly in a browser.

## Usage
1. **Launch the App**:
   - Open `index.html` in a browser or access via the local server.
2. **Upload Documents**:
   - Drag and drop files or click the upload area to select `.txt`, `.docx`, `.pdf`, `.csv`, or `.xlsx` files.
3. **Paste Text**:
   - Use the text input area to paste text and click "Analyze Text".
4. **Try Demo**:
   - Click "Try with Demo Document" to load a sample report.
5. **Review Documents**:
   - View original and improved documents side by side. Click highlighted suggestions to accept/reject via tooltips.
6. **Manage Suggestions**:
   - Use the suggestion interface to view pending, accepted, and rejected suggestions with detailed reasons.
7. **Customize Settings**:
   - Click the gear icon to toggle dark mode, autosave, notifications, animations, select an AI model, or change the color theme.
8. **Notifications**:
   - Status messages appear for loading, success, or errors (can be disabled in settings).

## Settings
- **Dark Mode**: Toggle for light/dark theme.
- **Auto-Save**: Logs improved document to console when suggestions are accepted (placeholder for future save functionality).
- **Notifications**: Enable/disable status messages.
- **Animations**: Enable/disable 3D and motion effects.
- **AI Model**: Select from Default, Advanced, or Experimental (display-only).
- **Color Theme**: Choose from Purple, Teal, Orange, Pink, Blue, Green.

## Dependencies
All dependencies are loaded via CDN:
- **React**: v18 (UMD)
- **React DOM**: v18 (UMD)
- **Babel**: Standalone for JSX transformation
- **Tailwind CSS**: v3 for styling
- **Three.js**: v0.152 for 3D animations
- **GSAP**: v3.11.5 for motion graphics
- **Marked**: For markdown parsing (not actively used but included)
- **Mammoth**: v1.4.16 for `.docx` processing
- **PDF.js**: v2.9.359 for `.pdf` processing

## Running Locally
- **Directly**: Open `index.html` in a browser. Note: File uploads may be restricted due to browser security (use a local server).
- **With Local Server**: Recommended for full functionality, especially file uploads.
- **Troubleshooting**:
  - Ensure internet connectivity for CDN resources.
  - If file uploads fail, use a local server or check browser console for errors.
  - For CORS issues, serve via `serve` or `python -m http.server`.

## Testing
Unit tests are not included in the single-file setup due to UMD module usage. Below are pseudo-code test cases for a Jest/React Testing Library setup:

```javascript
describe('FileUpload', () => {
  test('renders upload area', () => {
    const { getByText } = render(<FileUpload />);
    expect(getByText('Drag & Drop or Click to Upload')).toBeInTheDocument();
  });
});

describe('DocumentViewer', () => {
  test('displays documents', () => {
    const { getByText } = render(<DocumentViewer originalDoc="Test" improvedDoc="Improved" suggestions={[]} />);
    expect(getByText('Original')).toBeInTheDocument();
    expect(getByText('Improved')).toBeInTheDocument();
  });
});

describe('SuggestionInterface', () => {
  test('renders suggestions', () => {
    const suggestions = [{ id: 1, originalText: 'test', improvedText: 'improved', status: 'pending', reason: 'Test' }];
    const { getByText } = render(<SuggestionInterface suggestions={suggestions} />);
    expect(getByText('Accept')).toBeInTheDocument();
  });
});
```

To implement tests, set up a Node.js environment with Jest and React Testing Library, which is beyond this single-file scope. The app has been manually tested for functionality.

## Known Limitations
- **File Formats**: Limited to `.txt`, `.docx`, `.pdf`, `.csv`, `.xlsx`. Other formats return mock content.
- **AI Model Selection**: Display-only; does not affect processing logic.
- **Autosave**: Logs to console; no persistent storage implemented.
- **Testing**: No automated tests in single-file setup; manual testing ensures functionality.
- **Browser Compatibility**: Works best in modern browsers; older browsers may have issues with Three.js or Tailwind CSS.

## Contributing
Contributions are welcome! To contribute:
1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/new-feature`).
3. Commit changes (`git commit -m 'Add new feature'`).
4. Push to the branch (`git push origin feature/new-feature`).
5. Open a pull request.

## License
See the [LICENSE](#license) section below.

## Contact
For issues or suggestions, contact George Alfred via https://github.com/GAN-007/AiDoc
---
**Built with ❤️ by George Alfred**