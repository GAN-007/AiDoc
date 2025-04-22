import React from 'react';
import { useDocument } from '../context/DocumentContext';

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

export default StatusNotification;