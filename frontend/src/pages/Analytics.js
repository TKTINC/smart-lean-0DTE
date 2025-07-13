import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, ScatterChart, Scatter } from 'recharts';
import axios from 'axios';

const Analytics = () => {
  const [timeframe, setTimeframe] = useState('1M');
  const [selectedStrategy, setSelectedStrategy] = useState('ALL');
  
  const [performanceData, setPerformanceData] = useState({
    equity: [
      { date: '2024-06-01', value: 10000, drawdown: 0 },
      { date: '2024-06-15', value: 12500, drawdown: -2.1 },
      { date: '2024-07-01', value: 15200, drawdown: -1.8 },
      { date: '2024-07-15', value: 18900, drawdown: -3.2 },
      { date: '2024-08-01', value: 22100, drawdown: -1.5 },
      { date: '2024-08-15', value: 26800, drawdown: -2.8 },
      { date: '2024-09-01', value: 31200, drawdown: -1.2 },
      { date: '2024-09-15', value: 35600, drawdown: -2.5 },
      { date: '2024-10-01', value: 39800, drawdown: -1.9 },
      { date: '2024-10-15', value: 43200, drawdown: -1.1 },
      { date: '2024-11-01', value: 47500, drawdown: -2.3 },
      { date: '2024-11-15', value: 51200, drawdown: -1.7 }
    ],
    dailyReturns: [
      { date: '2024-11-01', return: 2.3, cumulative: 412.0 },
      { date: '2024-11-02', return: -0.8, cumulative: 408.7 },
      { date: '2024-11-03', return: 1.5, cumulative: 414.8 },
      { date: '2024-11-04', return: 3.2, cumulative: 428.1 },
      { date: '2024-11-05', return: -1.2, cumulative: 422.9 },
      { date: '2024-11-06', return: 2.8, cumulative: 434.7 },
      { date: '2024-11-07', return: 0.5, cumulative: 436.9 },
      { date: '2024-11-08', return: 1.9, cumulative: 445.2 },
      { date: '2024-11-09', return: -0.3, cumulative: 443.9 },
      { date: '2024-11-10', return: 2.1, cumulative: 453.2 }
    ],
    strategyPerformance: [
      { strategy: 'Momentum Breakout', trades: 342, winRate: 82.5, avgReturn: 3.2, totalPnL: 18500, sharpe: 2.1 },
      { strategy: 'Mean Reversion', trades: 298, winRate: 76.8, avgReturn: 2.8, totalPnL: 14200, sharpe: 1.8 },
      { strategy: 'Gap Fill', trades: 156, winRate: 84.6, avgReturn: 4.1, totalPnL: 9800, sharpe: 2.3 },
      { strategy: 'VIX Spike', trades: 89, winRate: 79.8, avgReturn: 5.2, totalPnL: 7200, sharpe: 1.9 },
      { strategy: 'Earnings Play', trades: 67, winRate: 71.6, avgReturn: 6.8, totalPnL: 5100, sharpe: 1.6 }
    ],
    riskMetrics: {
      sharpeRatio: 2.05,
      maxDrawdown: -3.2,
      calmarRatio: 15.6,
      winRate: 78.5,
      avgWin: 4.2,
      avgLoss: -2.1,
      profitFactor: 2.8,
      expectancy: 1.85,
      volatility: 12.3,
      beta: 0.85,
      alpha: 8.2,
      informationRatio: 1.92
    },
    monthlyReturns: [
      { month: 'Jan', return: 8.2 },
      { month: 'Feb', return: 12.5 },
      { month: 'Mar', return: -2.1 },
      { month: 'Apr', return: 15.8 },
      { month: 'May', return: 9.3 },
      { month: 'Jun', return: 18.7 },
      { month: 'Jul', return: 22.1 },
      { month: 'Aug', return: 14.6 },
      { month: 'Sep', return: 19.2 },
      { month: 'Oct', return: 11.8 },
      { month: 'Nov', return: 16.4 }
    ],
    tradeDistribution: [
      { range: '0-5%', count: 156, color: '#10B981' },
      { range: '5-10%', count: 298, color: '#059669' },
      { range: '10-20%', count: 342, color: '#047857' },
      { range: '20%+', count: 89, color: '#065F46' },
      { range: 'Losses', count: 267, color: '#EF4444' }
    ],
    learningMetrics: {
      modelAccuracy: 84.2,
      predictionConfidence: 78.5,
      adaptationRate: 92.1,
      dataQuality: 96.8,
      signalStrength: 87.3,
      marketRegimeDetection: 89.6
    }
  });

  const [backtestResults, setBacktestResults] = useState({
    totalReturn: 412.0,
    annualizedReturn: 156.8,
    maxDrawdown: -3.2,
    sharpeRatio: 2.05,
    totalTrades: 1247,
    winningTrades: 979,
    losingTrades: 268,
    winRate: 78.5,
    avgWinningTrade: 4.2,
    avgLosingTrade: -2.1,
    largestWin: 28.5,
    largestLoss: -12.3,
    profitFactor: 2.8,
    expectancy: 1.85
  });

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await axios.get(`/api/analytics?timeframe=${timeframe}&strategy=${selectedStrategy}`);
        setPerformanceData(response.data.performance);
        setBacktestResults(response.data.backtest);
      } catch (error) {
        console.log('Using demo analytics data - backend not connected');
      }
    };

    fetchAnalytics();
  }, [timeframe, selectedStrategy]);

  const COLORS = ['#10B981', '#059669', '#047857', '#065F46', '#EF4444'];

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Advanced Analytics</h1>
        <div className="flex items-center space-x-4">
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="bg-gray-700 text-white rounded px-3 py-2 border border-gray-600"
          >
            <option value="1W">1 Week</option>
            <option value="1M">1 Month</option>
            <option value="3M">3 Months</option>
            <option value="6M">6 Months</option>
            <option value="1Y">1 Year</option>
            <option value="ALL">All Time</option>
          </select>
          <select
            value={selectedStrategy}
            onChange={(e) => setSelectedStrategy(e.target.value)}
            className="bg-gray-700 text-white rounded px-3 py-2 border border-gray-600"
          >
            <option value="ALL">All Strategies</option>
            <option value="Momentum Breakout">Momentum Breakout</option>
            <option value="Mean Reversion">Mean Reversion</option>
            <option value="Gap Fill">Gap Fill</option>
            <option value="VIX Spike">VIX Spike</option>
            <option value="Earnings Play">Earnings Play</option>
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <div className="metric-card">
          <h3 className="text-sm font-semibold text-gray-400 mb-1">Total Return</h3>
          <p className="text-2xl font-bold text-green-400">{backtestResults.totalReturn}%</p>
        </div>
        <div className="metric-card">
          <h3 className="text-sm font-semibold text-gray-400 mb-1">Annualized</h3>
          <p className="text-2xl font-bold text-green-400">{backtestResults.annualizedReturn}%</p>
        </div>
        <div className="metric-card">
          <h3 className="text-sm font-semibold text-gray-400 mb-1">Sharpe Ratio</h3>
          <p className="text-2xl font-bold text-blue-400">{backtestResults.sharpeRatio}</p>
        </div>
        <div className="metric-card">
          <h3 className="text-sm font-semibold text-gray-400 mb-1">Max Drawdown</h3>
          <p className="text-2xl font-bold text-red-400">{backtestResults.maxDrawdown}%</p>
        </div>
        <div className="metric-card">
          <h3 className="text-sm font-semibold text-gray-400 mb-1">Win Rate</h3>
          <p className="text-2xl font-bold text-green-400">{backtestResults.winRate}%</p>
        </div>
        <div className="metric-card">
          <h3 className="text-sm font-semibold text-gray-400 mb-1">Profit Factor</h3>
          <p className="text-2xl font-bold text-blue-400">{backtestResults.profitFactor}</p>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Equity Curve */}
        <div className="trading-card">
          <h2 className="text-xl font-bold text-white mb-4">Equity Curve & Drawdown</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={performanceData.equity}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                labelStyle={{ color: '#F3F4F6' }}
              />
              <Legend />
              <Line type="monotone" dataKey="value" stroke="#10B981" strokeWidth={2} name="Portfolio Value" />
              <Line type="monotone" dataKey="drawdown" stroke="#EF4444" strokeWidth={2} name="Drawdown %" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Daily Returns */}
        <div className="trading-card">
          <h2 className="text-xl font-bold text-white mb-4">Daily Returns Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={performanceData.dailyReturns}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                labelStyle={{ color: '#F3F4F6' }}
              />
              <Bar dataKey="return" fill="#10B981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Strategy Performance */}
        <div className="trading-card">
          <h2 className="text-xl font-bold text-white mb-4">Strategy Performance Comparison</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={performanceData.strategyPerformance}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="strategy" stroke="#9CA3AF" angle={-45} textAnchor="end" height={80} />
              <YAxis stroke="#9CA3AF" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                labelStyle={{ color: '#F3F4F6' }}
              />
              <Bar dataKey="totalPnL" fill="#10B981" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Trade Distribution */}
        <div className="trading-card">
          <h2 className="text-xl font-bold text-white mb-4">Trade P&L Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={performanceData.tradeDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ range, count }) => `${range}: ${count}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {performanceData.tradeDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Risk Metrics */}
      <div className="trading-card">
        <h2 className="text-xl font-bold text-white mb-4">Risk & Performance Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <h4 className="text-lg font-semibold text-gray-300 mb-3">Return Metrics</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Sharpe Ratio:</span>
                <span className="text-white font-semibold">{performanceData.riskMetrics.sharpeRatio}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Calmar Ratio:</span>
                <span className="text-white font-semibold">{performanceData.riskMetrics.calmarRatio}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Information Ratio:</span>
                <span className="text-white font-semibold">{performanceData.riskMetrics.informationRatio}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Alpha:</span>
                <span className="text-green-400 font-semibold">{performanceData.riskMetrics.alpha}%</span>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold text-gray-300 mb-3">Risk Metrics</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Max Drawdown:</span>
                <span className="text-red-400 font-semibold">{performanceData.riskMetrics.maxDrawdown}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Volatility:</span>
                <span className="text-white font-semibold">{performanceData.riskMetrics.volatility}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Beta:</span>
                <span className="text-white font-semibold">{performanceData.riskMetrics.beta}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Win Rate:</span>
                <span className="text-green-400 font-semibold">{performanceData.riskMetrics.winRate}%</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-semibold text-gray-300 mb-3">Trade Metrics</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Avg Win:</span>
                <span className="text-green-400 font-semibold">{performanceData.riskMetrics.avgWin}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Avg Loss:</span>
                <span className="text-red-400 font-semibold">{performanceData.riskMetrics.avgLoss}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Profit Factor:</span>
                <span className="text-white font-semibold">{performanceData.riskMetrics.profitFactor}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Expectancy:</span>
                <span className="text-green-400 font-semibold">{performanceData.riskMetrics.expectancy}%</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-semibold text-gray-300 mb-3">AI Learning Metrics</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Model Accuracy:</span>
                <span className="text-blue-400 font-semibold">{performanceData.learningMetrics.modelAccuracy}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Prediction Confidence:</span>
                <span className="text-blue-400 font-semibold">{performanceData.learningMetrics.predictionConfidence}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Adaptation Rate:</span>
                <span className="text-green-400 font-semibold">{performanceData.learningMetrics.adaptationRate}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Signal Strength:</span>
                <span className="text-yellow-400 font-semibold">{performanceData.learningMetrics.signalStrength}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Strategy Breakdown Table */}
      <div className="trading-card">
        <h2 className="text-xl font-bold text-white mb-4">Strategy Performance Breakdown</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-2 text-gray-300">Strategy</th>
                <th className="text-left py-2 text-gray-300">Trades</th>
                <th className="text-left py-2 text-gray-300">Win Rate</th>
                <th className="text-left py-2 text-gray-300">Avg Return</th>
                <th className="text-left py-2 text-gray-300">Total P&L</th>
                <th className="text-left py-2 text-gray-300">Sharpe Ratio</th>
                <th className="text-left py-2 text-gray-300">Performance</th>
              </tr>
            </thead>
            <tbody>
              {performanceData.strategyPerformance.map((strategy, index) => (
                <tr key={index} className="border-b border-gray-800">
                  <td className="py-2 text-white font-semibold">{strategy.strategy}</td>
                  <td className="py-2 text-gray-300">{strategy.trades}</td>
                  <td className="py-2 text-green-400 font-semibold">{strategy.winRate}%</td>
                  <td className="py-2 text-blue-400 font-semibold">{strategy.avgReturn}%</td>
                  <td className="py-2 text-green-400 font-semibold">${strategy.totalPnL.toLocaleString()}</td>
                  <td className="py-2 text-white font-semibold">{strategy.sharpe}</td>
                  <td className="py-2">
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-green-400 h-2 rounded-full" 
                        style={{ width: `${(strategy.winRate / 100) * 100}%` }}
                      ></div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Monthly Returns Heatmap */}
      <div className="trading-card">
        <h2 className="text-xl font-bold text-white mb-4">Monthly Returns</h2>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={performanceData.monthlyReturns}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="month" stroke="#9CA3AF" />
            <YAxis stroke="#9CA3AF" />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
              labelStyle={{ color: '#F3F4F6' }}
            />
            <Bar dataKey="return" fill="#10B981" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Analytics;

