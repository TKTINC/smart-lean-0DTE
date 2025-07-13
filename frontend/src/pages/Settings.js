import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('automation');
  const [settings, setSettings] = useState({
    automation: {
      masterSwitch: true,
      dataCollection: true,
      signalGeneration: true,
      tradeExecution: true,
      riskManagement: true,
      marketHoursOnly: true,
      preMarketData: false,
      afterHoursTrading: false,
      weekendLearning: true
    },
    dataFeeds: {
      databento: {
        enabled: true,
        apiKey: 'db-***************',
        symbols: ['SPY', 'QQQ', 'IWM'],
        dataTypes: ['trades', 'quotes', 'options'],
        realtime: true,
        historical: true
      },
      ibkr: {
        enabled: true,
        username: 'trader_***',
        connected: true,
        paperTrading: false,
        accountType: 'margin',
        dayTradingBuyingPower: 125000
      }
    },
    trading: {
      maxPositions: 5,
      maxDayTrades: 3,
      maxRiskPerTrade: 2.0,
      stopLossPercentage: 15,
      takeProfitPercentage: 25,
      positionSizing: 'fixed',
      riskPercentage: 1.0,
      minConfidence: 75,
      maxSlippage: 0.05
    },
    learning: {
      eodReportTime: '16:30',
      learningSchedule: 'daily',
      modelRetraining: 'weekly',
      backtestPeriod: 30,
      adaptationSpeed: 'medium',
      dataRetention: 365,
      performanceThreshold: 70
    },
    notifications: {
      email: 'trader@example.com',
      emailEnabled: true,
      smsEnabled: false,
      tradeAlerts: true,
      systemAlerts: true,
      performanceReports: true,
      errorNotifications: true
    },
    system: {
      timezone: 'America/New_York',
      theme: 'dark',
      refreshRate: 5,
      logLevel: 'info',
      backupEnabled: true,
      backupFrequency: 'daily'
    }
  });

  const [testResults, setTestResults] = useState({
    databento: null,
    ibkr: null,
    email: null
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await axios.get('/api/settings');
        setSettings(response.data);
      } catch (error) {
        console.log('Using demo settings - backend not connected');
      }
    };

    fetchSettings();
  }, []);

  const handleSettingChange = async (category, setting, value) => {
    try {
      const newSettings = {
        ...settings,
        [category]: {
          ...settings[category],
          [setting]: value
        }
      };
      setSettings(newSettings);
      await axios.post('/api/settings', newSettings);
    } catch (error) {
      console.log('Settings update failed - using local state');
    }
  };

  const handleNestedSettingChange = async (category, subcategory, setting, value) => {
    try {
      const newSettings = {
        ...settings,
        [category]: {
          ...settings[category],
          [subcategory]: {
            ...settings[category][subcategory],
            [setting]: value
          }
        }
      };
      setSettings(newSettings);
      await axios.post('/api/settings', newSettings);
    } catch (error) {
      console.log('Settings update failed - using local state');
    }
  };

  const testConnection = async (service) => {
    try {
      setTestResults(prev => ({ ...prev, [service]: 'testing' }));
      const response = await axios.post(`/api/test-connection/${service}`);
      setTestResults(prev => ({ ...prev, [service]: response.data.success ? 'success' : 'failed' }));
    } catch (error) {
      setTestResults(prev => ({ ...prev, [service]: 'failed' }));
    }
  };

  const generateEODReport = async () => {
    try {
      await axios.post('/api/generate-eod-report');
      alert('EOD Report generation started. Check Analytics page for results.');
    } catch (error) {
      console.log('EOD Report generation failed');
    }
  };

  const startDataFeed = async () => {
    try {
      await axios.post('/api/start-data-feed');
      alert('Data feed started successfully.');
    } catch (error) {
      console.log('Data feed start failed');
    }
  };

  const connectIBKR = async () => {
    try {
      await axios.post('/api/connect-ibkr');
      alert('IBKR connection initiated.');
    } catch (error) {
      console.log('IBKR connection failed');
    }
  };

  const getTestResultColor = (result) => {
    switch (result) {
      case 'testing': return 'text-yellow-400';
      case 'success': return 'text-green-400';
      case 'failed': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getTestResultText = (result) => {
    switch (result) {
      case 'testing': return 'Testing...';
      case 'success': return 'Connected';
      case 'failed': return 'Failed';
      default: return 'Test';
    }
  };

  const tabs = [
    { id: 'automation', name: 'Automation', icon: '🤖' },
    { id: 'datafeeds', name: 'Data Feeds', icon: '📊' },
    { id: 'trading', name: 'Trading', icon: '💹' },
    { id: 'learning', name: 'Learning', icon: '🧠' },
    { id: 'notifications', name: 'Notifications', icon: '🔔' },
    { id: 'system', name: 'System', icon: '⚙️' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">System Settings</h1>
        <div className="flex items-center space-x-4">
          <button
            onClick={generateEODReport}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            📈 Generate EOD Report
          </button>
          <button
            onClick={startDataFeed}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            📡 Start Data Feed
          </button>
          <button
            onClick={connectIBKR}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            🔗 Connect IBKR
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-700">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300'
              }`}
            >
              {tab.icon} {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        {activeTab === 'automation' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white mb-4">Automation Controls</h2>
            
            {/* Master Control */}
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold text-white">Master Trading Switch</h3>
                  <p className="text-gray-400">Enable or disable all automated trading functions</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.automation.masterSwitch}
                    onChange={(e) => handleSettingChange('automation', 'masterSwitch', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-14 h-7 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-green-600"></div>
                </label>
              </div>
            </div>

            {/* Individual Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(settings.automation).filter(([key]) => key !== 'masterSwitch').map(([key, value]) => (
                <div key={key} className="flex items-center justify-between p-3 bg-gray-700 rounded">
                  <span className="text-gray-300 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) => handleSettingChange('automation', key, e.target.checked)}
                      disabled={!settings.automation.masterSwitch}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[1px] after:left-[1px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-600 peer-disabled:opacity-50"></div>
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'datafeeds' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white mb-4">Data Feed Configuration</h2>
            
            {/* Databento Settings */}
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-white">Databento Configuration</h3>
                <button
                  onClick={() => testConnection('databento')}
                  className={`px-3 py-1 rounded text-sm transition-colors ${getTestResultColor(testResults.databento)}`}
                >
                  {getTestResultText(testResults.databento)}
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">API Key</label>
                  <input
                    type="password"
                    value={settings.dataFeeds.databento.apiKey}
                    onChange={(e) => handleNestedSettingChange('dataFeeds', 'databento', 'apiKey', e.target.value)}
                    className="w-full bg-gray-600 text-white rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Symbols</label>
                  <input
                    type="text"
                    value={settings.dataFeeds.databento.symbols.join(', ')}
                    onChange={(e) => handleNestedSettingChange('dataFeeds', 'databento', 'symbols', e.target.value.split(', '))}
                    className="w-full bg-gray-600 text-white rounded px-3 py-2"
                  />
                </div>
              </div>
              <div className="mt-4 flex space-x-4">
                {['realtime', 'historical'].map((option) => (
                  <label key={option} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={settings.dataFeeds.databento[option]}
                      onChange={(e) => handleNestedSettingChange('dataFeeds', 'databento', option, e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-gray-300 capitalize">{option}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* IBKR Settings */}
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-white">Interactive Brokers</h3>
                <button
                  onClick={() => testConnection('ibkr')}
                  className={`px-3 py-1 rounded text-sm transition-colors ${getTestResultColor(testResults.ibkr)}`}
                >
                  {getTestResultText(testResults.ibkr)}
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Username</label>
                  <input
                    type="text"
                    value={settings.dataFeeds.ibkr.username}
                    onChange={(e) => handleNestedSettingChange('dataFeeds', 'ibkr', 'username', e.target.value)}
                    className="w-full bg-gray-600 text-white rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Account Type</label>
                  <select
                    value={settings.dataFeeds.ibkr.accountType}
                    onChange={(e) => handleNestedSettingChange('dataFeeds', 'ibkr', 'accountType', e.target.value)}
                    className="w-full bg-gray-600 text-white rounded px-3 py-2"
                  >
                    <option value="cash">Cash</option>
                    <option value="margin">Margin</option>
                  </select>
                </div>
              </div>
              <div className="mt-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={settings.dataFeeds.ibkr.paperTrading}
                    onChange={(e) => handleNestedSettingChange('dataFeeds', 'ibkr', 'paperTrading', e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-gray-300">Paper Trading Mode</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'trading' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white mb-4">Trading Parameters</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Position Management */}
              <div className="bg-gray-700 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-4">Position Management</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Max Positions</label>
                    <input
                      type="number"
                      value={settings.trading.maxPositions}
                      onChange={(e) => handleSettingChange('trading', 'maxPositions', parseInt(e.target.value))}
                      className="w-full bg-gray-600 text-white rounded px-3 py-2"
                      min="1"
                      max="10"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Max Day Trades</label>
                    <input
                      type="number"
                      value={settings.trading.maxDayTrades}
                      onChange={(e) => handleSettingChange('trading', 'maxDayTrades', parseInt(e.target.value))}
                      className="w-full bg-gray-600 text-white rounded px-3 py-2"
                      min="1"
                      max="3"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Position Sizing</label>
                    <select
                      value={settings.trading.positionSizing}
                      onChange={(e) => handleSettingChange('trading', 'positionSizing', e.target.value)}
                      className="w-full bg-gray-600 text-white rounded px-3 py-2"
                    >
                      <option value="fixed">Fixed Amount</option>
                      <option value="percentage">Percentage of Portfolio</option>
                      <option value="kelly">Kelly Criterion</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Risk Management */}
              <div className="bg-gray-700 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-4">Risk Management</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Max Risk Per Trade (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={settings.trading.maxRiskPerTrade}
                      onChange={(e) => handleSettingChange('trading', 'maxRiskPerTrade', parseFloat(e.target.value))}
                      className="w-full bg-gray-600 text-white rounded px-3 py-2"
                      min="0.5"
                      max="5.0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Stop Loss (%)</label>
                    <input
                      type="number"
                      value={settings.trading.stopLossPercentage}
                      onChange={(e) => handleSettingChange('trading', 'stopLossPercentage', parseInt(e.target.value))}
                      className="w-full bg-gray-600 text-white rounded px-3 py-2"
                      min="5"
                      max="50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Take Profit (%)</label>
                    <input
                      type="number"
                      value={settings.trading.takeProfitPercentage}
                      onChange={(e) => handleSettingChange('trading', 'takeProfitPercentage', parseInt(e.target.value))}
                      className="w-full bg-gray-600 text-white rounded px-3 py-2"
                      min="10"
                      max="100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Min Confidence (%)</label>
                    <input
                      type="number"
                      value={settings.trading.minConfidence}
                      onChange={(e) => handleSettingChange('trading', 'minConfidence', parseInt(e.target.value))}
                      className="w-full bg-gray-600 text-white rounded px-3 py-2"
                      min="50"
                      max="95"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'learning' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white mb-4">AI Learning Configuration</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Learning Schedule */}
              <div className="bg-gray-700 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-4">Learning Schedule</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">EOD Report Time</label>
                    <input
                      type="time"
                      value={settings.learning.eodReportTime}
                      onChange={(e) => handleSettingChange('learning', 'eodReportTime', e.target.value)}
                      className="w-full bg-gray-600 text-white rounded px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Learning Frequency</label>
                    <select
                      value={settings.learning.learningSchedule}
                      onChange={(e) => handleSettingChange('learning', 'learningSchedule', e.target.value)}
                      className="w-full bg-gray-600 text-white rounded px-3 py-2"
                    >
                      <option value="realtime">Real-time</option>
                      <option value="hourly">Hourly</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Model Retraining</label>
                    <select
                      value={settings.learning.modelRetraining}
                      onChange={(e) => handleSettingChange('learning', 'modelRetraining', e.target.value)}
                      className="w-full bg-gray-600 text-white rounded px-3 py-2"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Learning Parameters */}
              <div className="bg-gray-700 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-4">Learning Parameters</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Backtest Period (days)</label>
                    <input
                      type="number"
                      value={settings.learning.backtestPeriod}
                      onChange={(e) => handleSettingChange('learning', 'backtestPeriod', parseInt(e.target.value))}
                      className="w-full bg-gray-600 text-white rounded px-3 py-2"
                      min="7"
                      max="365"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Adaptation Speed</label>
                    <select
                      value={settings.learning.adaptationSpeed}
                      onChange={(e) => handleSettingChange('learning', 'adaptationSpeed', e.target.value)}
                      className="w-full bg-gray-600 text-white rounded px-3 py-2"
                    >
                      <option value="slow">Slow</option>
                      <option value="medium">Medium</option>
                      <option value="fast">Fast</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Data Retention (days)</label>
                    <input
                      type="number"
                      value={settings.learning.dataRetention}
                      onChange={(e) => handleSettingChange('learning', 'dataRetention', parseInt(e.target.value))}
                      className="w-full bg-gray-600 text-white rounded px-3 py-2"
                      min="30"
                      max="1095"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Performance Threshold (%)</label>
                    <input
                      type="number"
                      value={settings.learning.performanceThreshold}
                      onChange={(e) => handleSettingChange('learning', 'performanceThreshold', parseInt(e.target.value))}
                      className="w-full bg-gray-600 text-white rounded px-3 py-2"
                      min="50"
                      max="95"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white mb-4">Notification Settings</h2>
            
            <div className="bg-gray-700 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-4">Contact Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={settings.notifications.email}
                    onChange={(e) => handleSettingChange('notifications', 'email', e.target.value)}
                    className="w-full bg-gray-600 text-white rounded px-3 py-2"
                  />
                </div>
                <div className="flex items-center space-x-4 pt-6">
                  <button
                    onClick={() => testConnection('email')}
                    className={`px-3 py-1 rounded text-sm transition-colors ${getTestResultColor(testResults.email)}`}
                  >
                    {getTestResultText(testResults.email)} Email
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-gray-700 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-4">Notification Types</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(settings.notifications).filter(([key]) => key !== 'email').map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between p-2">
                    <span className="text-gray-300 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={(e) => handleSettingChange('notifications', key, e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-5 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[1px] after:left-[1px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-600"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'system' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white mb-4">System Configuration</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-700 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-4">General Settings</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Timezone</label>
                    <select
                      value={settings.system.timezone}
                      onChange={(e) => handleSettingChange('system', 'timezone', e.target.value)}
                      className="w-full bg-gray-600 text-white rounded px-3 py-2"
                    >
                      <option value="America/New_York">Eastern Time</option>
                      <option value="America/Chicago">Central Time</option>
                      <option value="America/Denver">Mountain Time</option>
                      <option value="America/Los_Angeles">Pacific Time</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Refresh Rate (seconds)</label>
                    <input
                      type="number"
                      value={settings.system.refreshRate}
                      onChange={(e) => handleSettingChange('system', 'refreshRate', parseInt(e.target.value))}
                      className="w-full bg-gray-600 text-white rounded px-3 py-2"
                      min="1"
                      max="60"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Log Level</label>
                    <select
                      value={settings.system.logLevel}
                      onChange={(e) => handleSettingChange('system', 'logLevel', e.target.value)}
                      className="w-full bg-gray-600 text-white rounded px-3 py-2"
                    >
                      <option value="debug">Debug</option>
                      <option value="info">Info</option>
                      <option value="warning">Warning</option>
                      <option value="error">Error</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-gray-700 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-4">Backup & Maintenance</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Backup Enabled</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.system.backupEnabled}
                        onChange={(e) => handleSettingChange('system', 'backupEnabled', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-5 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[1px] after:left-[1px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-600"></div>
                    </label>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Backup Frequency</label>
                    <select
                      value={settings.system.backupFrequency}
                      onChange={(e) => handleSettingChange('system', 'backupFrequency', e.target.value)}
                      className="w-full bg-gray-600 text-white rounded px-3 py-2"
                      disabled={!settings.system.backupEnabled}
                    >
                      <option value="hourly">Hourly</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;

