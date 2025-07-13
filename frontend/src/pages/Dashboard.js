import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from 'recharts';
import axios from 'axios';

const Dashboard = () => {
  const [data, setData] = useState({
    performance: {
      totalTrades: 1247,
      winRate: 78.5,
      totalPnL: 45670,
      todayPnL: 1234,
      activePositions: 3,
      dayTradesUsed: 2
    },
    costOptimization: {
      monthlySavings: 4915,
      savingsPercentage: 89.2,
      currentCost: 485,
      enterpriseCost: 5400
    },
    marketStatus: {
      isOpen: true,
      nextOpen: '9:30 AM ET',
      timeToClose: '2h 15m',
      tradingMode: 'ACTIVE'
    },
    automationStatus: {
      masterSwitch: true,
      dataCollection: true,
      signalGeneration: true,
      tradeExecution: true,
      riskManagement: true,
      lastSignal: '10:15 AM'
    },
    recentSignals: [
      { 
        id: 1,
        time: '10:15',
        symbol: 'SPY',
        type: 'CALL',
        strike: 445,
        expiry: '0DTE',
        confidence: 85,
        status: 'EXECUTED',
        entry: 2.45,
        current: 2.78,
        pnl: '+13.5%'
      },
      { 
        id: 2,
        time: '09:45',
        symbol: 'QQQ',
        type: 'PUT',
        strike: 380,
        expiry: '0DTE',
        confidence: 78,
        status: 'MONITORING',
        entry: 1.85,
        current: 1.92,
        pnl: '+3.8%'
      },
      { 
        id: 3,
        time: '09:31',
        symbol: 'IWM',
        type: 'CALL',
        strike: 195,
        expiry: '0DTE',
        confidence: 82,
        status: 'CLOSED',
        entry: 1.20,
        exit: 1.45,
        pnl: '+20.8%'
      }
    ],
    optionChain: {
      spy: {
        calls: [
          { strike: 440, price: 5.20, volume: 1250, iv: 0.28, delta: 0.75 },
          { strike: 442, price: 3.85, volume: 2100, iv: 0.26, delta: 0.68 },
          { strike: 444, price: 2.78, volume: 3200, iv: 0.25, delta: 0.58 },
          { strike: 446, price: 1.95, volume: 2800, iv: 0.24, delta: 0.45 },
          { strike: 448, price: 1.35, volume: 1900, iv: 0.23, delta: 0.32 }
        ],
        puts: [
          { strike: 440, price: 1.15, volume: 1100, iv: 0.27, delta: -0.25 },
          { strike: 442, price: 1.65, volume: 1800, iv: 0.25, delta: -0.32 },
          { strike: 444, price: 2.35, volume: 2400, iv: 0.24, delta: -0.42 },
          { strike: 446, price: 3.25, volume: 2200, iv: 0.23, delta: -0.55 },
          { strike: 448, price: 4.40, volume: 1600, iv: 0.22, delta: -0.68 }
        ]
      }
    },
    priceMovement: [
      { time: '09:30', spy: 444.20, spyCall: 2.45, spyPut: 2.15 },
      { time: '09:32', spy: 444.35, spyCall: 2.52, spyPut: 2.08 },
      { time: '09:34', spy: 444.50, spyCall: 2.61, spyPut: 2.01 },
      { time: '09:36', spy: 444.42, spyCall: 2.55, spyPut: 2.05 },
      { time: '09:38', spy: 444.65, spyCall: 2.68, spyPut: 1.95 },
      { time: '09:40', spy: 444.78, spyCall: 2.78, spyPut: 1.88 },
      { time: '09:42', spy: 444.85, spyCall: 2.85, spyPut: 1.82 },
      { time: '09:44', spy: 444.92, spyCall: 2.91, spyPut: 1.76 },
      { time: '09:46', spy: 445.05, spyCall: 3.02, spyPut: 1.68 },
      { time: '09:48', spy: 445.12, spyCall: 3.08, spyPut: 1.62 }
    ]
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('/api/dashboard');
        setData(response.data);
      } catch (error) {
        console.log('Using demo data - backend not connected');
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 10000); // Update every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'EXECUTED': return 'text-blue-400';
      case 'MONITORING': return 'text-yellow-400';
      case 'CLOSED': return 'text-green-400';
      default: return 'text-gray-400';
    }
  };

  const getPnLColor = (pnl) => {
    return pnl.startsWith('+') ? 'text-green-400' : 'text-red-400';
  };

  return (
    <div className="space-y-6">
      {/* Header with Market Status */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Trading Dashboard</h1>
        <div className="flex items-center space-x-4">
          <div className="text-sm">
            <span className="text-gray-400">Market: </span>
            <span className={`font-semibold ${data.marketStatus.isOpen ? 'text-green-400' : 'text-red-400'}`}>
              {data.marketStatus.isOpen ? 'OPEN' : 'CLOSED'}
            </span>
            {data.marketStatus.isOpen && (
              <span className="text-gray-400 ml-2">Closes in {data.marketStatus.timeToClose}</span>
            )}
          </div>
          <div className="text-sm text-gray-400">
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* Automation Status Bar */}
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-white mb-2">Autonomous Trading Status</h3>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-400">Master Control:</span>
            <div className={`w-3 h-3 rounded-full ${data.automationStatus.masterSwitch ? 'bg-green-400' : 'bg-red-400'}`}></div>
            <span className={`text-sm font-semibold ${data.automationStatus.masterSwitch ? 'text-green-400' : 'text-red-400'}`}>
              {data.automationStatus.masterSwitch ? 'ACTIVE' : 'PAUSED'}
            </span>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {Object.entries(data.automationStatus).filter(([key]) => key !== 'masterSwitch' && key !== 'lastSignal').map(([key, value]) => (
            <div key={key} className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${value ? 'bg-green-400' : 'bg-red-400'}`}></div>
              <span className="text-sm text-gray-300 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
        <div className="metric-card">
          <h3 className="text-lg font-semibold text-gray-300 mb-2">Total Trades</h3>
          <p className="text-3xl font-bold text-white">{data.performance.totalTrades.toLocaleString()}</p>
        </div>
        <div className="metric-card">
          <h3 className="text-lg font-semibold text-gray-300 mb-2">Win Rate</h3>
          <p className="text-3xl font-bold text-green-400">{data.performance.winRate}%</p>
        </div>
        <div className="metric-card">
          <h3 className="text-lg font-semibold text-gray-300 mb-2">Total P&L</h3>
          <p className="text-3xl font-bold text-green-400">${data.performance.totalPnL.toLocaleString()}</p>
        </div>
        <div className="metric-card">
          <h3 className="text-lg font-semibold text-gray-300 mb-2">Today's P&L</h3>
          <p className={`text-3xl font-bold ${data.performance.todayPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            ${data.performance.todayPnL.toLocaleString()}
          </p>
        </div>
        <div className="metric-card">
          <h3 className="text-lg font-semibold text-gray-300 mb-2">Active Positions</h3>
          <p className="text-3xl font-bold text-blue-400">{data.performance.activePositions}</p>
        </div>
        <div className="metric-card">
          <h3 className="text-lg font-semibold text-gray-300 mb-2">Day Trades</h3>
          <p className="text-3xl font-bold text-yellow-400">{data.performance.dayTradesUsed}/3</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Real-time Price Movement */}
        <div className="trading-card">
          <h2 className="text-xl font-bold text-white mb-4">SPY Call/Put Movement (2min)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.priceMovement}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="time" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                labelStyle={{ color: '#F3F4F6' }}
              />
              <Legend />
              <Line type="monotone" dataKey="spyCall" stroke="#10B981" strokeWidth={2} name="SPY Call $444" />
              <Line type="monotone" dataKey="spyPut" stroke="#EF4444" strokeWidth={2} name="SPY Put $444" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Option Chain Heatmap */}
        <div className="trading-card">
          <h2 className="text-xl font-bold text-white mb-4">SPY Option Chain</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-semibold text-green-400 mb-2">CALLS</h4>
              {data.optionChain.spy.calls.map((option, index) => (
                <div key={index} className="flex justify-between items-center py-1 px-2 bg-gray-700 rounded mb-1">
                  <span className="text-sm text-white">${option.strike}</span>
                  <span className="text-sm text-green-400">${option.price}</span>
                  <span className="text-xs text-gray-400">{option.volume}</span>
                </div>
              ))}
            </div>
            <div>
              <h4 className="text-sm font-semibold text-red-400 mb-2">PUTS</h4>
              {data.optionChain.spy.puts.map((option, index) => (
                <div key={index} className="flex justify-between items-center py-1 px-2 bg-gray-700 rounded mb-1">
                  <span className="text-sm text-white">${option.strike}</span>
                  <span className="text-sm text-red-400">${option.price}</span>
                  <span className="text-xs text-gray-400">{option.volume}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Cost Optimization */}
      <div className="trading-card">
        <h2 className="text-xl font-bold text-white mb-4">Cost Optimization</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <h4 className="text-sm text-gray-400">Monthly Savings</h4>
            <p className="text-2xl font-bold text-green-400">${data.costOptimization.monthlySavings}</p>
          </div>
          <div>
            <h4 className="text-sm text-gray-400">Savings Percentage</h4>
            <p className="text-2xl font-bold text-green-400">{data.costOptimization.savingsPercentage}%</p>
          </div>
          <div>
            <h4 className="text-sm text-gray-400">Current Cost</h4>
            <p className="text-2xl font-bold text-blue-400">${data.costOptimization.currentCost}/mo</p>
          </div>
          <div>
            <h4 className="text-sm text-gray-400">Enterprise Cost</h4>
            <p className="text-2xl font-bold text-gray-400">${data.costOptimization.enterpriseCost}/mo</p>
          </div>
        </div>
      </div>

      {/* Recent Signals & Trades */}
      <div className="trading-card">
        <h2 className="text-xl font-bold text-white mb-4">Recent Signals & Trades</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-2 text-gray-300">Time</th>
                <th className="text-left py-2 text-gray-300">Symbol</th>
                <th className="text-left py-2 text-gray-300">Type</th>
                <th className="text-left py-2 text-gray-300">Strike</th>
                <th className="text-left py-2 text-gray-300">Entry</th>
                <th className="text-left py-2 text-gray-300">Current</th>
                <th className="text-left py-2 text-gray-300">P&L</th>
                <th className="text-left py-2 text-gray-300">Status</th>
                <th className="text-left py-2 text-gray-300">Confidence</th>
              </tr>
            </thead>
            <tbody>
              {data.recentSignals.map((signal) => (
                <tr key={signal.id} className="border-b border-gray-800">
                  <td className="py-2 text-gray-300">{signal.time}</td>
                  <td className="py-2 text-white font-semibold">{signal.symbol}</td>
                  <td className={`py-2 font-semibold ${signal.type === 'CALL' ? 'text-green-400' : 'text-red-400'}`}>
                    {signal.type}
                  </td>
                  <td className="py-2 text-gray-300">${signal.strike}</td>
                  <td className="py-2 text-gray-300">${signal.entry}</td>
                  <td className="py-2 text-gray-300">${signal.current || signal.exit || '-'}</td>
                  <td className={`py-2 font-semibold ${getPnLColor(signal.pnl)}`}>{signal.pnl}</td>
                  <td className={`py-2 font-semibold ${getStatusColor(signal.status)}`}>{signal.status}</td>
                  <td className="py-2">
                    <span className={`font-semibold ${signal.confidence >= 80 ? 'text-green-400' : 'text-yellow-400'}`}>
                      {signal.confidence}%
                    </span>
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

export default Dashboard;

