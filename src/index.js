import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app';
import './styles.css'; // Import your styles

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);