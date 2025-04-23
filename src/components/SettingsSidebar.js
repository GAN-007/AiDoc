import React, { useState, useEffect } from 'react';
import { Grid, FormControlLabel, Switch, Typography, Paper } from '@mui/material';
import { useDocument } from '../context/DocumentContext';

const Settings = () => {
  const { settings, toggleDarkMode, updateColorGradient, updateAIModel } = useDocument();

  // State variables initialized with localStorage values or default to true
  const [autosaveEnabled, setAutosaveEnabled] = useState(() => {
    const saved = localStorage.getItem('autosaveEnabled');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    const saved = localStorage.getItem('notificationsEnabled');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const [animationsEnabled, setAnimationsEnabled] = useState(() => {
    const saved = localStorage.getItem('animationsEnabled');
    return saved !== null ? JSON.parse(saved) : true;
  });

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

  // Persist settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('autosaveEnabled', JSON.stringify(autosaveEnabled));
  }, [autosaveEnabled]);

  useEffect(() => {
    localStorage.setItem('notificationsEnabled', JSON.stringify(notificationsEnabled));
  }, [notificationsEnabled]);

  useEffect(() => {
    localStorage.setItem('animationsEnabled', JSON.stringify(animationsEnabled));
  }, [animationsEnabled]);

  // Render the settings UI
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
                  className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer ${autosaveEnabled ? 'bg-primary justify-end' : 'bg-gray-300 justify-start'}`}
                  onClick={() => setAutosaveEnabled(prev => !prev)}
                >
                  <div className="bg-white w-4 h-4 rounded-full shadow-md"></div>
                </div>
              </label>
              <label className="flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <span>Notifications</span>
                <div
                  className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer ${notificationsEnabled ? 'bg-primary justify-end' : 'bg-gray-300 justify-start'}`}
                  onClick={() => setNotificationsEnabled(prev => !prev)}
                >
                  <div className="bg-white w-4 h-4 rounded-full shadow-md"></div>
                </div>
              </label>
              <label className="flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <span>Animations</span>
                <div
                  className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer ${animationsEnabled ? 'bg-primary justify-end' : 'bg-gray-300 justify-start'}`}
                  onClick={() => setAnimationsEnabled(prev => !prev)}
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
};

export default Settings;