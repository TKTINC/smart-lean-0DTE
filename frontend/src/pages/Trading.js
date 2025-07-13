import React, { useState, useEffect } from 'react';

const Trading = ({ isConnected }) => {
  const [positions, setPositions] = useState([]);
  const [orders, setOrders] = useState([]);
  const [tradingEnabled, setTradingEnabled] = useState(false);

  const mockPositions = [
    { id: 1, symbol: 'SPY', type: 'CALL', strike: 445, quantity: 10, avgPrice: 2.45, currentPrice: 2.67, pnl: 220, pnlPercent: 8.98 },
    { id: 2, symbol: 'QQQ', type: 'PUT', strike: 375, quantity: -5, avgPrice: 1.85, currentPrice: 1.62, pnl: 115, pnlPercent: 12.43 },
    { id: 3, symbol: 'IWM', type: 'CALL', strike: 195, quantity: 15, avgPrice: 1.23, currentPrice: 1.45, pnl: 330, pnlPercent: 17.89 }
  ];

  const mockOrders = [
    { id: 1, symbol: 'SPY', type: 'CALL', strike: 446, action: 'BUY', quantity: 5, price: 2.30, status: 'PENDING', time: '14:23:15' },
    { id: 2, symbol: 'QQQ', type: 'PUT', strike: 374, action: 'SELL', quantity: 3, price: 1.95, status: 'FILLED', time: '14:20:45' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Trading</h1>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-400">Auto Trading</span>
            <button
              onClick={() => setTradingEnabled(!tradingEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                tradingEnabled ? 'bg-green-600' : 'bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  tradingEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          <div className="text-sm text-gray-400">
            {isConnected ? 'Live Trading' : 'Demo Mode'}
          </div>
        </div>
      </div>

      {/* Trading Status */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <p className="text-sm text-gray-400">Account Balance</p>
            <p className="text-2xl font-bold text-white">$125,430</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-400">Buying Power</p>
            <p className="text-2xl font-bold text-green-400">$89,250</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-400">Day P&L</p>
            <p className="text-2xl font-bold text-green-400">+$1,234</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-400">Open Positions</p>
            <p className="text-2xl font-bold text-blue-400">{mockPositions.length}</p>
          </div>
        </div>
      </div>

      {/* Current Positions */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">Current Positions</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Symbol</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Strike</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Quantity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Avg Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Current</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">P&L</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {mockPositions.map((position) => (
                <tr key={position.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{position.symbol}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{position.type}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">${position.strike}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{position.quantity}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">${position.avgPrice}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">${position.currentPrice}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm">
                      <div className={position.pnl >= 0 ? 'text-green-400' : 'text-red-400'}>
                        ${position.pnl} ({position.pnlPercent > 0 ? '+' : ''}{position.pnlPercent}%)
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button className="text-red-400 hover:text-red-300 mr-2">Close</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">Recent Orders</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Symbol</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Strike</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Action</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Quantity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {mockOrders.map((order) => (
                <tr key={order.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{order.symbol}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{order.type}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">${order.strike}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      order.action === 'BUY' ? 'bg-green-900 text-green-200' : 'bg-red-900 text-red-200'
                    }`}>
                      {order.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{order.quantity}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">${order.price}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      order.status === 'FILLED' ? 'bg-green-900 text-green-200' : 
                      order.status === 'PENDING' ? 'bg-yellow-900 text-yellow-200' : 'bg-red-900 text-red-200'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{order.time}</td>
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

