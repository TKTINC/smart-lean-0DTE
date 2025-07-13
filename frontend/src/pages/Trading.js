import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import axios from 'axios';

const Trading = () => {
  const [automationSettings, setAutomationSettings] = useState({
    masterSwitch: true,
    dataCollection: true,
    signalGeneration: true,
    tradeExecution: true,
    riskManagement: true,
    maxPositions: 5,
    maxDayTrades: 3,
    maxRiskPerTrade: 2.0,
    stopLossPercentage: 15,
    takeProfitPercentage: 25
  });

  const [positions, setPositions] = useState([
    {
      id: 1,
      symbol: 'SPY',
      type: 'CALL',
      strike: 444,
      expiry: '0DTE',
      quantity: 10,
      entryPrice: 2.45,
      currentPrice: 2.78,
      entryTime: '10:15:23',
      pnl: 330,
      pnlPercent: 13.5,
      status: 'OPEN',
      stopLoss: 2.08,
      takeProfit: 3.06,
      confidence: 85,
      strategy: 'Momentum Breakout'
    },
    {
      id: 2,
      symbol: 'QQQ',
      type: 'PUT',
      strike: 380,
      expiry: '0DTE',
      quantity: 5,
      entryPrice: 1.85,
      currentPrice: 1.92,
      entryTime: '09:45:12',
      pnl: 35,
      pnlPercent: 3.8,
      status: 'OPEN',
      stopLoss: 1.57,
      takeProfit: 2.31,
      confidence: 78,
      strategy: 'Mean Reversion'
    },
    {
      id: 3,
      symbol: 'IWM',
      type: 'CALL',
      strike: 195,
      expiry: '0DTE',
      quantity: 8,
      entryPrice: 1.20,
      currentPrice: 0.00,
      entryTime: '09:31:45',
      exitTime: '10:05:12',
      exitPrice: 1.45,
      pnl: 200,
      pnlPercent: 20.8,
      status: 'CLOSED',
      confidence: 82,
      strategy: 'Gap Fill'
    }
  ]);

  const [marketData, setMarketData] = useState({
    spy: { price: 444.85, change: 2.15, changePercent: 0.48 },
    qqq: { price: 380.42, change: -1.23, changePercent: -0.32 },
    iwm: { price: 195.67, change: 0.89, changePercent: 0.46 },
    vix: { price: 14.23, change: -0.45, changePercent: -3.06 }
  });

  const [connectionStatus, setConnectionStatus] = useState({
    databento: true,
    ibkr: true,
    backend: true,
    database: true,
    redis: true
  });

  const [tradingQueue, setTradingQueue] = useState([
    {
      id: 1,
      symbol: 'SPY',
      type: 'PUT',
      strike: 443,
      confidence: 82,
      strategy: 'Reversal Signal',
      estimatedEntry: 2.15,
      queueTime: '10:22:15',
      status: 'PENDING_EXECUTION'
    }
  ]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('/api/trading');
        // Update state with real data when backend is connected
      } catch (error) {
        console.log('Using demo data - backend not connected');
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const handleAutomationToggle = async (setting, value) => {
    try {
      const newSettings = { ...automationSettings, [setting]: value };
      setAutomationSettings(newSettings);
      
      // If master switch is turned off, disable all automation
      if (setting === 'masterSwitch' && !value) {
        const disabledSettings = { ...newSettings };
        Object.keys(disabledSettings).forEach(key => {
          if (key !== 'masterSwitch' && typeof disabledSettings[key] === 'boolean') {
            disabledSettings[key] = false;
          }
        });
        setAutomationSettings(disabledSettings);
      }
      
      await axios.post('/api/automation/settings', newSettings);
    } catch (error) {
      console.log('Settings update failed - using local state');
    }
  };

  const handleEmergencyStop = async () => {
    try {
      await axios.post('/api/trading/emergency-stop');
      setAutomationSettings(prev => ({ ...prev, masterSwitch: false, tradeExecution: false }));
    } catch (error) {
      console.log('Emergency stop failed - using local state');
    }
  };

  const handleManualClose = async (positionId) => {
    try {
      await axios.post(`/api/trading/close-position/${positionId}`);
      setPositions(prev => prev.map(pos => 
        pos.id === positionId ? { ...pos, status: 'CLOSING' } : pos
      ));
    } catch (error) {
      console.log('Manual close failed');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'OPEN': return 'text-green-400';
      case 'CLOSED': return 'text-gray-400';
      case 'CLOSING': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  const getPnLColor = (pnl) => {
    return pnl >= 0 ? 'text-green-400' : 'text-red-400';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Autonomous Trading Control</h1>
        <div className="flex items-center space-x-4">
          <button
            onClick={handleEmergencyStop}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
          >
            🛑 EMERGENCY STOP
          </button>
          <div className="text-sm text-gray-400">
            {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* Master Control Panel */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Master Trading Controls</h2>
          <div className="flex items-center space-x-3">
            <span className="text-gray-300">Master Switch:</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={automationSettings.masterSwitch}
                onChange={(e) => handleAutomationToggle('masterSwitch', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
            </label>
            <span className={`font-semibold ${automationSettings.masterSwitch ? 'text-green-400' : 'text-red-400'}`}>
              {automationSettings.masterSwitch ? 'ACTIVE' : 'PAUSED'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Individual Controls */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-300">System Controls</h3>
            {['dataCollection', 'signalGeneration', 'tradeExecution', 'riskManagement'].map((setting) => (
              <div key={setting} className="flex items-center justify-between">
                <span className="text-gray-300 capitalize">{setting.replace(/([A-Z])/g, ' $1')}</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={automationSettings[setting]}
                    onChange={(e) => handleAutomationToggle(setting, e.target.checked)}
                    disabled={!automationSettings.masterSwitch}
                    className="sr-only peer"
                  />
                  <div className="w-8 h-4 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[1px] after:left-[1px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-green-600 peer-disabled:opacity-50"></div>
                </label>
              </div>
            ))}
          </div>

          {/* Risk Parameters */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-300">Risk Parameters</h3>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Max Positions</label>
              <input
                type="number"
                value={automationSettings.maxPositions}
                onChange={(e) => handleAutomationToggle('maxPositions', parseInt(e.target.value))}
                className="w-full bg-gray-700 text-white rounded px-3 py-1"
                min="1"
                max="10"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Max Day Trades</label>
              <input
                type="number"
                value={automationSettings.maxDayTrades}
                onChange={(e) => handleAutomationToggle('maxDayTrades', parseInt(e.target.value))}
                className="w-full bg-gray-700 text-white rounded px-3 py-1"
                min="1"
                max="3"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Max Risk Per Trade (%)</label>
              <input
                type="number"
                step="0.1"
                value={automationSettings.maxRiskPerTrade}
                onChange={(e) => handleAutomationToggle('maxRiskPerTrade', parseFloat(e.target.value))}
                className="w-full bg-gray-700 text-white rounded px-3 py-1"
                min="0.5"
                max="5.0"
              />
            </div>
          </div>

          {/* Exit Parameters */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-300">Exit Parameters</h3>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Stop Loss (%)</label>
              <input
                type="number"
                value={automationSettings.stopLossPercentage}
                onChange={(e) => handleAutomationToggle('stopLossPercentage', parseInt(e.target.value))}
                className="w-full bg-gray-700 text-white rounded px-3 py-1"
                min="5"
                max="50"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Take Profit (%)</label>
              <input
                type="number"
                value={automationSettings.takeProfitPercentage}
                onChange={(e) => handleAutomationToggle('takeProfitPercentage', parseInt(e.target.value))}
                className="w-full bg-gray-700 text-white rounded px-3 py-1"
                min="10"
                max="100"
              />
            </div>
          </div>

          {/* Connection Status */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-300">Connection Status</h3>
            {Object.entries(connectionStatus).map(([service, status]) => (
              <div key={service} className="flex items-center justify-between">
                <span className="text-gray-300 capitalize">{service}</span>
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${status ? 'bg-green-400' : 'bg-red-400'}`}></div>
                  <span className={`text-sm ${status ? 'text-green-400' : 'text-red-400'}`}>
                    {status ? 'Connected' : 'Disconnected'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Market Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Object.entries(marketData).map(([symbol, data]) => (
          <div key={symbol} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <h3 className="text-lg font-bold text-white uppercase">{symbol}</h3>
            <p className="text-2xl font-bold text-white">${data.price}</p>
            <p className={`text-sm ${data.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {data.change >= 0 ? '+' : ''}{data.change} ({data.changePercent >= 0 ? '+' : ''}{data.changePercent}%)
            </p>
          </div>
        ))}
      </div>

      {/* Trading Queue */}
      {tradingQueue.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-bold text-white mb-4">Trading Queue</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-2 text-gray-300">Symbol</th>
                  <th className="text-left py-2 text-gray-300">Type</th>
                  <th className="text-left py-2 text-gray-300">Strike</th>
                  <th className="text-left py-2 text-gray-300">Strategy</th>
                  <th className="text-left py-2 text-gray-300">Confidence</th>
                  <th className="text-left py-2 text-gray-300">Est. Entry</th>
                  <th className="text-left py-2 text-gray-300">Queue Time</th>
                  <th className="text-left py-2 text-gray-300">Status</th>
                </tr>
              </thead>
              <tbody>
                {tradingQueue.map((trade) => (
                  <tr key={trade.id} className="border-b border-gray-800">
                    <td className="py-2 text-white font-semibold">{trade.symbol}</td>
                    <td className={`py-2 font-semibold ${trade.type === 'CALL' ? 'text-green-400' : 'text-red-400'}`}>
                      {trade.type}
                    </td>
                    <td className="py-2 text-gray-300">${trade.strike}</td>
                    <td className="py-2 text-gray-300">{trade.strategy}</td>
                    <td className="py-2 text-yellow-400 font-semibold">{trade.confidence}%</td>
                    <td className="py-2 text-gray-300">${trade.estimatedEntry}</td>
                    <td className="py-2 text-gray-300">{trade.queueTime}</td>
                    <td className="py-2 text-blue-400 font-semibold">{trade.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Active Positions */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h2 className="text-xl font-bold text-white mb-4">Active Positions</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-2 text-gray-300">Symbol</th>
                <th className="text-left py-2 text-gray-300">Type</th>
                <th className="text-left py-2 text-gray-300">Strike</th>
                <th className="text-left py-2 text-gray-300">Qty</th>
                <th className="text-left py-2 text-gray-300">Entry</th>
                <th className="text-left py-2 text-gray-300">Current</th>
                <th className="text-left py-2 text-gray-300">P&L</th>
                <th className="text-left py-2 text-gray-300">Stop Loss</th>
                <th className="text-left py-2 text-gray-300">Take Profit</th>
                <th className="text-left py-2 text-gray-300">Strategy</th>
                <th className="text-left py-2 text-gray-300">Status</th>
                <th className="text-left py-2 text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              {positions.map((position) => (
                <tr key={position.id} className="border-b border-gray-800">
                  <td className="py-2 text-white font-semibold">{position.symbol}</td>
                  <td className={`py-2 font-semibold ${position.type === 'CALL' ? 'text-green-400' : 'text-red-400'}`}>
                    {position.type}
                  </td>
                  <td className="py-2 text-gray-300">${position.strike}</td>
                  <td className="py-2 text-gray-300">{position.quantity}</td>
                  <td className="py-2 text-gray-300">${position.entryPrice}</td>
                  <td className="py-2 text-gray-300">${position.currentPrice || position.exitPrice}</td>
                  <td className={`py-2 font-semibold ${getPnLColor(position.pnl)}`}>
                    ${position.pnl} ({position.pnlPercent >= 0 ? '+' : ''}{position.pnlPercent}%)
                  </td>
                  <td className="py-2 text-gray-300">${position.stopLoss || '-'}</td>
                  <td className="py-2 text-gray-300">${position.takeProfit || '-'}</td>
                  <td className="py-2 text-gray-300">{position.strategy}</td>
                  <td className={`py-2 font-semibold ${getStatusColor(position.status)}`}>{position.status}</td>
                  <td className="py-2">
                    {position.status === 'OPEN' && (
                      <button
                        onClick={() => handleManualClose(position.id)}
                        className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-sm transition-colors"
                      >
                        Close
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Trading;

