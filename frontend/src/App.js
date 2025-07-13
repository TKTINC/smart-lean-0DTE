import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Trading from './pages/Trading';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import './App.css';

function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [systemStatus, setSystemStatus] = useState('checking');

  useEffect(() => {
    checkSystemHealth();
    const interval = setInterval(checkSystemHealth, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const checkSystemHealth = async () => {
    try {
      const response = await fetch('/api/health');
      if (response.ok) {
        setIsConnected(true);
        setSystemStatus('healthy');
      } else {
        setIsConnected(false);
        setSystemStatus('error');
      }
    } catch (error) {
      setIsConnected(false);
      setSystemStatus('disconnected');
    }
  };

  const getStatusColor = () => {
    switch (systemStatus) {
      case 'healthy': return 'text-green-500';
      case 'error': return 'text-red-500';
      case 'disconnected': return 'text-red-500';
      default: return 'text-yellow-500';
    }
  };

  const getStatusText = () => {
    switch (systemStatus) {
      case 'healthy': return 'System Healthy';
      case 'error': return 'System Error';
      case 'disconnected': return 'Disconnected';
      default: return 'Checking...';
    }
  };

  return (
    <Router>
      <div className="min-h-screen bg-gray-900 text-white">
        {/* Header */}
        <header className="bg-gray-800 border-b border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center">
                <h1 className="text-2xl font-bold text-blue-400">Smart-Lean-0DTE</h1>
                <span className="ml-3 px-2 py-1 text-xs bg-blue-600 rounded-full">LEAN</span>
              </div>
              
              <nav className="hidden md:flex space-x-8">
                <Link to="/" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                  Dashboard
                </Link>
                <Link to="/trading" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                  Trading
                </Link>
                <Link to="/analytics" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                  Analytics
                </Link>
                <Link to="/settings" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                  Settings
                </Link>
              </nav>

              <div className="flex items-center space-x-4">
                <div className={`flex items-center space-x-2 ${getStatusColor()}`}>
                  <div className={`w-2 h-2 rounded-full ${systemStatus === 'healthy' ? 'bg-green-500' : systemStatus === 'checking' ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                  <span className="text-sm">{getStatusText()}</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {!isConnected && systemStatus !== 'checking' && (
            <div className="mb-6 bg-red-900 border border-red-700 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-400">
                    Backend Connection Error
                  </h3>
                  <div className="mt-2 text-sm text-red-300">
                    <p>Unable to connect to the Smart-Lean-0DTE backend. Please ensure the backend service is running.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <Routes>
            <Route path="/" element={<Dashboard isConnected={isConnected} />} />
            <Route path="/trading" element={<Trading isConnected={isConnected} />} />
            <Route path="/analytics" element={<Analytics isConnected={isConnected} />} />
            <Route path="/settings" element={<Settings isConnected={isConnected} />} />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="bg-gray-800 border-t border-gray-700 mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-400">
                Smart-Lean-0DTE System v1.0 - Professional 0DTE Trading at Lean Costs
              </div>
              <div className="text-sm text-gray-400">
                89-90% Cost Reduction | Enterprise Features
              </div>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;

