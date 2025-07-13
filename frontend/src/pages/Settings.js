import React, { useState } from 'react';

const Settings = ({ isConnected }) => {
  const [settings, setSettings] = useState({
    riskLevel: 'medium',
    maxPositions: 10,
    stopLoss: 20,
    takeProfit: 50,
    notifications: true
  });

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Settings</h1>
        <div className="text-sm text-gray-400">
          {isConnected ? 'Live Configuration' : 'Demo Mode'}
        </div>
      </div>

      {/* Trading Settings */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">Trading Configuration</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Risk Level</label>
            <select 
              value={settings.riskLevel}
              onChange={(e) => handleSettingChange('riskLevel', e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Max Positions</label>
            <input 
              type="number"
              value={settings.maxPositions}
              onChange={(e) => handleSettingChange('maxPositions', parseInt(e.target.value))}
              className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Stop Loss (%)</label>
            <input 
              type="number"
              value={settings.stopLoss}
              onChange={(e) => handleSettingChange('stopLoss', parseInt(e.target.value))}
              className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Take Profit (%)</label>
            <input 
              type="number"
              value={settings.takeProfit}
              onChange={(e) => handleSettingChange('takeProfit', parseInt(e.target.value))}
              className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white"
            />
          </div>
        </div>
      </div>

      {/* System Information */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">System Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-gray-400">Version</p>
            <p className="text-white">Smart-Lean-0DTE v1.0</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Deployment</p>
            <p className="text-white">Lean Implementation</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Cost Optimization</p>
            <p className="text-green-400">89-90% Reduction</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Status</p>
            <p className="text-green-400">Operational</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;

