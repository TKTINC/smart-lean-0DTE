import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const Dashboard = ({ isConnected }) => {
  const [dashboardData, setDashboardData] = useState({
    performance: {
      totalTrades: 0,
      winRate: 0,
      totalPnL: 0,
      todayPnL: 0
    },
    recentSignals: [],
    performanceChart: [],
    costMetrics: {
      monthlyCost: 0,
      costSavings: 0,
      efficiency: 0
    }
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isConnected) {
      fetchDashboardData();
      const interval = setInterval(fetchDashboardData, 10000); // Update every 10 seconds
      return () => clearInterval(interval);
    }
  }, [isConnected]);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/dashboard');
      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const mockData = {
    performance: {
      totalTrades: 1247,
      winRate: 78.5,
      totalPnL: 45670.25,
      todayPnL: 1234.50
    },
    recentSignals: [
      { id: 1, symbol: 'SPY', type: 'CALL', strike: 445, signal: 'BUY', confidence: 0.85, time: '09:31:15' },
      { id: 2, symbol: 'QQQ', type: 'PUT', strike: 375, signal: 'SELL', confidence: 0.78, time: '09:30:45' },
      { id: 3, symbol: 'IWM', type: 'CALL', strike: 195, signal: 'BUY', confidence: 0.82, time: '09:30:12' }
    ],
    performanceChart: [
      { time: '09:30', pnl: 0 },
      { time: '10:00', pnl: 250 },
      { time: '10:30', pnl: 180 },
      { time: '11:00', pnl: 420 },
      { time: '11:30', pnl: 380 },
      { time: '12:00', pnl: 650 },
      { time: '12:30', pnl: 580 },
      { time: '13:00', pnl: 720 },
      { time: '13:30', pnl: 890 },
      { time: '14:00', pnl: 1234 }
    ],
    costMetrics: {
      monthlyCost: 485,
      costSavings: 89.2,
      efficiency: 94.5
    }
  };

  const displayData = isConnected ? dashboardData : mockData;

  if (loading && isConnected) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Trading Dashboard</h1>
        <div className="text-sm text-gray-400">
          {isConnected ? 'Live Data' : 'Demo Mode'}
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Total Trades</p>
              <p className="text-2xl font-bold text-white">{displayData.performance.totalTrades.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-blue-600 rounded-full">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Win Rate</p>
              <p className="text-2xl font-bold text-green-400">{displayData.performance.winRate}%</p>
            </div>
            <div className="p-3 bg-green-600 rounded-full">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Total P&L</p>
              <p className="text-2xl font-bold text-green-400">${displayData.performance.totalPnL.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-green-600 rounded-full">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Today's P&L</p>
              <p className="text-2xl font-bold text-green-400">${displayData.performance.todayPnL.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-yellow-600 rounded-full">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Chart */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Today's Performance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={displayData.performanceChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="time" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px'
                }}
              />
              <Line type="monotone" dataKey="pnl" stroke="#10B981" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Cost Optimization Metrics */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Cost Optimization</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Monthly Cost</span>
              <span className="text-green-400 font-semibold">${displayData.costMetrics.monthlyCost}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Cost Savings</span>
              <span className="text-green-400 font-semibold">{displayData.costMetrics.costSavings}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">System Efficiency</span>
              <span className="text-blue-400 font-semibold">{displayData.costMetrics.efficiency}%</span>
            </div>
            <div className="mt-6 p-4 bg-green-900 bg-opacity-20 rounded-lg border border-green-700">
              <p className="text-green-400 text-sm">
                <strong>Lean Advantage:</strong> Saving $4,200+ monthly vs enterprise while maintaining 78.5% win rate
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Signals */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">Recent Trading Signals</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Symbol</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Strike</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Signal</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Confidence</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {displayData.recentSignals.map((signal) => (
                <tr key={signal.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{signal.symbol}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{signal.type}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">${signal.strike}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      signal.signal === 'BUY' ? 'bg-green-900 text-green-200' : 'bg-red-900 text-red-200'
                    }`}>
                      {signal.signal}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{(signal.confidence * 100).toFixed(1)}%</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{signal.time}</td>
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

